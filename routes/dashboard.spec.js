const { expect } = require('chai');
const { spy, stub } = require('sinon');

const { GetUserDashboardHandler, PutUserDashboardHandler } = require('./dashboard');

describe('forecaster-api-v2/routes/dashboard', () => {
  let mockAuthHelper, mockDashboardValidator, mockDashboardService, getUserDashboardHandler, putUserDashboardHandler;

  beforeEach(() => {
    mockAuthHelper = { getUserId: auth => auth.user };

    mockDashboardValidator = { validateDashboard: body => Promise.resolve(body) }

    mockDashboardService = {
      getDashboardForUser: userId => Promise.resolve({}),
      saveDashboardForUser: (userId, body) => Promise.resolve()
    }

    getUserDashboardHandler = new GetUserDashboardHandler(
      mockAuthHelper,
      mockDashboardService
    );

    putUserDashboardHandler = new PutUserDashboardHandler(
      mockAuthHelper,
      mockDashboardValidator,
      mockDashboardService
    );
  });

  // Get dashboard for user that always errors
  const mockGetDashboardByUserError = userId => Promise.reject(new Error('mock error'));

  // Dashboard validation function that always passes
  const mockDashboardValidatorPass = body => Promise.resolve(body);

  // Dashboard validation function that always fails
  const mockDashboardValidatorFail = body => Promise.reject([
    { message: 'mock validation failed' }
  ]);

  // Save dashboard for user that always errors
  const mockSaveDashboardForUserError = (userId, body) => Promise.reject(new Error('mock error'));

  describe('GetUserDashboardHandler(authHelper, dashboardService)', () => {
    it('responds with the dashboard for the user', () => {
      const dashboard = {};
      stub(mockDashboardService, 'getDashboardForUser').callsFake(() => Promise.resolve(dashboard));
      const res = { send: spy() };
      return getUserDashboardHandler.handle({ auth: { user: 'B' } }, res, () => {})
        .then(() => {
          expect(res.send.getCall(0).args[0]).to.equal(dashboard);
        });
    });

    it('triggers the next handler on failure', () => {
      stub(mockDashboardService, 'getDashboardForUser').callsFake(mockGetDashboardByUserError)
      const next = spy();
      return getUserDashboardHandler.handle({ auth: { user: 'B' } }, { send: () => {} }, next)
        .then(() => {
          expect(next.called).to.be.true;
        });
    });
  });

  describe('PutUserDashboardHandler(authHelper, dashboardValidator, dashboardService)', () => {
    it('validates the dashboard', () => {
      const mockDashboardValidatorSpy = spy(mockDashboardValidator, 'validateDashboard');
      const dashboard = {};
      const res = { status: () => res, send: () => {} };
      return putUserDashboardHandler.handle({ auth: { user: 'A' }, body: dashboard }, res, () => {})
        .then(() => {
          expect(mockDashboardValidatorSpy.getCall(0).args[0]).to.equal(dashboard);
        });
    });

    it('saves the dashboard for the user', () => {
      const mockSaveDashboardForUserSpy = spy(mockDashboardService, 'saveDashboardForUser');
      const dashboard = {};
      const res = { status: () => res, send: () => {} };
      return putUserDashboardHandler.handle({ auth: { user: 'A' }, body: dashboard }, res, () => {})
        .then(() => {
          expect(mockSaveDashboardForUserSpy.getCall(0).args[0]).to.equal('A');
          expect(mockSaveDashboardForUserSpy.getCall(0).args[1]).to.equal(dashboard);
        });
    });

    it('responds with 204', () => {
      const res = { status: spy() };
      return putUserDashboardHandler.handle({ auth: { user: 'A' } }, res, () => {})
        .then(() => {
          expect(res.status.getCall(0).args[0]).to.equal(204);
        });
    });

    it('responds with a 422 status if the dashboard is invalid', () => {
      stub(mockDashboardValidator, 'validateDashboard').callsFake(mockDashboardValidatorFail);
      const res = { status: spy(() => res), send: () => {} }
      return putUserDashboardHandler.handle({ auth: { user: 'A' } }, res, () => {})
        .then(() => {
          expect(res.status.getCall(0).args[0]).to.equal(422);
        });
    });

    it('returns the validation errors if the dashboard is invalid', () => {
      stub(mockDashboardValidator, 'validateDashboard').callsFake(mockDashboardValidatorFail);
      const res = { status: () => res, send: spy() };
      return putUserDashboardHandler.handle({ auth: { user: 'A' } }, res, () => {})
        .then(() => {
          expect(res.send.getCall(0).args[0]).to.deep.equal({
            errors: ['mock validation failed']
          });
        });
    });

    it('triggers the next handler on failure', () => {
      const res = { status: () => res, send: () => {} };
      const next = spy();
      return putUserDashboardHandler.handle({ auth: { user: 'A' } }, res, next)
        .then(() => {
          expect(next.called).to.be.true;
        });
    });
  });
});
