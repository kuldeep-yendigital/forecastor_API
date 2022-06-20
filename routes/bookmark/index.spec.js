const app = require('./../../test/fake/app');
const assert = require('chai').assert;
const mock = require('./../../test/mock');
const pkg = require('./../../package.json');
const request = require('supertest');

describe(`${pkg.name}/routes/bookmark`, () => {

  let bookmark = {};
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

  describe('GET /bookmark/popular', () => {
    it('Should return an array of popular searches', (done) => {
      request(instance)
        .get('/bookmark/popular')
        .expect((res) => {
          assert.isArray(res.body);
        })
        .expect(200, done)
    });
  });

  describe('POST /bookmark', () => {
    it('Should create a bookmark.', (done) => {
      const example = mock.bookmark.saved;

      request(instance)
        .post('/bookmark')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(example))
        .expect((res) => {
          assert.property(res.body, 'created');
          assert.isNotNaN(Date.parse(res.body.created));
          assert.equal(res.body.description, example.description);
          assert.property(res.body, 'hash');
          assert.isString(res.body.hash);
          assert.deepEqual(res.body.payload, example.payload);
          assert.equal(res.body.title, example.title);
          assert.equal(res.body.type, example.type);
          assert.property(res.body, 'userId');

          bookmark = Object.assign(bookmark, res.body);
        })
        .expect(200, done);
    });

    it('Should fail if schema validation fails.', (done) => {
      request(instance)
        .post('/bookmark')
        .set('Content-Type', 'application/json')
        .send({})
        .expect((res) => {
          assert.equal(res.body.message, 'Entity validation failed');
        })
        .expect(500, done);
    });
  });

  describe('GET /bookmark/:id', () => {
    it('Should return a bookmark by a given id.', (done) => {
      request(instance)
        .get(`/bookmark/${bookmark.hash}`)
        .expect((res) => {
          assert.deepEqual(res.body, bookmark);
        })
        .expect(200, done);
    });

    it('Should return an 404 error if bookmark does not exist.', (done) => {
      request(instance)
        .get('/bookmark/{invalid_bookmark_id}')
        .expect((res) => {
          assert.isEmpty(res.body);
        })
        .expect(404, done)
    });

    it('Should return an 400 error if user bookmarks are empty.', function (done) {
      request(instance)
        .get('/bookmark/Y_does_not_exist')
        .expect((res) => {
          assert.isEmpty(res.body);
        })
        .expect(400, done)
    });
  });

  describe('POST /bookmark/export', () => {

    it('Should export a bookmark in json format.', (done) => {
      request(instance)
        .post('/bookmark/export')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({ id : bookmark.hash })
        .expect((res) => {
          assert.hasAllKeys(res.body, ['records']);
          assert.isArray(res.body.records);
        })
        .expect(200, done);
    });

    it('Should export a bookmark in json format and overwrite the date range.', (done) => {
      request(instance)
        .post('/bookmark/export')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({
          id    : bookmark.hash,
          start : '2015-01-01',
          end   : '2015-12-31'
        })
        .expect((res) => {
          assert.hasAllKeys(res.body, ['records']);
          assert.isArray(res.body.records);
        })
        .expect(200, done);
    });

    it('Should return a 404 error if bookmark does not exist.', (done) => {
      request(instance)
        .post('/bookmark/export')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({ id : '{invalid_bookmark_id}' })
        .expect(404, done);
    });

    it('Should return a 400 error if no accept header was sent.', (done) => {
      request(instance)
        .post('/bookmark/export')
        .set('Content-Type', 'application/json')
        .expect(400, done);
    });

    it('Should return a 400 error if no content-type header was sent.', (done) => {
      request(instance)
        .post('/bookmark/export')
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('Should return a 406 error the requested format is not unsupported.', (done) => {
      request(instance)
        .post('/bookmark/export')
        .set('Accept', 'text/vulcan')
        .set('Content-Type', 'application/json')
        .expect((res) => {
          assert.equal(
            res.body.message,
            'Invalid format "text/vulcan" requested. Available formats are application/json.'
          );
        })
        .expect(406, done);
    });

    it('Should return a 415 error the requested format is not unsupported.', (done) => {
      request(instance)
        .post('/bookmark/export')
        .set('Accept', 'application/json')
        .set('Content-Type', 'text/plain')
        .expect((res) => {
          assert.equal(
            res.body.message,
            'Invalid media type "text/plain" requested. Available media types are application/json.'
          );
        })
        .expect(415, done);
    });

    it('Should return a 422 error if the request body does not contain a bookmark id.', (done) => {
      request(instance)
        .post('/bookmark/export')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .expect((res) => {
          assert.equal(res.body.message, 'Missing parameter in request body: "id".');
        })
        .expect(422, done);
    });

    it('Should return an 400 error if the interval parameter value is invalid.', (done) => {
      request(instance)
        .post('/bookmark/export')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({
          id       : bookmark.hash,
          start    : '2015-01-01',
          end      : '2015-12-31',
          interval : 'trimestral'
        })
        .expect(400, done);
    });
  });

  describe('DELETE /bookmark/:id', () => {
    it('Should delete a bookmark.', (done) => {
      request(instance).delete(`/bookmark/${bookmark.hash}`).expect(200, done);
    });

    it('Should fail to delete invalid bookmark', (done) => {
      request(instance).delete(`/bookmark/1`).expect(404, done);
    });
  });

});
