const request = require('supertest');
const proxyquire = require('proxyquire');

describe('Sync', () => {

    let app;

    before(() => {
        app = proxyquire('../../../app', {
            'forecaster-common/middleware/authoriser': () => {
                return (req, res, next) => {
                    req.auth = {
                        account: {
                          salesforceUserId: 'mockedAccount',
                        },
                        subscriptions: [{value: "PT0106"}]
                    };
                    next()
                };
            }
        })();
    });

    it('should return 204 on successful sync', (done) => {

        request(app)
        // User BDD 10
            .get('/rpc/profile/sync?id=104336')
            .expect(204, done)
    })


    it('should return 412 on missing id', (done) => {

        request(app)
            .get('/rpc/profile/sync')
            .expect(412, done)
    })

    after(() => {
        app.emit('closeEvent')
    })
})
