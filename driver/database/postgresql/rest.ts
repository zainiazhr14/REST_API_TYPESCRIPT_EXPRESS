import _ from'lodash';
import qs from'query-string';
import { createPopulate, stringToAggregate, populateToInclude } from'./plugins';
import createQuery from'./createQuery';
import Boom from 'boom';
import Kafka from '../../kafka';
import { queryData, resultQuery, requestCreate, requestGet, resultBulk, requestUpdate, summary, summaryCustom } from '../../../interfaces/rest.interface';


class RESTful implements queryData{
  protected modelName: string;
            lowerName: string;
            pluginName: string;
            model: any;
            page: number;
            limit: number;
            sort: string;
            populate: string;
            q: any;
            search: any;
            isJoin: boolean;

  constructor(pluginName: string, modelName: string) {
    this.modelName = modelName;
    this.lowerName = _.toLower(modelName);
    this.pluginName = pluginName;
    this.model = require(`../../../plugins/${pluginName}/model/${modelName}`);
    this.page = 1;
    this.limit = 10;
    this.sort = '-created_at';
    this.populate = '';
    this.q = {};
    this.search = {};
    this.isJoin = false;
  }

  public list = async function getList(this: RESTful, req: any) {
    // if (req.auth.credentials.type !== 'admin') throw Boom.unauthorized(`unauthorized.`, req.payload);
    try {
      const listConfig = {
        q: qs.parse(req.query.q) || this.q,
        search: qs.parse(req.query.search) || this.search,
        page: Number(req.query.page) || this.page,
        limit: (req.query.limit && req.query.limit < 0) ? 0 : Number(req.query.limit) || this.limit,
        sort: req.query.sort || this.sort,
        populate: req.query.populate || this.populate,
        isJoin: req.query.isJoin || this.isJoin
      };
  
      let isJoin = listConfig.isJoin;
  
      let sort = [];
      if (listConfig.sort) {
        sort = listConfig.sort.split(' ');
        sort.map((s: any, k: any) => {
          sort[k] = [s, 'asc'];
          if (s.includes('-')) {
            sort[k] = [s.replace('-', ''), 'desc'];
          }
        }).includes('-');
      }
      
      let query = createQuery(listConfig.q, listConfig.search);
      listConfig.q = query.queryAndSearch;
  
      if (req.query.date && req.query.datekey && req.query.dateop) {
        listConfig.q = {
          ...listConfig.q,
          [req.query.datekey]: {
            [req.query.dateop]: req.query.date
          }
        };
      }
  
      listConfig.populate = createPopulate(this, listConfig.populate, isJoin, query.queryInPopulate);
      const include = populateToInclude(listConfig.populate);
      const options = {
        limit: listConfig.limit,
        offset: (listConfig.page - 1) * listConfig.limit,
        where: listConfig.q,
        order: [sort],
        include
      };
  
      const {rows, count} = await this.model.findAndCountAll(options);
  
      const data = {
        count: count,
        [this.lowerName]: rows,
        page: listConfig.page,
        limit: listConfig.limit,
        totalPage: Math.ceil(count / listConfig.limit)
      };
  
      let response: resultQuery = {
        error: null,
        data: null
      };

      response.error = null;
      response.data = {
        status: 'success',
        data
      };
      return response;
    } catch (error) {
      return { error, data: null };
    }
  };

  public get = async function getOne(this: RESTful, req: any) {
    // if (req.auth.credentials.type !== 'admin') throw Boom.unauthorized(`unauthorized.`, req.payload);
    try {
  
      const isJoin = false;
      let queryInPopulate = {};
      let populateOpt = req.query.populate || this.populate;
  
      populateOpt = createPopulate(this, populateOpt, isJoin, queryInPopulate);
      const include = populateToInclude(populateOpt);
      const item = await this.model.findOne({where:{ id: req.params.id }, include});
  
      const data = {
        [this.lowerName]: item
      };
  
      let response: resultQuery = {
        error: null,
        data: null
      };
      response.error = null;
      response.data = {
        status: 'success',
        data
      };
      return response;
    } catch (error) {
      return { error, data: null };
    }
  };

