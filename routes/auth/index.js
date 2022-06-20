const token = require('./../../lib/auth0').api.token;
const router = require('express').Router();

router.post('/auth/token', (req, res) => {

  if (!req.headers.hasOwnProperty('accept') || !req.headers.hasOwnProperty('content-type')) {
    return res.sendStatus(400);
  }

  if (!req.body.hasOwnProperty('username')) {
    return res.status(422).send({ message : 'Missing parameter in request body: "username".' }).end();
  }

  if (!req.body.hasOwnProperty('password')) {
    return res.status(422).send({ message : 'Missing parameter in request body: "password".' }).end();
  }

  const username = req.body.username;
  const password = req.body.password;

  token.api(username, password).then((token) => {
    res.send({
      access_token : token.access_token,
      expires_in   : token.expires_in,
      token_type   : token.token_type
    });
  })
  .catch((response) => {
    if (response.hasOwnProperty('error') && 'invalid_grant' === response.error) {
      return res.status(401).send({ message : response.error_description || null });
    }

    req.log.error(response);

    return res.sendStatus(500);
  });
});

module.exports = router;
