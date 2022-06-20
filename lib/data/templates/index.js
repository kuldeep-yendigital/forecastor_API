module.exports.dimensionTemplate = (
  `SELECT COMBINEDRESULT.* FROM (
    {{> subSelect table=standardTable}}
    UNION ALL
    {{> subSelect table=complexTable}}
  ) as COMBINEDRESULT
  {{{sort @root}}}`
);

module.exports.innerSelect = (
  `SELECT {{{distinct @root}}}, {{{columns @root}}}, aggregationtype
    FROM {{table}}
    {{{whereDataset @root}}}`
);

module.exports.metricsTemplate = (
  `SELECT COMBINEDRESULT.* FROM (
    {{> subSelect table=standardTable}}
    UNION ALL
    {{> subSelect table=complexTable}}
  ) as COMBINEDRESULT
  {{{sort @root}}}`
);

module.exports.metricsInnerSelect = (
  `SELECT {{{distinct @root}}}, {{{columns @root}}}, aggregationtype
    FROM {{table}}
    {{{where @root table false false}}}
    AND (metricindicator = 'Total')`
);
