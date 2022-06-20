const app = require('./../../test/fake/app');
const assert = require('chai').assert;
const { md5 } = require('./../../lib/util');
const pkg = require('./../../package.json');
const querystring = require('querystring');
const request = require('supertest');

describe(`${pkg.name}/routes/auth`, () => {

  let instance = undefined;

  after(() => {
    instance.emit('closeEvent');
  });

  before(() => {
    instance = app.create();
  });

  // Hint: expectations are run in the order of definition. This characteristic
  // can be used to modify the response body or headers before executing an
  // assertion.

  describe('POST /auth/token', () => {

    const email = 'bdd_user_1@informa.com';
    const password = '06T$ster';

    it('Should return a 401 if user or domain is not whitelisted.', (done) => {
      request(instance)
        .post('/auth/token')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({
          username : 'hi@not_whitelisted.org',
          password : md5('password')
        })
        .expect(401, done);
    });

    it('Should return a bearer token.', (done) => {
      request(instance)
        .post('/auth/token')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({
          username : email,
          password : md5(password)
        })
        .expect((res) => {
          assert.hasAllKeys(res.body, ['access_token', 'expires_in', 'token_type']);
          assert.isString(res.body.access_token);
          assert.isNumber(res.body.expires_in);
          assert.equal(res.body.token_type, 'Bearer');
        })
        .expect(200, done);
    });

    it('Should return a 401 error if password is wrong.', (done) => {
      request(instance)
        .post('/auth/token')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({
          username : email,
          password : md5(`${password}_invalid`)
        })
        .expect((res) => {
          assert.hasAllKeys(res.body, ['message']);
          assert.equal(res.body.message, 'Invalid email or password.');
        })
        .expect(401, done);
    });

    it('Should return a 401 user does not exist.', (done) => {
      const path = '/auth/token?' +
        request(instance)
          .post('/auth/token')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send({
            username : '******@informa.invalid',
            password : md5(password)
          })
          .expect((res) => {
            assert.hasAllKeys(res.body, ['message']);
            assert.equal(res.body.message, 'Invalid email or password.');
          })
          .expect(401, done);
    });

    it('Should return a 422 error if the request body does not contain an username.', (done) => {
      request(instance)
        .post('/auth/token')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({
          password : md5(password)
        })
        .expect((res) => {
          assert.equal(res.body.message, 'Missing parameter in request body: "username".');
        })
        .expect(422, done);
    });

    it('Should return a 422 error if the request body does not contain a password.', (done) => {
      request(instance)
        .post('/auth/token')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({
          username : email
        })
        .expect((res) => {
          assert.equal(res.body.message, 'Missing parameter in request body: "password".');
        })
        .expect(422, done);
    });

    it('Should return a 422 error if the password is not MD5 hashed.', (done) => {
      request(instance)
        .post('/auth/token')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({
          username : email,
          password
        })
        .expect((res) => {
          assert.equal(res.body.message, 'Request body parameter "password" must be an MD5 hashed string.');
        })
        .expect(422, done);
    });
  });

});
