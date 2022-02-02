import * as dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import os from 'os'
import db from './driver/database/mongodb/config'
import listEndpoints from 'express-list-endpoints'
import { AddressInfo } from 'net'
import { itemsRouter } from "./src/items/items.routes"

if (!process.env.APP_PORT) {
  process.exit(1)
}

require('./driver/database/mongodb/config').db

const interfaces = os.networkInterfaces()
let addresses: string[] = []
for (var k in interfaces) {
  for (var k2 in interfaces[k]) {
    var address = interfaces[k][k2]
    if (address.family === 'IPv4' && !address.internal) {
      addresses.push(address.address)
    }
  }
}

const PORT:number = parseInt(process.env.APP_PORT as string, 10)
const app = express()

const start = async () => {
  // package
  dotenv.config()
  app.use(helmet())
  app.use(cors())
  app.use(express.json())

  // plugin
  await require('./app-plugins')(app)
  // app.use("/api/menu/items", itemsRouter)

}

const run = app.listen(PORT, addresses[0], async () => {
  await start()
  console.table(listEndpoints(app))
  db
  const { address } = run.address() as AddressInfo
  console.log(`Running on http://${address}:${PORT}`)
})
