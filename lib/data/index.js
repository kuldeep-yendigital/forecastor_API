const crypto = require('crypto');
const SQLStream = require('forecaster-common/lib/memsql/stream');
const PromiseQuery = require('./promiseQuery');
const redis = require('../redis');
const Stream = require('stream');
const cloneDeep = require('lodash/cloneDeep');
const forEach = require('lodash/forEach');
const queryConstructor = require('forecaster-common/lib/memsql/query');
const SourceStream = require('forecaster-common/lib/memsql/transforms/source');
const hierarchicalDimension = require('./hierarchical_dimension');
const hierarchicalDimensionParser = require('./response').hierarchicalDimensionParser;
const metrics = require('./metrics');
const metricsParser = require('./response').metricsParser;
const dimensionFields = require('./dimension_fields');
const moment = require('moment');
const axios = require('axios');
const {
  getPool
} = require('../database');
const {
  getLogger
} = require('../logger');

const alertFreeze = require('./../../config').microService.alertFreeze;
const isDateKey = key => key.match(/^\d+\/\d+\/\d+$/gi);
const isRecordStatusKey = key => key.match(/^recordstatus_\d+\/\d+\/\d+$/gi);
const isLastUpdatedDateKey = key => key.match(/^lastupdateddate_\d+\/\d+\/\d+$/gi);
const complexMetricColumns = [
  'geographylevel1',
  'geographylevel2',
  'geographylevel3',
  'companyname',
  'serviceslevel1',
  'serviceslevel2',
  'serviceslevel3',
  'serviceslevel4',
  'serviceslevel5',
  'serviceslevel6',
  'technologylevel1',
  'technologylevel2',
  'technologylevel3',
  'technologylevel4',
  'technologylevel5',
  'technologylevel6',
  'billingtypelevel1',
  'billingtypelevel2',
  'billingtypelevel3',
  'billingtypelevel4',
  'billingtypelevel5'
];
const QUERYTYPES = {
  FILTERED: 'querytype_filtered',
  NORMAL: 'querytype_normal'
};

const FROZEN = 'frozen';
const FROZEN_TIMEOUT_SECONDS = 120;
const TIMEFRAME_YEARS = 8;
const RECORD_STATUS_DELETED = 'Deleted';
const RECORD_STATUS_NEW = 'New';
const RECORD_STATUS_UPDATED = 'Updated';

const isFrozen = () => {
  return new Promise((resolve, reject) => {
    setTimeout(reject, FROZEN_TIMEOUT_SECONDS * 1000, FROZEN);
  });
};

const isLessThanNbYears = (params, nbYears) => {
  const start = moment(params.query.range.start);
  const end = moment(params.query.range.end);

  return nbYears >= end.diff(start, 'years');
};

const calculateStatus = concatStatus => {
  if (!concatStatus) {
    return '';
  }

  const statuses = concatStatus.split(',');
  const deletedFiltered = statuses.filter(x => x === RECORD_STATUS_DELETED);
  const updatedFiltered = statuses.filter(x => x === RECORD_STATUS_UPDATED);
  const newFiltered = statuses.filter(x => x === RECORD_STATUS_NEW);

  if (deletedFiltered.length === statuses.length) {
    return RECORD_STATUS_DELETED;
  }
  if (updatedFiltered.length === statuses.length) {
    return RECORD_STATUS_UPDATED;
  }
  if (newFiltered.length === statuses.length) {
    return RECORD_STATUS_NEW;
  }

  return RECORD_STATUS_UPDATED;
};
const calculateLastUpdatedDate = concatLastUpdatedDate => {
  const moments = concatLastUpdatedDate.split(',').map(x => moment(x));
  return moment.max(moments).format('DD/MM/YYYY');
};

