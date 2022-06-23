'use strict';

import { Op, cast, col, where } from 'sequelize';
import { createQueryInterface } from '../../../interfaces/plugins.interface'

import moment from 'moment';

function getValue(string: any) {
  if (!isNaN(string)) {
    if (string instanceof Date) return new Date(string);
    return string;
  }
  return string;
}

function getQuery(query: any) {
  let result: createQueryInterface = {};
  result.query = {};
  result.queryInPopulate = {};

  Object.keys(query).map(function (key) {
    if (key.indexOf('.') !== -1) {
      let keys = key.split(/\./g);
      let newKey = keys.slice(0, -1).join('.');
      let newQuery: any = {};
      newQuery[keys.slice(-1).join('.')] = query[key];
      if (!result.queryInPopulate[newKey]) {
        result.queryInPopulate[newKey] = {
          query: {}
        };
      }

      result.queryInPopulate[newKey].query = {
        ...result.queryInPopulate[newKey].query,
        ...getQuery(newQuery).query
      };

      return true;
    }

    var newKey;

    if (key.includes('[]') && !key.includes('!')) {
      newKey = key.replace('[]', '');

      if (!(query[key] instanceof Array)) query[key] = [query[key]];
      result.query[newKey] = { [Op.in]: query[key] };

      if (moment(new Date(query[key][0])).isValid() && query[key].length === 2) {
        result.query[newKey] = { [Op.between]: [ new Date(query[key][0]), new Date(query[key][1]) ] };
      }
    } else if (
      [
        '$and', '$not', '$nor', '$or', //Comparison
        '$eq', '$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin', //Logical
        '$geoIntersects', '$geoWithin', '$near', '$nearSphere', //Geospatial
        '$all', '$elemMatch', //Array
        '$expr', '$mod', '$regex', '$text', '$where' //Evaluation
      ].indexOf(key) !== -1
    ) {
      result.query[key] = JSON.parse(query[key]);
    } else if (key.includes('[]') && key.includes('!')) {
      newKey = key.replace('!', '');
      newKey = newKey.replace('[]', '');

      if (!(query[key] instanceof Array)) query[key] = [query[key]];

      result.query[newKey] = { [Op.notIn]: query[key] };
    } else if (key.includes('!')) {
      newKey = key.replace('!', '');
      result.query[newKey] = { [Op.notIn]: [query[key]] };
    } else if (key.includes('<:')) {
      newKey = key.replace('<:', '');
      result.query[newKey] = { [Op.lte]: getValue(query[key]) };
    } else if (key.includes('>:')) {
      newKey = key.replace('>:', '');
      result.query[newKey] = { [Op.gte]: getValue(query[key]) };
    } else if (key.includes('>')) {
      newKey = key.replace('>', '');
      result.query[newKey] = { [Op.gt]: getValue(query[key]) };
    } else if (key.includes('<')) {
      newKey = key.replace('<', '');
      result.query[newKey] = { [Op.lt]: getValue(query[key]) };
    } else {
      result.query[key] = query[key];
    }

    if (query[key] === 'true') result.query[key] = true;
    if (query[key] === 'false') result.query[key] = false;
  });

  return result;
}

const createQuery = (query: any, search: any) => {
  let result: createQueryInterface = {};
  result.query = {};
  result.search = {};
  result.queryAndSearch = {};
  result.queryInPopulate = {};

  if (search) {
    Object.keys(search).map(function (key) {
      if (key.includes(',')) {
        result.search[Op.or] = [];
        key.split(',').map((val) => {
          result.search[Op.or].push(where(
            cast(col(val), 'varchar'),
            {[Op.iLike]: `%${search[key]}%`}
          ));
        });
      } else {
        result.search[key] = where(
          cast(col(key), 'varchar'),
          {[Op.iLike]: `%${search[key]}%`}
        );
      }
    });
  }

  if (query) {
    const resultQuery = getQuery(query);
    result.query = resultQuery.query;
    result.queryInPopulate = resultQuery.queryInPopulate;
  }

  result.queryAndSearch = {
    ...result.query,
    ...result.search,
  };

  return result;
};

export default createQuery;