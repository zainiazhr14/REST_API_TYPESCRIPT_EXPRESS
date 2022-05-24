import express from 'express'
import os from 'os'
import db from './driver/database/mongodb/config'
import listEndpoints from 'express-list-endpoints'
import { AddressInfo } from 'net'

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
  // plugin
  await require('./app-package')(app)
  await require('./app-plugins')(app)
  db
  console.table(listEndpoints(app))
}

const run = app.listen(PORT, addresses[0], async () => {
  await start()
  const { address } = run.address() as AddressInfo
  console.log(`Running on http://${address}:${PORT}`)
})
