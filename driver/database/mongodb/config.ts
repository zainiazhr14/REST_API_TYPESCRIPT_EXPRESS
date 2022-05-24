import tunnel from 'tunnel-ssh';
import log from '../../../utility/logger'

const mongoose = require('mongoose');

let NODE_MICRO: number = parseInt(process.env.NODE_MICRO) || 0;

const DB_MONGO_NAME = process.env.DB_MONGO_NAME;
const DB_MONGO_BASE_URL = process.env.DB_MONGO_BASE_URL;

const USERNAME = process.env.DB_MONGO_TUNNEL_CONFIG_USERNAME;
const PASSWORD = process.env.DB_MONGO_TUNNEL_CONFIG_PASSWORD;
const HOST = process.env.DB_MONGO_TUNNEL_CONFIG_HOST;
const PORT = parseInt(process.env.DB_MONGO_TUNNEL_CONFIG_PORT);
const DSTPORT: number = parseInt(process.env.DB_MONGO_TUNNEL_CONFIG_DSTPORT);


if (!DB_MONGO_NAME) {
  log.error('cannot find database name')
  process.exit(1)
};

if (PASSWORD) {
  let CONFIG_TUNNEL = {
    username: USERNAME,
    password: PASSWORD,
    host: HOST,
    port: PORT,
    dstPort: DSTPORT,
    localPort: 27017 + NODE_MICRO
  }

  tunnel(CONFIG_TUNNEL, function (error: any, server: any) {
    if(error) log.error('SSH connection error: ' + error);

    let TUNNEL_PORT = server._connectionKey.split(':')[2];
    let MONGO_URL = `mongodb://localhost:${TUNNEL_PORT}/${DB_MONGO_NAME}`;
    // if (NODE_MICRO_NAME) MONGO_URL += `-${NODE_MICRO_NAME.split('/')[1]}`;

    mongoose.connect(MONGO_URL);
  });
} else {
  mongoose.connect(DB_MONGO_BASE_URL + DB_MONGO_NAME);
}

const db = mongoose.connection;

db.on('error', (err: any) => {
  log.error(err);
  log.error('MongoDB connection error. Please make sure MongoDB is running.');

  process.exit(1);
})

db.once('open', () => {
  log.info('MongoDB Connected')
})

export default db;