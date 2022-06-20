const app = require('./../../test/fake/app');
const pkg = require('./../../package.json');
const request = require('supertest');

describe(`${pkg.name}/routes/status`, () => {

  let instance = undefined;

  after(() => {
    instance.emit('closeEvent');
  });

  before(() => {
    instance = app.create();
  });

  describe('GET /status', () => {
    it('Should return 200', (done) => {
      request(instance)
        .get('/status')
        .expect(200, done);
    });
  });

});
