# Ovum Forecaster Public API

The Ovum Forecaster Pubic API provides 100% complete, high-quality & daily updated data and with comprehensive worldwide coverage of the converging TMT market.

Documentation on confluence: https://itmebusiness.atlassian.net/wiki/spaces/OG4FT/pages/251396123/Ovum+Forecaster+Public+API

## Known limitations

- The current implementation does not support streaming, result sets are currently build up in memory and may exceed the limit on our EC2 instances.
- Huge, computational intense queries may timeout, we have a hard time out set to approximately 3.33 minutes.
- As a rule of thumb, if you can't create the query in the UI it's likely that the API times out when trying to export the data.

## Usage

To leverage the Ovum Forecaster Pubic API clients have to authenticate themselves using their Forecaster credentials. All Forecaster users can access the API regardless of their attached product ids.

The typical usage is semi-programmatically, in a sense that due to the nature of the data a user may not be able to construct queries entirely programmatically. Therefore, we recommend creating the query first using the Forecaster UI and then export that snapshot through the public API.

### API Hostnames

- `https://forecaster-open-api.dev.tmt.informa-labs.com`
- `https://forecaster-open-api.qa.tmt.informa-labs.com`
- `https://forecaster-open-api.prod.tmt.informa-labs.com`

### Authentication

```bash
export FORECASTER_HOST='http://localhost:3000'
export FORECASTER_USERNAME='{your-forecaster-username}'
export FORECASTER_PASSWORD=$(echo -n '{your-forecaster-password}' | md5)

$ curl --request POST \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{ "password" : "'${FORECASTER_PASSWORD}'", "username" : "'${FORECASTER_USERNAME}'" }' \
  "${FORECASTER_HOST}/auth/token" > 'token.json'

# {
#   "access_token" : "{JSON Web Token}",
#   "expires_in"   : 86400,
#   "token_type"   : "Bearer"
# }

export FORECASTER_TOKEN=$(cat 'token.json' | jq -r '.access_token')
```

### Get a list of saved searches

```bash
$ curl --request GET \
  -H "Authorization: Bearer ${FORECASTER_TOKEN}" \
  "${FORECASTER_HOST}/bookmark"
# [
#   {
#     "created"     : "Thu Dec 21 2017 17:04:02 GMT+0000 (UTC)",
#     "description" : "",
#     "hash"        : "Y6kEzLEYHk1yCoV4F7395ncbJBNUPcN",
#     "payload"     : {},
#     "title"       : "Default",
#     "type"        : "saved",
#     "userId"      : "104217"
#   }
# ]
```

### Export a saved search

```bash
# Simple export
$ curl --request POST \
  -H "Authorization: Bearer ${FORECASTER_TOKEN}" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{ "id" : "Y5AcbVJM5EJtoehWwUY67QBWLqKvvOK" }' \
  "${FORECASTER_HOST}/bookmark/export"
# {
#   "records" : []
# }

# Overwrite start and end date (format YYYY-MM-DD)
$ curl --request POST \
  -H "Authorization: Bearer ${FORECASTER_TOKEN}" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{ "id" : "Y5AcbVJM5EJtoehWwUY67QBWLqKvvOK", "start": "2012-01-12", "end" : "2012-12-31" }' \
  "${FORECASTER_HOST}/bookmark/export"
# {
#   "records" : []
# }

# Overwrite interval possible values ("yearly", "quarterly")
$ curl --request POST \
  -H "Authorization: Bearer ${FORECASTER_TOKEN}" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{ "id" : "Y5AcbVJM5EJtoehWwUY67QBWLqKvvOK", "start": "2012-01-12", "end" : "2012-12-31", "interval" : "quarterly" }' \
  "${FORECASTER_HOST}/bookmark/export"
# {
#   "records" : []
# }
```
