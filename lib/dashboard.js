const AWS = require('aws-sdk');
const JSONSchema = require('jsonschema');

const config = require('../config');

const s3 = new AWS.S3();

const dashboardSchema = {
  id: '/Dashboard',
  type: 'object',
  properties: {
    slots: {
      type: 'array',
      items: {
        $ref: '/Dashboard/Slot'
      }
    }
  },
  required: ['slots']
};

const slotSchema = {
  id: '/Dashboard/Slot',
  type: 'object',
  properties: {
    title: {
      type: 'string'
    },
    description: {
      type: 'string'
    },
    timestamp: {
      type: 'integer'
    },
    type: {
      type: 'string'
    }
  },
  required: ['title', 'timestamp', 'type']
};

const graphSlotSchema = {
  ...slotSchema,
  id: '/Dashboard/GraphSlot',
  properties: {
    graph: {
      $ref: '/Dashboard/GraphSlot/Graph'
    }
  },
  required: ['graph']
};

const graphSchema = {
  id: '/Dashboard/GraphSlot/Graph',
  properties: {
    type: {
      type: 'string'
    },
    query: {
      type: 'object'
    },
    selection: {
      type: 'array'
    },
    records: {
      type: 'array'
    },
    timestamp: {
      type: 'integer'
    }
  },
  required: ['type', 'query', 'selection', 'records', 'timestamp']
};

const validator = new JSONSchema.Validator();
validator.addSchema(slotSchema, slotSchema.id);
validator.addSchema(dashboardSchema, dashboardSchema.id);
validator.addSchema(graphSchema, graphSchema.id);
validator.addSchema(graphSlotSchema, graphSlotSchema.id);

class DashboardValidator {
  validateDashboard(dashboard) {
    return new Promise((resolve, reject) => {
      const result = validator.validate(dashboard, dashboardSchema);
      if (result.errors.length) {
        reject(result.errors);
      } else {
        resolve(dashboard);
      }
    });
  }
}

const EMPTY_DASHBOARD = {
  slots: []
};

class DashboardService {
  getDashboardForUser(userId) {
    return new Promise((resolve, reject) => {
      s3.getObject({
        Bucket: config.dashboard.bucket,
        Key: userId.toString()
      }, (err, data) => {
        if (err && err.statusCode === 404) {
          resolve(null)
        } else if (err) {
          reject(err);
        } else {
          resolve(data.Body.toString('utf8'));
        }
      });
    })
      .then(JSON.parse)
      .then(result => !result ? EMPTY_DASHBOARD : result);
  }

  saveDashboardForUser(userId, body) {
    return new Promise((resolve, reject) => {
      s3.putObject({
        Bucket: config.dashboard.bucket,
        Key: userId.toString(),
        Body: JSON.stringify(body)
      }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(null);
        }
      });
    });
  }
}

module.exports = {
  DashboardValidator,
  DashboardService
};