function setSQLDatapoints(data, customerApi = false) {
  const res = data.map((item) => {
    item.datapoints = [];
    Object.keys(item).forEach((key) => {
      if (isDateKey(key)) {
        const status = calculateStatus(item[`recordstatus_${key}`]);
        const record = {
          id: item[`ID_${key}`],
          month: key,
          value: (!customerApi && (status === RECORD_STATUS_DELETED)) ? null : item[key],
          name: item[`avg_${key}`],
          recordstatus: status,
          lastupdateddate: item[`lastupdateddate_${key}`] && calculateLastUpdatedDate(item[`lastupdateddate_${key}`])
        };
        item.datapoints.push(record);
      }

      if (isRecordStatusKey(key)) {
        item[key] = calculateStatus(item[key]);
      }

      if (isLastUpdatedDateKey(key) && item[key]) {
        item[key] = calculateLastUpdatedDate(item[key]);
      }
    });
    return item;
  });

  return customerApi
    ? res
    : res.filter(x => x.datapoints.find(x => (x.recordstatus && (x.recordstatus !== RECORD_STATUS_DELETED))));
}

class DataStream extends Stream.Readable {

  constructor(options) {
    super();
    this.options = options;
    this.redis = redis(options);
    this.data = [];
    const sqloptions = Object.assign({}, this.options.config.memsql, {
      logger: {
        cloudwatch: this.options.config.cloudwatch,
        logLevel: this.options.config.logLevel
      }
    });
    this.sqlStream = new SQLStream(sqloptions, getPool(sqloptions));
    this.logger = getLogger();
  }

  _read() {}

  checkCache(cacheKey) {
    return this.redis.get(cacheKey);
  }

  fetch(query) {
    console.log(query,"<<api log");
    return this.sqlStream.connect().then(() => {
      this.sqlStream.query(query);
      return this.sqlStream;
    });
  }

  query(params) {
    const ctx = this;
    const query = Object.assign({
      subscriptions: params.subscriptions
    }, params.query);
    const type = query.columnFilters && Object.keys(query.columnFilters).length > 0 ? QUERYTYPES.FILTERED : QUERYTYPES.NORMAL;

    if (!query.hasOwnProperty('subscriptions') || !Array.isArray(query.subscriptions)) {
      throw new Error('No valid subscription found.');
    }

    if (params.subscriptions.length === 0) {
      throw new Error('No valid subscription found.');
    }

    const fetchAndSetCache = (count_sql, count_sql_alt, sql, cacheKey, filtered = false, customerApi = false) => {
      // Run a promise for the count, then start the data stream.
      // At the end, append the count as a property and save it in
      // the cache.
      // Count both a normal and a complex query

      let rowCount = 0;
      let rowCountAlt = 0;

      const pQuery = new PromiseQuery();

      const racing = (isLessThanNbYears(params, TIMEFRAME_YEARS) && alertFreeze.activated)
        ? [pQuery.connect(), isFrozen()]
        : [pQuery.connect()];

      Promise
        .race(racing)
        .then(() => {
          if (filtered) {
            return [{count: -1}];
          }
          else {
            return pQuery.query(count_sql);
          }
        })
        .then((result) => {
          rowCount = result[0].count
        })
        .then(() => {
          if (count_sql_alt) {
            const pQuery2 = new PromiseQuery();
            return pQuery2.connect().then(() => pQuery2.query(count_sql_alt));
          }
          else {
            return [{count: -1}];
          }
        })
        .then((result) => {
          rowCountAlt = result[0].count;
        })
        .then(() => this.fetch(sql))
        .then(sqlStream => {
          sqlStream.pipe(SourceStream())
            .on('data', chunk => {
              this.data.push(chunk)
            })
            .on('end', () => {
              // this.data[0].recordstatus
              const response = {
                records: setSQLDatapoints(this.data, customerApi),
                rowCount: rowCount,
                rowCountAlt: rowCountAlt
              };

              if (ctx.options.config.memsql.logQueries) {
                response.sql = sql;
              }

              if (cacheKey) {
                this.redis.set(cacheKey, JSON.stringify(response), 'ex', this.options.config.redisCluster.TTL).then(() => {
                  this.push(JSON.stringify(response));
                  this.push(null);

                  this.jsonData = response;
                  this.emit('end');
                });
              } else {
                this.push(JSON.stringify(response));
                this.push(null);

                this.jsonData = response;
                this.emit('end');
              }
            });
        })
        .catch((err) => {
          if (err === FROZEN) {
            axios.post(alertFreeze.createUrl);
          }
          this.logger.debug(err);
        })
      ;
    };

    const complexQuery = cloneDeep(query);
    forEach(complexMetricColumns, (cMetricCol) => {
      if (complexQuery.columnKeys.indexOf(cMetricCol) === -1) {
        complexQuery.columnKeys.push(cMetricCol);
      }
    });

    const cacheKey = crypto.createHash('md5').update(JSON.stringify(query)).digest('hex');
    let sql;
    let count_sql;
    let count_sql_alt;

    if (type === QUERYTYPES.FILTERED) {
      sql = queryConstructor(query, params.page_size, false, false, true);
    }
    else if (type === QUERYTYPES.NORMAL) {
      count_sql = queryConstructor(cloneDeep(query), params.page_size, true);
      count_sql_alt = queryConstructor(complexQuery, params.page_size, true);
      sql = queryConstructor(query, params.page_size);
    }

    if (!ctx.options.config.cache.query) {
      this.logger.debug('Query cache is off.\n');

      return fetchAndSetCache(count_sql, count_sql_alt, sql, null, (type === QUERYTYPES.FILTERED), params.customerApi);
    } else {
      this.logger.debug('Query cache is on.\n');

      this.checkCache(cacheKey).then(cacheEntry => {
        if (!cacheEntry) {
          this.logger.debug('No cache entry found.\n');

          fetchAndSetCache(count_sql, count_sql_alt, sql, cacheKey, (type === QUERYTYPES.FILTERED), params.customerApi);
        } else {
          this.logger.debug('Cache entry found.\n');

          const response = JSON.parse(cacheEntry);

          this.push(JSON.stringify(response));
          this.push(null);

          this.jsonData = response;
          this.emit('end');
        }
      });
    }
  }