  public create = async function createOne(this: RESTful, req: any) {
    // if (req.auth.credentials.type !== 'admin') throw Boom.unauthorized(`unauthorized.`, req.payload);
    try {
      // res.locals.ability.throwUnlessCan('create', _this.modelName);
  
      let created_by = req.auth && req.auth.credentials && req.auth.credentials.id;
      if (req.payload && req.payload.created_by) {
        created_by = req.payload.created_by;
      }
  
      const modifiedPayload = {
        ...req.payload,
        created_by: created_by,
        updated_by: created_by
      };
  
      const item = await this.model.create(modifiedPayload);
  
      // if (this.modelName == 'UserNotification') {
      //   req.server.methods.notification(item.user, item);
      // };
  
      const data = {
        [this.lowerName]: item,
        message: 'Successfully create data'
      };
  
      let response: resultQuery = {
        error: null,
        data: null
      };
      response.error = null;
      response.data = {
        status: 'success',
        data
      };
      return response;
    } catch (error) {
      console.log(error);
      return { error, data: null };
    }
  };

  public createOrUpdate = async function createOrUpdate(this: RESTful, findQuery: any, insertedData: any) {
    // if (req.auth.credentials.type !== 'admin') throw Boom.unauthorized('unauthorized.', req.payload);
    try {
      const isExist = await this.model.findOne(findQuery);
      let message = 'Successfully create data';
      let result = {};
  
      if (!isExist) {
        result = await this.model.create(insertedData);
      } else {
        message = 'Successfully update data';
        result = await this.model.update(
          { ...findQuery },
          { $set: insertedData },
          { safe: true, new: false }
        );
      }
  
      const data = {
        [this.lowerName]: result,
        message
      };
  
      let response: resultQuery = {
        error: null,
        data: null
      };
      response.error = null;
      response.data = { status: 'success', data };
  
      return response;
    } catch (error) {
      console.log(error);
      return { error, data: null };
    }
  };

  public createBulk = async function createBulk(this: RESTful, req: any, dataBulk: any) {
    if (req.auth.credentials.type !== 'admin') throw Boom.unauthorized('unauthorized.', req.payload);
    let response: Array<resultBulk>;
  
    await Promise.all(dataBulk.map(async () => {
      try {
        let created_by = req.auth.credentials._id;
  
        for (var i = 0; i < dataBulk.length; i++) {
          let data = dataBulk[i];
          if (data.created_by) {
            created_by = data.created_by;
          }
  
          const modifiedPayload = {
            ...data,
            created_by: created_by,
            updated_by: created_by
          };
  
          let result: resultBulk;
          result.success = await this.model.create(modifiedPayload);
          response.push(result);
        }
  
      } catch (error) {
        let result: resultBulk;
        result.error = error;
        response.push(result);
      }
    }));
  
    return response;
  };

  public updateBulk = async function updateBulk(this: RESTful, req: any, dataBulk: any) {
    if (req.auth.credentials.type !== 'admin') throw Boom.unauthorized('unauthorized.', req.payload);
    let response: Array<resultBulk>;
  
    await Promise.all(dataBulk.map(async () => {
      try {
        let created_by = req.auth.credentials._id;
  
        for (var i = 0; i < dataBulk.length; i++) {
          let data = dataBulk[i];
          if (data.created_by) {
            created_by = data.created_by;
          }
  
          let _id = data._id;
          delete data._id;
  
          let result: resultBulk;
          result.success = await this.model.update(
            { _id },
            { $set:
              {
                ...data,
                updated_by: created_by
              }
            },
            { safe: true, new: false }
          );
  
          response.push(result);
        }
  
      } catch (error) {
        let result: resultBulk;
        result.error = error;
        response.push(result);
      }
    }));
  
    return response;
  };

  public update = async function updateOne(this: RESTful, req: any) {
    // if (req.auth.credentials.type !== 'admin') throw Boom.unauthorized(`unauthorized.`, req.payload);
    try {
      // res.locals.ability.throwUnlessCan('update', _this.modelName);
  
      let created_by = req.auth && req.auth.credentials && req.auth.credentials._id;
      if (req.payload && req.payload.created_by) {
        created_by = req.payload.created_by;
      }
  
      const modifiedPayload = {
        ...req.payload,
        updated_by: created_by
      };
  
      Object.keys(modifiedPayload).forEach(function(key) {
        if (modifiedPayload[key] === null) modifiedPayload[key] = undefined;
      });
  
      let item = await this.model.findOne({where: {id: req.params.id}});
      item.update(modifiedPayload);
  
      const data = {
        [this.lowerName]: item,
        message: 'Successfully update data'
      };
  
      let response: resultQuery = {
        error: null,
        data: null
      };
      response.error = null;
      response.data = {
        status: 'success',
        data
      };
      return response;
    } catch (error) {
      return { error, data: null };
    }
  };

