const app = require('./../../test/fake/app');
const assert = require('chai').assert;
const pkg = require('./../../package.json');
const request = require('supertest');
const { URL } = require('url');

describe(`${pkg.name}/routes/getFiles`, () => {

  let instance = undefined;

  after(() => {
    instance.emit('closeEvent');
  });

  before(() => {
    instance = app.create();
  });

  describe('GET /getFiles/:filename', () => {
    it('Should return json object containing a fileUrl property', (done) => {
      const filename = 'ovum-forecaster-help-and-training-guide.pdf';

      request(instance)
        .get(`/getFiles/${filename}`)
        .expect((res) => {
          assert.property(res.body, 'fileURL');
          assert.equal(new URL(res.body.fileURL).pathname, `/${filename}`);
        })
        .expect(200, done);
    });

    it('Should return an 404 error if file does not exist.', (done) => {
      request(instance)
        .get('/getFiles/{invalid_filey}')
        .expect(404, done);
    });
  });

});
