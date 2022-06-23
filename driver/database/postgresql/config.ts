'use strict';

const Sequelize = require('sequelize');
const SequelizeModel = require('sequelize/lib/model');

const DATABASE = process.env.DB_PG_DATABASE;
const USERNAME = process.env.DB_PG_USERNAME;
const PASSWORD = process.env.DB_PG_PASSWORD;
const HOST = process.env.DB_PG_HOST;
const PORT = process.env.DB_PG_PORT;
const DIALECT = process.env.DB_PG_DIALECT;
const BENCHMARK = process.env.DB_PG_BENCHMARK;
const LOGGING = process.env.DB_PG_LOGGING;

let CONFIG = {
  database: DATABASE,
  username: USERNAME,
  password: PASSWORD,
  host: HOST,
  port: parseInt(PORT),
  dialect: DIALECT,
  benchmark: BENCHMARK === 'true',
  logging: LOGGING === 'true'
};

function dbError(err: any) {
  console.log('sequelize error');
  console.error(err);
  throw err;
}

const orgFindAll = SequelizeModel.findAll;
SequelizeModel.findAll = function() {
  return orgFindAll.apply(this, arguments).catch((err: any) => {
    dbError(err);
  });
};

const orgFindOne = SequelizeModel.findOne;
SequelizeModel.findOne = function() {
  return orgFindOne.apply(this, arguments).catch((err: any) => {
    dbError(err);
  });
};

const orgCreate = SequelizeModel.create;
SequelizeModel.create = function() {
  return orgCreate.apply(this, arguments).catch((err: any) => {
    dbError(err);
  });
};

const orgUpdate = SequelizeModel.update;
SequelizeModel.update = function() {
  return orgUpdate.apply(this, arguments).catch((err: any) => {
    dbError(err);
  });
};

const orgFindAndCountAll = SequelizeModel.findAndCountAll;
SequelizeModel.findAndCountAll = function() {
  return orgFindAndCountAll.apply(this, arguments).catch((err: any) => {
    dbError(err);
  });
};

let result: any = {}
if (!process.env.DB_PG_DATABASE) {
  result = {};
} else{
  const pg = new Sequelize(CONFIG);

  // tunnel(configTunnel, function (error, server) {
  // 	if(error) console.log("SSH connection error: " + error);

  //   let TUNNEL_PORT = server._connectionKey.split(':')[2];
  //   let MONGO_URL = `mongodb://localhost:${TUNNEL_PORT}/${config.DB_MONGO.NAME}`;
  //   if (NODE_MICRO_NAME) MONGO_URL += `-${NODE_MICRO_NAME.split('/')[1]}`;

  //   mongoose.connect(MONGO_URL, {
  //     useNewUrlParser: true,
  //     useUnifiedTopology: true,
  //     useCreateIndex: true
  // 	});
  // });

  pg.query = function() {
    return Sequelize.prototype.query.apply(this, arguments).catch((err: any) => {
      dbError(err);
    });
  };

  pg
    .authenticate()
    .then(() => {
      console.log('PostgreSQL Connected');
    })
    .catch((err: any) => {
      console.log(err);
      console.error('PostgreSQL connection error. Please make sure PostgreSQL is running.');
      process.exit();
    });

    result = pg;
}

export default result;
