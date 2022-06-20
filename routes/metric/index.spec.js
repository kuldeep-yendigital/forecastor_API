const app = require('./../../test/fake/app');
const assert = require('chai').assert;
const pkg = require('./../../package.json');
const request = require('supertest');

describe(`${pkg.name}/routes/metrics`, () => {

  let instance = undefined;

  after(() => {
    instance.emit('closeEvent');
  });

  before(() => {
    instance = app.create();
  });

  describe('GET /metrics', () => {
    it('Should return an array of metrics', (done) => {
      request(instance)
        .get('/metrics')
        .expect((res) => {
          assert.isArray(res.body);
        })
        .expect(200, done)
    });
  });
});
