import * as dotenv from 'dotenv'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import checkAuth from './middleware/checkAuth'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

module.exports =async (app:any) => {
  dotenv.config()
  app.use(helmet())
  app.use(cors())
  app.use(express.json())
  app.use(morgan('dev'))
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())
  app.all('*', checkAuth)
}