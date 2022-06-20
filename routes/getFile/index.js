const express = require('express');
const router = express.Router();
const { getFile } = require('./../../lib/getFile');
const _pick = require('lodash/pick');

router.get('/getFiles/:filename', (req, res, next) => {
  if (req.params && req.params.filename) {
    getFile(req.params.filename)
      .on('httpHeaders', (code, headers) => {
        if (code < 400) {
          res.set(_pick(headers, 'content-type', 'content-length', 'last-modified'));
        }
      })
      .createReadStream()
      .on('error', next)
      .pipe(res);
  }
  else {
    res.sendStatus(400);
  }  
});

module.exports = router;
