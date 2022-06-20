const app = require('./../../test/fake/app');
const assert = require('chai').assert;
const pkg = require('./../../package.json');
const request = require('supertest');

describe(`${pkg.name}/routes/dimensions`, () => {

  let instance = undefined;

  after(() => {
    instance.emit('closeEvent');
  });

  before(() => {
    instance = app.create();
  });

  const isHierarchy = (obj) => {
    if (!Array.isArray(obj.children)) return false;
    if (!Number.isInteger(obj.count)) return false;
    if ('string' !== typeof obj.id) return false;
    if (!Number.isInteger(obj.level)) return false;
    if ('string' !== typeof obj.name) return false;
    if (!Number.isInteger(obj.parent)) return false;

    return true;
  };

  describe('GET /dimensions/hierarchy/:dimension', () => {
    it('Should return an array of hierarchies', (done) => {
      request(instance)
        .get('/dimensions/hierarchy/dataset')
        .expect((res) => {
          assert.isArray(res.body);
          assert.equal(res.body.length, res.body.filter(el => isHierarchy(el)).length);
        })
        .expect(200, done)
    });

    it('Should return an 404 error if hierarchy does not exist.', (done) => {
      request(instance)
        .get('/dimensions/{invalid_hierarchy}')
        .expect((res) => {
          assert.isEmpty(res.body);
        })
        .expect(404, done)
    });
  });

});
