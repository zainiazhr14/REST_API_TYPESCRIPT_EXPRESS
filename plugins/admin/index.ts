import express, { Request, Response } from "express";

const plugin = {
  register: async (app: any) => {    
    const adminRouter = express.Router();

    const routes = await require('./routes')(adminRouter)


    return adminRouter
  }
}

module.exports = plugin;