const QueryGenerator = require('forecaster-common/lib/memsql/decorators/mssqlTemplate');
const { dimensionTemplate, innerSelect } = require('./templates');

module.exports = (params, subscriptions = []) => {
  const queryParams = {
    columnKeys: params.fields,
    distinct: params.distinctField,
    range: {
      interval: 'yearly'
    },
    subscriptions: subscriptions
  };

  const qGen = new QueryGenerator(queryParams, 200);
  qGen.sourceTemplateContent = dimensionTemplate;
  qGen.subSelectTemplateContent = innerSelect;

  return qGen.query;
}