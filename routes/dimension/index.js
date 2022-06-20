const config = require('./../../config');
const express = require('express');
const DataStream = require('./../../lib/data');
const crypto = require('crypto');
const queryConstructor = require('forecaster-common/lib/memsql/query');
const PromiseQuery = require('../../lib/data/promiseQuery');
const forEach = require('lodash/forEach');
const findIndex = require('lodash/findIndex');
const cloneDeep = require('lodash/cloneDeep');
const redis = require('../../lib/redis');
const { getWebsocket } = require('../../lib/websocket');
const router = express.Router();

router.post('/dimensions/filterDistinct', (req, res) => {
  const socketClientId = req.body.client_id;
  const { io } = getWebsocket();
  const query = req.body.query;
  query.column = req.body.dimension;
  const page_size = req.body.page_size;
  
  res.status(202).json({
    message: 'Query accepted, data will follow in the socket.'
  });

  const redisClient = redis(config);
  const cacheKey = crypto.createHash('md5').update(JSON.stringify(query)).digest('hex');
  const sql = queryConstructor(query, page_size, false, true);
    redisClient.get(cacheKey).then((cached) => {
      if (!cached || !config.cache.dimensions) {
        const pQuery = new PromiseQuery();
        return pQuery
          .connect()
          .then(() => {
            return pQuery.query(sql);
          })
          .then((result) => {
            redisClient.set(cacheKey, JSON.stringify(result));
            return result;
          });
      }
      else {
        return JSON.parse(cached);
      }
    }).then((finalResult) => {
      io.sockets.in(socketClientId).emit('dimensionDistinct', finalResult);
    });
});

router.post('/dimensions/hierarchy/count', (req, res) => {
  try {
    const socketClientId = req.body.client_id;
    const { io } = getWebsocket();
    const dimensions = req.body.count_dimensions;
    const promises = [];

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

    res.status(202).json({
      message: 'Query accepted, data will follow in the socket'
    }); 
      
    forEach(dimensions, (dimension, key) => {
      forEach(dimension, (entry) => {
        // For each entry, collect all the leaf nodes
        const leafNodes = recurseLeafNodes(entry);
        // Remove the current dimension from the query
        const newFilters = {};
        forEach(req.body.query.compositeFilters, (filter, filterName) => {
          if (filterName !== key) {
            newFilters[filterName] = filter;
          }
        });
        req.body.query.compositeFilters = newFilters;

        const query = cloneDeep(req.body.query);
        // Inject the level in the query, to avoid cache key collisions
        query.level = entry.level;

        leafNodes.forEach((leafNode) => {
          // On top of a collective parent query, run a leaf node query
          // to determine which of the children may hold data
          const leafQuery = cloneDeep(req.body.query);

          const existsInQuery = findIndex(query.compositeFilters[key], leafNode.name) > -1;
          if (query.compositeFilters[key]) {
            if (!existsInQuery) {
              query.compositeFilters[key].push(leafNode.name);
            }
          }
          else {
            query.compositeFilters[key] = [leafNode.name];
          }

          // Only query if the parent has children
          if (entry && entry.children && entry.children.length > 0) {
            if (leafQuery.compositeFilters[key]) {
              if (!existsInQuery) {
                leafQuery.compositeFilters[key].push(leafNode.name);
              }
            }
            else {
              leafQuery.compositeFilters[key] = [leafNode.name];
            }
  
            if ((leafNode.aggregationType.toLowerCase() === 'complex' || leafNode.aggregationType.toLowerCase() === 'viewbyregioncountrycompany')
              && ['metric', 'metricindicator'].indexOf(key) > -1) {
              forEach(complexMetricColumns, (cMetricCol) => {
                if (leafQuery.columnKeys.indexOf(cMetricCol) === -1) {
                  leafQuery.columnKeys.push(cMetricCol);
                }
              });
            }
            else {
              // Rewrite "aggregationType" to simple
              leafNode.aggregationType = 'Simple';
            }
            leafQuery.parent = leafNode.parent;
            leafQuery.level = leafNode.level;

            const promisedLeafQuery = promisedCountQuery(leafQuery, leafNode, req.body.page_size, true);
            promises.push(promisedLeafQuery);
          }
        });

        if ((entry.aggregationType.toLowerCase() === 'complex' || entry.aggregationType.toLowerCase() === 'viewbyregioncountrycompany')
          && ['metric', 'metricindicator'].indexOf(key) > -1) {
          forEach(complexMetricColumns, (cMetricCol) => {
            if (query.columnKeys.indexOf(cMetricCol) === -1) {
              query.columnKeys.push(cMetricCol);
            }
          });
        }
        else {
          // Rewrite "aggregationType" to simple
          entry.aggregationType = 'Simple';
        }

        // Add the parent to the query, to make sure the hash is unique for cases
        // where there is only one deep leaf node
        query.parent = entry.parent;
        const promisedQuery = promisedCountQuery(query, entry, req.body.page_size, true);
        promises.push(promisedQuery);
      });
    });

    Promise.all(promises).then((result) => {
        io.sockets.in(socketClientId).emit('rowCounts', result);
    })
    .catch((err) => {
      console.log(err);
    });
  }
  catch(err) {
    console.log(err);
  }
});

const promisedCountQuery = (query, entry, page_size = 0, isCount = false) => {
  const redisClient = redis(config);

  const promisedQuery = new Promise((resolve, reject) => {
    const cacheKey = crypto.createHash('md5').update(JSON.stringify(query)).digest('hex');
    const sql = queryConstructor(query, page_size, isCount);
    redisClient.get(cacheKey).then((cached) => {
      if (!cached || !config.cache.dimensions) {
        const pQuery = new PromiseQuery();
        pQuery
          .connect()
          .then(() => {
            return pQuery.query(sql);
          })
          .then((result) => {
            const preppedResult = {
              [entry.id]: result[0].count,
              parent: entry.parent,
              aggregationType: entry.aggregationType
            }

            redisClient.set(cacheKey, JSON.stringify(preppedResult));
            resolve(preppedResult);
          })
          .catch((err) => {
            return reject(err);
          });
      }
      else {
        return resolve(JSON.parse(cached));
      }
    });
  });

  return promisedQuery;
}

router.get('/dimensions/hierarchy/:dimension', (req, res) => {
  const dimension = req.params.dimension;
  res.status(200);
  res.setHeader('Content-Type', 'application/json');

  const stream = new DataStream({
    config: config
  });
  
  stream.pipe(res);
  stream.dimensions({
    dimension     : dimension,
    subscriptions : req.auth.subscriptions.map(subscription => subscription.value)
  });
});

const recurseLeafNodes = (node) => {
  let leafNodes = [];

  if (node.children && node.children.length) {
    node.children.forEach((child) => {
      leafNodes = leafNodes.concat(recurseLeafNodes(child)); 
    });
  }
  else {
    leafNodes.push(node);
  }

  return leafNodes;
}

module.exports = router;
