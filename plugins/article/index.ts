import express, { Request, Response } from "express";

const plugin = {
  register: async (redis_client: any) => {
    const userRouter = express.Router();

    await require('./routes')(userRouter, redis_client)
    
    return userRouter
  }
}

module.exports = plugin;