  public remove = async function removeOne(this: RESTful, req: any) {
    // if (req.auth.credentials.type !== 'admin') throw Boom.unauthorized(`unauthorized.`, req.payload);
    try {
      const KafkaProduce = await Kafka.produce('log');
      const item = await this.model.findOne({where:{ id: req.params.id }});
      const result = item.name ? item.name : 'item';
  
      let created_by = req.auth && req.auth.credentials && req.auth.credentials.type === 'user' && req.auth.credentials.id;
      let created_by_admin = req.auth && req.auth.credentials && req.auth.credentials.type !== 'user' && req.auth.credentials.id;
      if (created_by && this.modelName !== 'LogUser') {
        KafkaProduce('log', 'create:loguser', {
          data: {
            user: created_by,
            type: 'delete',
            message: `${this.pluginName}:${this.modelName}`,
            data: item.toJSON()
          }
        });
      }
      if (created_by_admin && this.modelName !== 'LogAdmin') {
        KafkaProduce('log', 'create:logadmin', {
          data: {
            admin: created_by_admin,
            type: 'delete',
            message: `${this.pluginName}:${this.modelName}`,
            data: item.toJSON()
          }
        });
      }
  
      // res.locals.ability.throwUnlessCan('delete', _this.modelName);
      await item.destroy();
  
      const data = {
        message: `Successfully remove ${result}`
      };
  
      let response: resultQuery = {
        error: null,
        data: null
      };
      response.error = null;
      response.data = {
        status: 'success',
        data
      };
      return response;
    } catch (error) {
      return { error, data: null };
    }
  };

  public summary = async function summary(this: RESTful, req: any) {
    if (req.auth.credentials.type !== 'admin') throw Boom.unauthorized('unauthorized.', req.payload);
    try {
      let queryDate = [];
  
      const field = 'created_at';
      const start = req.query.start;
      const end = req.query.end;
      const type = req.query.type;
      const column = req.query.column;
  
      const listConfig = {
        q: qs.parse(req.query.q) || this.q,
        search: qs.parse(req.query.search) || this.search,
        populate: req.query.populate || this.populate
      };
  
      let query = createQuery(listConfig.q, listConfig.search);
      listConfig.q = query.queryAndSearch;
  
      if (start && end) {
        queryDate.push({
          $match: {
            ...listConfig.q,
            [field]: { $gte: new Date(start), $lte: new Date(end) }
          }
        });
      } else {
        queryDate.push({
          $match: {
            ...listConfig.q,
          }
        });
      }
  
      queryDate.push({
        $sort: {
          updated_at: -1
        }
      });
  
      let querySummary = [];
  
      switch (type) {
        case 'count':
          querySummary = [{
            $group : {
              _id: null,
              count : { $sum : 1 }
            }
          }];
  
          if (column) {
            querySummary = [{
              $group: {
                _id: null,
                count: { $sum : 1 },
                total: { $sum: `$${column}` }
              }
            }];
          }
  
          break;
        default:
          querySummary = [{
            $group : {
              _id : {
                year: { $year : `$${field}` },
                month: { $month : `$${field}` },
                day: { $dayOfMonth : `$${field}` }
              },
              count : { $sum : 1 }
            }
          }, {
            $group : {
              _id : {
                year: '$_id.year',
                month: '$_id.month'
              },
              daily: {
                $push: { day: '$_id.day', count: '$count' }
              }
            }
          }, {
            $group : {
              _id : { year: '$_id.year' },
              monthly: {
                $push: { month: '$_id.month', daily: '$daily' }
              }
            }
          }];
          break;
      }
  
      const result = await this.model.aggregate([
        ...queryDate,
        ...querySummary
      ]).exec();
  
      const data = {
        [this.lowerName]: result
      };
  
      let response: resultQuery = {
        error: null,
        data: null
      };
      response.error = null;
      response.data = {
        status: 'success',
        data
      };
  
      return response;
    } catch (error) {
      return { error, data: null };
    }
  };

  public summaryCustom = async function summaryCustom(this: RESTful, req: any) {
    if (req.auth.credentials.type !== 'admin') throw Boom.unauthorized('unauthorized.', req.payload);
    try {
      // let created_by = req.auth && req.auth.credentials && req.auth.credentials._id;
  
      const item = await this.model.aggregate(stringToAggregate(req.payload.q)).exec();
  
      let response: resultQuery = {
        error: null,
        data: null
      };
      response.error = null;
      response.data = {
        status: 'success',
        data: item
      };
      return response;
    } catch (error) {
      console.log(error);
      return { error, data: null };
    }
  };

}


module.exports = RESTful;
