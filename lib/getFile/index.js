const config = require('../../config');
const AWS = require('aws-sdk');
const S3client = new AWS.S3();

module.exports.getFile = (filename) => {
  const params = {
    Bucket: config.s3PDF.bucket,
    Key: filename
  };
  
  return S3client.getObject(params);
};
