const app = require('./../../test/fake/app');
const assert = require('chai').assert;
const pkg = require('./../../package.json');
const request = require('supertest');

describe(`${pkg.name}/routes/query`, () => {

  let instance = undefined;

  after(() => {
    instance.emit('closeEvent');
  });

  before(() => {
    instance = app.create();
  });

  describe('GET /query', () => {
    it('Should return a json object containing an array of records and the sql query', (done) => {
      const body = {
        "query": {
          "filters": {},
          "compositeFilters": {
            "metric": ["Subscriptions", "Advertising Revenues"]
          },
          "range": {
            "interval": "yearly",
            "start": 1420070400000,
            "end": 1672444800000
          },
          "sortedColumnId": "geographylevel1",
          "sortDirection": "asc",
          "columnKeys": ["geographylevel1", "geographylevel2", "serviceslevel1", "dataset", "metriclevel1", "metriclevel2", "metricindicator", "currency", "unit"]
        },
        "page_size": 200,
        "fields": [],
        "sort_field": {
          "type": "dimension_sort",
          "value": "geographylevel1",
          "direction": "asc"
        },
        "timeframe_interval": "yearly"
      }

      request(instance)
        .post('/query')
        .set('Content-Type', 'application/json')
        .send(body)
        .expect((res) => {
          assert.hasAllKeys(res.body, [ 'records', 'sql' ]);

          assert.isArray(res.body.records);
          assert.isString(res.body.sql);
        })
        .expect(200, done);
    });

    it('Should return an 500 http error if request does not contain a body', (done) => {
      request(instance)
        .post('/query')
        .expect(500, done);
    });
  });
});
