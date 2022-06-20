const AWS = require('aws-sdk');
const bookmarkUtil = require('forecaster-infra-bookmark');
const config = require('../config');
const crypto = require('crypto');

const bookmarkHash = (type, userId) => {
  const length = 30;
  const whitelist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let text = hashPrefix(type, userId);
  for (let i = 0; i < length; i += 1) {
    text += whitelist.charAt(
      Math.floor(Math.random() * whitelist.length)
    );
  }

  return text;
};

const hashType = (hash) => Object.keys(hashPrefixes).find(key => hashPrefixes[key] === hash.charAt(0));
const hashPrefixes = {
  popular: 'W',
  shared: 'X',
  saved: 'Y',
  temporary: 'Z'
};
const hashPrefix = (type, userId) => 'saved' === type && isPopularBookmarkUser(userId)
  ? hashPrefixes.popular
  : hashPrefixes[type];

const isPopularBookmarkUser = (userId) => config.bookmark.popular === userId;
const s3client = new AWS.S3();
const validate = require('jsonschema').validate;

module.exports = {

  create(userId, bookmark) {
    const instance = {
      created: bookmark.hasOwnProperty('created') ? bookmark.created : (new Date()).toString(),
      description: bookmark.hasOwnProperty('description') ? bookmark.description : null,
      hash: bookmarkHash(bookmark.type, userId),
      payload: bookmark.hasOwnProperty('payload') ? bookmark.payload : {},
      title: bookmark.hasOwnProperty('title') ? bookmark.title : null,
      type: bookmark.hasOwnProperty('type') ? bookmark.type : null,
      userId: userId.toString(),
      version: bookmarkUtil.version.latest()
    };

    const unshift = (el, arr) => {
      arr.unshift(el);
      return arr;
    };

    return new Promise((resolve, reject) => {
      this.validate(instance)
        .then(() => {
          if (instance.type === 'saved') {
            return this.findByUser(userId).then(bookmarks => writeBookmark(`saved/${userId}`, unshift(instance, bookmarks)));
          } else if (['shared', 'temporary'].indexOf(instance.type) !== -1) {
            return writeBookmark(`${instance.type}/${instance.hash}`, instance);
          }
        })
        .then(() => resolve(instance))
        .catch(error => reject(error));
    });
  },

  delete(userId, hash) {
    const type = hashType(hash, userId);

    if (['saved', 'popular'].indexOf(type) !== -1) {
      return this.findByUser(userId).then((bookmarks) => {
        if (bookmarks.find(bookmark => bookmark.hash === hash) === undefined)
          return Promise.reject();

        return writeBookmark(`saved/${userId}`, bookmarks.filter(bookmark => bookmark.hash !== hash));
      });
    }

    if (type === 'shared') {
      return Promise.reject(new Error('Bookmarks of type "shared" cannot be deleted.'));
    }

    if (type === 'temporary') {
      return this.get(userId, hash).then((bookmark) => {
        if (bookmark === undefined)
          return Promise.reject();

        if (bookmark.userId !== userId) {
          return Promise.reject(new Error('Entity can only be deleted by its creator.'));
        }

        return deleteBookmark(`${type}/${hash}`);
      });
    }

    return Promise.reject();
  },

  findByUser(userId) {
    return readBookmark(`saved/${userId}`);
  },

  get(userId, hash) {
    const type = hashType(hash, userId);

    if (['shared', 'temporary'].indexOf(type) !== -1) {
      return readBookmark(`${type}/${hash}`);
    } else if (type === 'saved') {
      return this.findByUser(userId).then(bookmarks => bookmarks.filter(bookmark => bookmark.hash === hash).pop());
    } else if (type === 'popular') {
      return this.popularBookmarks(userId).then(bookmarks => bookmarks.filter(bookmark => bookmark.hash === hash).pop());
    }

    return Promise.reject();
  },

  popularBookmarks() {
    return this.findByUser(config.bookmark.popular)
      .then(bookmarks => bookmarks.filter(bookmark => 'saved' === bookmark.type));
  },

  fromSubcategory(id) {
    return this.findByUser(config.bookmark.popular)
      .then(bookmarks => bookmarks.filter(bookmark => 'saved' === bookmark.type));
  },

  schema() {
    return bookmarkUtil.schema;
  },

  validate(bookmark) {
    return new Promise((resolve, reject) => {
      const result = validate(bookmark, this.schema());

      if (result.errors.length > 0) {
        reject(new Error('Entity validation failed'));
      } else {
        resolve(result);
      }
    });
  }
};

function deleteBookmark(key) {
  return new Promise((resolve, reject) => {
    s3client.deleteObject({
      Bucket: config.bookmark.bucket,
      Key: key
    }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

function readBookmark(key) {
  console.log(12313, key);
  return new Promise((resolve, reject) => {
    s3client.getObject({
      Bucket: config.bookmark.bucket,
      Key: key
    }, (err, data) => {
      if (err) {
        if (err.statusCode === 404) {
          return resolve(key.substr(0, 5) === 'saved' ? [] : undefined);
        }

        reject(err);
      } else {
        resolve(JSON.parse(data.Body.toString()));
      }
    });
  });
}

function writeBookmark(key, body) {
  return new Promise((resolve, reject) => {
    s3client.putObject({
      Body: JSON.stringify(body),
      Bucket: config.bookmark.bucket,
      Key: key
    }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}
