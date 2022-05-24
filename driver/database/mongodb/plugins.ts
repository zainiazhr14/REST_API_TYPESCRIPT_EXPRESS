'use strict';

import moment from 'moment';
import { resultListModel, returnListModel, createQueryInterface } from '../../../interfaces/plugins.interface'

const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getValue(string: any) {
  if (!isNaN(string)) {
    if (string instanceof Date) return new Date(string);
    return string;
  }
  return string;
}

const listModel = (modelName: any, populateString: any, modelParent: any, populateAfter: any) => {
  var result: resultListModel;
  if (modelParent) {
    modelName = modelParent;
  }

  let ref = mongoose.model( capitalizeFirstLetter(modelName) ).schema.path(populateAfter).options.ref;

  if (modelParent) {
    populateAfter = modelParent.toLowerCase()+'.'+populateAfter;
  }

  result.from = mongoose.model( ref ).collection.name;
  result.foreignField = '_id';
  result.localField = populateAfter;
  result.as = populateAfter;

  return { result, ref };
};

export const convertValue = (objOrStr: any) => {
  if (objOrStr && typeof objOrStr === 'object') {
    Object.keys(objOrStr).forEach(key => {
      objOrStr[key] = convertValue(objOrStr[key]);
    });
  } else if (Array.isArray(objOrStr)) {
    objOrStr.forEach(key => {
      objOrStr[key] = convertValue(objOrStr[key]);
    });
  }

  if (typeof objOrStr === 'string' && /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i.test(objOrStr)) { //check objectId
    return new ObjectId(objOrStr);
  }
  if (moment(new Date(objOrStr)).isValid()) { //check date
    return new Date(objOrStr);
  }

  return objOrStr;
};

export const createPopulate = (oThis: any, populate: any, isJoin: boolean = false, queryInPopulate: any = []) => {
  let result: any = [];

  if (typeof populate === 'string' && populate !== '') {
    populate.split(/\s+/).reduce((o, i) => {
      let obj: returnListModel;
      let isInnerPopulates = i.match(/\[/g);
      let populates = i.split(/\./g);

      if (isInnerPopulates) {
        populates = [];
        let tempPopulates = i.split(/\[/g);
        tempPopulates.map((p) => {
          let checkIsInner = p.match(/\]/g);
          if (!checkIsInner) {
            let tempPopulatesTwo = p.split(/\./g);
            tempPopulatesTwo.map(value => {
              if (value) {
                populates.push(value);
              }
            });
          } else {
            let innerPopulete = p.split(/\]/g);
            innerPopulete.forEach(value => {
              if (value) {
                if (value.charAt(0) === '.') {
                  value = value.substr(1);
                  const valueSplit: string[] = value.split(/\./g);
                  valueSplit.forEach(function(v) {
                    populates.push(v);
                  });
                } else {
                  populates.push(value);
                }
              }
            });
          }
        });
      }

      if (!isJoin) {
        populates.reduce((x: any, y: any, idx: any, arr: any) => {
          if (typeof x['populate'] === 'undefined') {
            x['populate'] = {};
          }
          if (typeof x['populate']['path'] === 'undefined') {
            x['populate']['path'] = {};
          }

          x['populate']['path'] = y;

          if (queryInPopulate[i]) {
            if (idx === (arr.length -1)) {
              if (typeof x['populate']['match'] === 'undefined') {
                x['populate']['match'] = {};
              }
              x['populate']['match'] = {};
              x['populate']['match'][`${i}.${queryInPopulate[i].key}`] = {
                $eq: queryInPopulate[i].value
              };
            }
          }

          return x['populate'];
        }, obj);
        o.push(obj);
      }

      if (isJoin && oThis) {
        populates.reduce((x, y) => {
          obj = listModel(oThis.modelName, i, x, y);
          o.push({$lookup: obj.result});
          o.push({$unwind : `$${obj.result.as}`});
          return obj.ref;
        }, '');
      }

      return o;
    }, result);
  }

  return result;
}

export const stringToAggregate = (str: string) => {
  var result = JSON.parse(str);
  result.forEach((obj: any, key: any) => {
    if (obj['$match']) {
      Object.keys(obj['$match']).forEach(matchKey => {
        result[key]['$match'][matchKey] = convertValue(obj['$match'][matchKey]);
      });
    }
  });

  return result;
}


export const createQuery = (query: any, search: any, isJoin: boolean, isFromSQL: boolean = false) => {
  let result: createQueryInterface = {};
  
  result.query = {};
  result.search = {};
  result.queryAndSearch = {};
  result.queryInPopulate = {};

  if (search) {
    Object.keys(search).map(function (key) {
      result.search[key] = {
        $regex: new RegExp(`${search[key]}`),
        $options: 'im'
      };
    });
  }

  if (query) {
    Object.keys(query).map(function (key) {
      // if (key.indexOf('.') !== -1) {
      //   let keys = key.split(/\./g);
      //   let newKey = keys.slice(0, -1).join('.');
      //   result.queryInPopulate[newKey] = {
      //     key: keys.slice(-1).join('.'),
      //     value: query[key]
      //   };
      //   if (!isJoin) {
      //     delete query[key];
      //   }
      // }

      var newKey;

      if (/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i.test(query[key]) && !isFromSQL) {
        result.query[key] = new ObjectId(query[key]);
      } else if (key.includes('[]') && !key.includes('!')) {
        newKey = key.replace('[]', '');

        result.query[newKey] = { $in: query[key] };
        if (isFromSQL) result.query[newKey] = query[key];

        if (moment(new Date(query[key][0])).isValid() && query[key].length === 2) {
          result.query[newKey] = { $gte: new Date(query[key][0]), $lte: new Date(query[key][1]) };
          if (isFromSQL) result.query[newKey] = { $between: [ new Date(query[key][0]), new Date(query[key][1]) ] };
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

        result.query[newKey] = { $nin: query[key] };
      } else if (key.includes('!')) {
        newKey = key.replace('!', '');
        result.query[newKey] = { $ne: query[key] };
      } else if (key.includes('<:')) {
        newKey = key.replace('<:', '');
        result.query[newKey] = { $lte: getValue(query[key]) };
      } else if (key.includes('>:')) {
        newKey = key.replace('>:', '');
        result.query[newKey] = { $gte: getValue(query[key]) };
      } else if (key.includes('>')) {
        newKey = key.replace('>', '');
        result.query[newKey] = { $gt: getValue(query[key]) };
      } else if (key.includes('<')) {
        newKey = key.replace('<', '');
        result.query[newKey] = { $lt: getValue(query[key]) };
      } else {
        result.query[key] = query[key];
      }

      if (query[key] === 'true') result.query[key] = true;
      if (query[key] === 'false') result.query[key] = false;
    });
  }

  result.queryAndSearch = {
    ...result.query,
    ...result.search,
  };
  return result;
}


