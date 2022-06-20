const auth0 = require('./../../lib/auth0');
const bookmark = require('./../../lib/bookmark');
const configuration = require('./../../config');
const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();
const DataStream = require('./../../lib/data');
const moment = require('moment');

function uploadQueryToS3(bookmark, userId) {
  const params = {
    Body: JSON.stringify(bookmark.payload.query),
    Bucket: configuration.bookmark.s3BucketAllExports,
    Key: `${userId}-${new Date().getTime()}.json`
  };

  const s3 = new AWS.S3();
  s3.upload(params, function(err, data) {
    if (err) {
      console.log(err);
    }
    console.log(`File uploaded successfully. ${data.Location}`);
  });
}

const onFulfilled = (response, res) => {
  response ? res.send(response) : res.sendStatus(400)
};

const isValidDateString = (string) => {
  const regEx = /^\d{4}-\d{2}-\d{2}$/;

  if (!string.match(regEx))
    return false;

  const date = new Date(string);
  if(!date.getTime() && 0 !== date.getTime())
    return false;

  return string === date.toISOString().slice(0, 10);
};

const intervals  = ['yearly', 'quarterly'];
const isValidIntervalString = (string) => 0 <= intervals.indexOf(string);

router.get('/bookmark', (req, res, next) => {
  const userId = auth0.api.account.getUserId(req.auth);

  bookmark.findByUser(userId)
    .then(response => onFulfilled(response, res))
    .catch(next)
});

router.post('/bookmark/export', (req, res, next) => {
  const whitelist = {
    accept      : [ 'application/json' ],
    contentType : [ 'application/json' ]
  };

  if (!req.headers.hasOwnProperty('accept') || !req.headers.hasOwnProperty('content-type')) {
    return res.sendStatus(400);
  }

  if (-1 >= whitelist.accept.indexOf(req.headers.accept)) {
    const message = `Invalid format "${req.headers.accept}" requested. Available formats are ${whitelist.accept.join(',')}.`;

    return res.status(406).send({ message }).end();
  }

  if (-1 >= whitelist.contentType.indexOf(req.headers['content-type'])) {
    const message = `Invalid media type "${req.headers['content-type']}" requested. Available media types are ${whitelist.contentType.join(',')}.`;

    return res.status(415).send({ message }).end();
  }

  if (!req.body.hasOwnProperty('id')) {
    return res.status(422).send({ message : 'Missing parameter in request body: "id".' }).end();
  }

  if (auth0.api.account.getSubscriptions(req.auth).length < 1) {
    return res.status(403).send({ message : 'No valid subscriptions found.' }).end();
  }

  if (req.body.hasOwnProperty('end') && !isValidDateString(req.body.end)) {
    return res.status(422).send({ message : 'Invalid "end" parameter.' }).end();
  }

  if (req.body.hasOwnProperty('start') && !isValidDateString(req.body.start)) {
    return res.status(422).send({ message : 'Invalid "start" parameter.' }).end();
  }

  if ((req.body.hasOwnProperty('start') && !req.body.hasOwnProperty('end')) ||
      (req.body.hasOwnProperty('end') && !req.body.hasOwnProperty('start'))
  ) {
    return res.status(422).send({ message : 'You must specify "start" and "end" parameter.' }).end();
  }

  if (req.body.hasOwnProperty('interval') && !isValidIntervalString(req.body.interval)) {
    return res.status(400).send({
      message : `Invalid "interval" parameter given. Possible values are "${intervals.join('","')}".`
    }).end();
  }

  const userId = auth0.api.account.getUserId(req.auth);

  bookmark.get(userId, req.body.id).then((bookmark) => {
    const config = JSON.parse(JSON.stringify(configuration))
    const stream = new DataStream({ config });

      res.setHeader('Content-Type', 'application/json');
      res.status(200);

      // Overwrite interval
      if (req.body.interval) {
        bookmark.payload.query.range.interval = req.body.interval;
      }

      // Overwrite start and end date
      if (req.body.start && req.body.end) {
        bookmark.payload.query.range.end = Date.parse(req.body.end);
        bookmark.payload.query.range.start = Date.parse(req.body.start);

        const momStart = moment(req.body.start);
        const momEnd = moment(req.body.end);
        const yearDiff = momEnd.diff(momStart, 'years');

        if (bookmark.payload.query.range.interval === 'yearly') {
          // limit is 15 years
          if (yearDiff > 15) {
            // Shorten to 15
            // from the end date
            const momNewStart = momEnd.subtract(15, 'years');
            bookmark.payload.query.range.start = momNewStart.valueOf();
          }
        }
        else if (bookmark.payload.query.range.interval === 'quarterly') {
          // limit is 10 years
          if (yearDiff > 10) {
            // Shorten to 10
            const momNewStart = momEnd.subtract(10, 'years');
            bookmark.payload.query.range.start = momNewStart.valueOf();
          }
        }
      }

      bookmark.payload.query.recordstatus = req.body.recordstatus;
      bookmark.payload.query.lastupdateddatestart = req.body.lastupdateddatestart;
      bookmark.payload.query.lastupdateddateend = req.body.lastupdateddateend;

      uploadQueryToS3(bookmark, userId);

      bookmark.payload.query.subscriptions = auth0.api.account
        .getSubscriptions(req.auth)
        .map(subscription => subscription.value);

      stream.pipe(res);
      stream.query({
        subscriptions: auth0.api.account.getSubscriptions(req.auth),
        query     : bookmark.payload.query,
        page_size : 20000000,
        customerApi: true
      });
    }).catch(next);
});

router.get('/bookmark/popular', (req, res, next) => {
  bookmark.popularBookmarks()
    .then(response => onFulfilled(response, res))
    .catch(next)
});

router.get('/bookmark/:id', (req, res, next) => {
  const bookmarkId = req.params.id;
  const userId = auth0.api.account.getUserId(req.auth);

  bookmark.get(userId, bookmarkId)
    .then(response => onFulfilled(response, res))
    .catch(next)
});

router.delete('/bookmark/:id', (req, res, next) => {
  const bookmarkId = req.params.id;
  const userId = auth0.api.account.getUserId(req.auth);

  bookmark.delete(userId, bookmarkId)
    .then(response => onFulfilled(response, res))
    .catch(next);
});

router.post('/bookmark', (req, res, next) => {
  const userId = auth0.api.account.getUserId(req.auth);

  bookmark.create(userId, req.body)
    .then(response => onFulfilled(response, res))
    .catch(next);
});

module.exports = router;
