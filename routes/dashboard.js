const express = require('express');

const auth0 = require('../lib/auth0');

const { DashboardService, DashboardValidator } = require('../lib/dashboard');

const router = express.Router();

class GetUserDashboardHandler {
  constructor(authHelper, dashboardService) {
    this.authHelper = authHelper;
    this.dashboardService = dashboardService;
  }

  handle(req, res, next) {
    const userId = this.authHelper.getUserId(req.auth);
    return this.dashboardService.getDashboardForUser(userId)
      .then(graphs => {
        res.send(graphs)
      })
      .catch(next);
  }
}

class PutUserDashboardHandler {
  constructor(authHelper, dashboardValidator, dashboardService) {
    this.authHelper = authHelper;
    this.dashboardValidator = dashboardValidator;
    this.dashboardService = dashboardService;
  }

  validateDashboard(dashboard, res) {
    return this.dashboardValidator.validateDashboard(dashboard)
      .catch(errs => {
        res.status(422).send({
          errors: errs.map(err => err.message)
        });
        return Promise.reject({ validationError: true })
      });
  }

  saveDashboard(userId, dashboard, res) {
    return this.dashboardService.saveDashboardForUser(userId, dashboard)
      .then(() => {
        res.status(204).end();
      });
  }

  handle(req, res, next) {
    const userId = this.authHelper.getUserId(req.auth);
    return this.validateDashboard(req.body, res)
      .then(dashboard => this.saveDashboard(userId, dashboard, res, next))
      .catch(err => {
        if (!err.validationError) {
          next(err);
        }
      });
  }
}

const dashboardService = new DashboardService();
const dashboardValidator = new DashboardValidator();
const handleGetUserDashboard = new GetUserDashboardHandler(auth0.api.account, dashboardService);
const handlePutUserDashboard = new PutUserDashboardHandler(auth0.api.account, dashboardValidator, dashboardService);

router.get('/dashboard', handleGetUserDashboard.handle.bind(handleGetUserDashboard));
router.put('/dashboard', handlePutUserDashboard.handle.bind(handlePutUserDashboard));

module.exports = router;
module.exports.PutUserDashboardHandler = PutUserDashboardHandler;
module.exports.GetUserDashboardHandler = GetUserDashboardHandler;