  dimensions(params) {
    const ctx = this;
    const cacheKey = crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
    this.checkCache(cacheKey).then(cacheEntry => {
      if (!cacheEntry || !ctx.options.config.cache.dimensions) {
        const queryOptions = dimensionFields[params.dimension.toLowerCase()];
        const sql = hierarchicalDimension(queryOptions, params.subscriptions);

        this.fetch(sql).then(sqlStream => {
          sqlStream.on('data', (chunk) => {
            this.data.push(chunk);
          })
            .on('end', () => {
              this.redis.set(cacheKey, JSON.stringify(this.data), 'ex', this.options.config.redisCluster.TTL).then(() => {
                const response = hierarchicalDimensionParser(this.data);
                this.push(JSON.stringify(response));
                this.push(null);
              });
            });
        });
      } else {
        const response = hierarchicalDimensionParser(JSON.parse(cacheEntry));
        this.push(JSON.stringify(response));
        this.push(null);
      }
    });
  }

  metrics(params) {
    const ctx = this;
    const cacheKey = crypto.createHash('md5').update(JSON.stringify(['metric', params])).digest('hex');
    this.checkCache(cacheKey).then(cacheEntry => {
      if (!cacheEntry || !ctx.options.config.cache.dimensions) {
        const sql = metrics(params.subscriptions);

        this.fetch(sql).then(sqlStream => {
          sqlStream.on('data', (chunk) => {
            this.data.push(chunk);
          })
            .on('end', () => {
              this.redis.set(cacheKey, JSON.stringify(this.data), 'ex', this.options.config.redisCluster.TTL).then(() => {
                const response = metricsParser(this.data);
                this.push(JSON.stringify(response));
                this.push(null);
              });
            });
        });
      } else {
        const response = metricsParser(JSON.parse(cacheEntry));
        this.push(JSON.stringify(response));
        this.push(null);
      }
    });
  }
}

module.exports = DataStream;