const QueryGenerator = require('forecaster-common/lib/memsql/decorators/mssqlTemplate');
const { metricsTemplate, metricsInnerSelect } = require('./templates');

module.exports = (subscriptions = []) => {
  const queryParams = {
    columnKeys: ['metriclevel1', 'metriclevel2'],
    distinct: 'metricleaf',
    range: {
      interval: 'yearly'
    },
    subscriptions: subscriptions
  };

  const qGen = new QueryGenerator(queryParams, 200);
  qGen.sourceTemplateContent = metricsTemplate;
  qGen.subSelectTemplateContent = metricsInnerSelect;

  return qGen.query;
}
