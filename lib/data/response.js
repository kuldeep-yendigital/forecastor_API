const _forEach = require('lodash/forEach');

function hierarchicalDimensionParser(data) {
  if(!data || !data[0]) { return []; }

  const makeTree = (data) => {
    const result = [];
    const items = [];

    data.forEach((row) => {
      let counter = 0;
      _forEach(row, (val, key) => {
        if (key === 'aggregationtype' || key === 'dst') {
          return;
        }

        if (val && val.length) {
          items.push({
            name: val,
            level: counter + 1,
            id: `${val}-${counter}`,
            aggregationType: row['aggregationtype'] ? row['aggregationtype'] : 'simple',
            parent: (counter > 0 ? row[`${key.slice(0, -1)}${counter}`] + `-${counter - 1}` : 0)
          });
        }

        counter++;
      });
    });

    const mappedArray = {};
    items.forEach((val) => {
      mappedArray[val.id] = val;
      mappedArray[val.id]['children'] = [];
      mappedArray[val.id]['count'] = 0;
    });

    _forEach(mappedArray, (val) => {
      if (val.parent && 'object' === typeof mappedArray[val['parent']]) {
        mappedArray[val['parent']]['children'].push(val);
        mappedArray[val['parent']].count++;
      }
      else {
        result.push(val);
      }
    });

    return result;
  }

  return makeTree(data);
}

function metricsParser(data) {
  if(!data || !data[0]) { return []; }

  const makeTree = (data) => {
    const result = [];
    const items = [];

    data.forEach((row) => {
      let counter = 0;
      _forEach(row, (val, key) => {
        if (key === 'aggregationtype' || key === 'dst') {
          return;
        }

        if (val && val.length) {
          items.push({
            name: val,
            level: counter + 1,
            id: `${val}-${counter}`,
            aggregationType: row['aggregationtype'] ? row['aggregationtype'] : 'simple',
            parent: (counter > 0 ? row[`${key.slice(0, -1)}${counter}`] + `-${counter - 1}` : 0)
          });
        }

        counter++;
      });
    });

    const mappedArray = {};
    items.forEach((val) => {
      mappedArray[val.id] = val;
      mappedArray[val.id]['children'] = [];
      mappedArray[val.id]['count'] = 0;
    });

    _forEach(mappedArray, (val) => {
      if (val.parent) {
        mappedArray[val['parent']]['children'].push(val);
        if (val.aggregationType.toLowerCase() !== 'simple') {
          mappedArray[val['parent']].aggregationType = 'Complex';
        }
        mappedArray[val['parent']].count++;
      }
      else {
        result.push(val);
      }
    });

    return result;
  }

  return makeTree(data);
}

module.exports.metricsParser = metricsParser;
module.exports.hierarchicalDimensionParser = hierarchicalDimensionParser;
