import express, { Request, Response } from "express";

const plugin = {
  register: async () => {
    const userRouter = express.Router();

    const routes = await require('./routes')(userRouter)
    require('./model/Article')
    return userRouter
  }
}

module.exports = plugin;