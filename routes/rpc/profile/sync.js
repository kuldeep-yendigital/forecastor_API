const auth0 = require('./../../../lib/auth0');
const sams = require('./../../../lib/sams');
const router = require('express').Router();

router.get('/rpc/profile/sync', (req, res, next) => {
  if (!req.query.id)
    return res.status(412).send({ code : 412, message : 'Missing id parameter in query.'}).end();

  // Return early and sync auth0 with
  // SAMS datastore in the background
  res.status(204).end();

  sams.api.user.get(req.query.id)
    .then(user => auth0.mapper.fromSams(user))
    .then(user => auth0.api.account.upsert(user.user_id, user))
    .then(response => { req.log.info(`User "${req.query.id}" succesfully synchronized:`, response)})
    // We bypass the error middleware (next) here since a response to the user
    // has already been sent (because error mw would return 500)
    .catch(err => req.log.error(err));
});

module.exports = router;
