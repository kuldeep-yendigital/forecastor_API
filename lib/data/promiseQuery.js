const config = require('./../../config');
const { getPool } = require('../database');

const sqloptions = Object.assign({}, config.memsql, {
  logger: {
    cloudwatch: config.cloudwatch,
    logLevel: config.logLevel
  }
});



class PromiseQuery {
  constructor() {
    this.connection = null;
    this.pool = getPool(sqloptions);
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.pool) {
        this.pool.getConnection((err, connection) => {
          if (err) {
            console.log(err);
            return reject(err);
          }
  
          this.connection = connection
          resolve(this.connection);
        }); 
      }
      else {
        reject(new Error('The connection is not initialised'));
      }
    });
  }

  query(sql, args) {
    const executeQuery = () => {
      return new Promise((resolve, reject) => {
        this.connection.query(sql, args, (err, rows) => {
          this.connection.release();

          if (err) {
            console.log(err);
            reject(err);
          }
          
          resolve(rows);
        });
      });
    };

    if (this.connection) {
      return executeQuery();
    }
    else {
      return this.connect().then(executeQuery);
    }
  }
}

module.exports = PromiseQuery;