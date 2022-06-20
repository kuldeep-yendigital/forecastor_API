const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('./config');
const { getPool } = require('./lib/database');
const error = require('forecaster-common/middleware/error');

const authoriser = require('forecaster-common/middleware/authoriser')(config);
const logger = require('forecaster-common/middleware/logger')(config);
const monitoring = require('forecaster-common/lib/monitoring');

const auth = require('./routes/auth');
const bookmark = require('./routes/bookmark');
const dimension = require('./routes/dimension');
const getFile = require('./routes/getFile');
const metric = require('./routes/metric');
const profileSync = require('./routes/rpc/profile/sync');
const query = require('./routes/query');
const dashboards = require('./routes/dashboard');
const status = require('./routes/status');
const bookmarkCategory = require('./routes/bookmark-category');

if (config.monitoring && config.monitoring.enabled) {
  const monitoringConfig = Object.keys(config.monitoring)
    .filter(key => 'enabled' !== key)
    .reduce((obj, key) => {
      obj[key] = config.monitoring[key];
      return obj;
    }, {});

  // Create global monitoring instance `global._monitoring`
  monitoring(monitoringConfig);
}

module.exports = () => {
  const app = express();

  getPool(config.memsql);

  const corsWhitelist = [
    'http://localhost:9000',
    'https://forecaster-ui.dev.tmt.informa-labs.com',
    'https://forecaster-ui.qa.tmt.informa-labs.com',
    'https://forecaster-ui.prod.tmt.informa-labs.com',
    'https://forecaster.ovum.com'
  ];
  const corsOptions = {
    origin: function (origin, callback) {
      if (corsWhitelist.indexOf(origin) !== -1) {
        callback(null, true);
      }
      else {
        callback(null, true); // Whatevs, can't be worse than * (I hate myself)
      }
    },
    credentials: true
  }

  app.use(cors(
    corsOptions
  ));
  app.use(bodyParser.json());
  app.use(logger);
  app.use(status);
  app.use(auth);
  app.use(profileSync);
  app.use(authoriser);
  app.use(query);
  app.use(dimension);
  app.use(metric);
  app.use(bookmark);
  app.use(dashboards);
  app.use(getFile);
  app.use('/bookmark-categories', bookmarkCategory);

  app.use(error);

  // For tests only
  app.on('closeEvent', function () {
      setTimeout(process.exit, 10000)
  });

  return app;
};
