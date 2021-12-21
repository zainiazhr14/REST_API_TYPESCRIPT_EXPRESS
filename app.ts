import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import os from 'os';
import db from './driver/database/mongodb/config'
import { AddressInfo } from 'net'
import { itemsRouter } from "./src/items/items.routes";
import * as dotenv from 'dotenv';

if (!process.env.APP_PORT) {
  process.exit(1);
}

const interfaces = os.networkInterfaces();
let addresses: string[] = [];
for (var k in interfaces) {
  for (var k2 in interfaces[k]) {
    var address = interfaces[k][k2];
    if (address.family === 'IPv4' && !address.internal) {
      addresses.push(address.address);
    }
  }
}

const PORT:number = parseInt(process.env.APP_PORT as string, 10);
const app = express();

// package
dotenv.config();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use("/api/menu/items", itemsRouter);



app.get('/', (req, res) => res.send('Hello World'));


// http.createServer(app).listen(PORT)
const start = app.listen(PORT, addresses[0], () => {
  const { address } = start.address() as AddressInfo;
  console.log(`Running on http://${address}:${PORT}`);
  
  db;
});
