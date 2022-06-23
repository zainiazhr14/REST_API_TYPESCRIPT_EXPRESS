'use strict';

import _ from 'lodash';
import moment from 'moment';
import sequelize from './config';

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

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

  if (typeof objOrStr === 'string') { //check objectId
    return objOrStr;
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
        let obj = {};
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
              innerPopulete.forEach((value: any) => {
                if (value) {
                  if (value.charAt(0) === '.') {
                    value = value.substr(1);
                    value = value.split(/\./g);
                    value.forEach(function(v: any) {
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
          populates.reduce((x: any, y: any, idx: number, arr: any) => {
            if (typeof x['populate'] === 'undefined') {
              x['populate'] = {};
            }
            if (typeof x['populate']['path'] === 'undefined') {
              x['populate']['path'] = {};
            }

            x['populate']['path'] = y;

            if (queryInPopulate[i]) {
              if (idx === (arr.length -1)) {
                if (typeof x['populate']['where'] === 'undefined') {
                  x['populate']['where'] = {};
                }
                x['populate']['where'] = queryInPopulate[i].query;
              }
            }

            return x['populate'];
          }, obj);
          o.push(obj);
        }

        return o;
      }, result);
    }

    return result;
  };
  export const populateToInclude = (config: any) => {
    return config.map((el: any) => {
      const model = sequelize.models[capitalizeFirstLetter(el.populate.path)];
      let result: any = { model };
      if (el.populate.where) result.where = el.populate.where;

      return _.isEmpty(model) ? null : result;
    }).filter(function (el: any) {
      return el != null;
    });
  };
  export const stringToAggregate = (str: any) => {
    var result = JSON.parse(str);
    result.forEach((obj: any, key: number) => {
      if (obj['$match']) {
        Object.keys(obj['$match']).forEach(matchKey => {
          result[key]['$match'][matchKey] = convertValue(obj['$match'][matchKey]);
        });
      }
    });

    return result;
  };