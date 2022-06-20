const proxyquire = require('proxyquire');

const account = {
  canFlushRedis : false,
  company       : 'Ovum Internal',
  salesforceUserId : 104217,
  subscriptions : [ 'PT0109-1', 'PT0110-1' ]
};
const token = `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik9FWXpNa00xUWtGQ016azNPVVV6TlVWQ01UQkJOekJETXpVeU16UkdPVU0wTVRKQk9USkZNdyJ9.eyJodHRwczovL2FwaS5vdnVtZm9yZWNhc3Rlci5jb20vYWNjb3VudCI6eyJjb21wYW55IjoiT3Z1bSBJbnRlcm5hbCIsInNhbXNBY2NvdW50SWQiOjEwNDIxNywic3Vic2NyaXB0aW9ucyI6WyJQVDAxMDktMSIsIlBUMDExMC0xIl0sImNhbkZsdXNoUmVkaXMiOmZhbHNlfSwiaXNzIjoiaHR0cHM6Ly9vdnVtZm9yZWNhc3Rlci5ldS5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8YXV0aDB8OWMxOGI0MTU4OGE3MGM0ODljYzNhMGJlM2FkNzg3N2MiLCJhdWQiOlsiaHR0cHM6Ly9hcGkuZm9yZWNhc3Rlci5kZXYudG10LmluZm9ybWEtbGFicy5jb20vIiwiaHR0cHM6Ly9vdnVtZm9yZWNhc3Rlci5ldS5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNTEzMjUwNTk0LCJleHAiOjE1MTMzMzY5OTQsImF6cCI6IlA3c25rMjIyOHNYd0tMYkRKbmplZW8wTUk2M2poVFNyIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSJ9.ZjnBxTFwKosv2C7FJHFbu0q5NU4KLp8AMqlUk2H6EWLq6pv3bnoI7eMtBMuAhRr4iqGbcTP-faoReN0muO6z_c2N0C5QU0sJKy1QA8obY7lTh8du2RU-SfeZSxKNcsoBgJUnSXgzJ5o5EWzjrtU5uzI9-TgiGD-bZBbdjJGVzEKCC-SK4mZJq2R3zgQ_Kxo9-ORrzajcRmabmP_foSTnQTW1o9hwQmp9xz_dsFLQ_TklGr5uz95PhY-Am_Ns9uTHiKssNu-IUhMqMcYHrPDHsxJVsFqOsnwq0_Pi4oK0bFUm25mCvV_KH2HIekz6NJGUSnv7BjMnQi-civJ3aOnyjg`;

module.exports = {
  create : () => {
    return proxyquire('./../../app', {

      // c.f. node_modules/forecaster-common/middleware/authoriser.js
      'forecaster-common/middleware/authoriser': () => {
        return (req, res, next) => {
          req.auth  = {
            account
          };
          req.token = token;

          next();
        };
      }

    })();
  }
};
