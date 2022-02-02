import express, { Request, Response } from "express";

module.exports = (routes: any) => {
  // list
  routes.get('/', async (req: Request, res: Response) => {
    try {
      res.status(200).send('ok');
    } catch (e) {
      res.status(500).send(e);
    }
  })

  // get
  routes.get('/:id', async (req: Request, res: Response) => {
    try {
      res.status(200).send(req.params.id);
    } catch (e) {
      res.status(500).send(e);
    }
  })

  routes.get('/sing/:a', async (req: Request, res: Response) => {
    try {
      res.status(200).send(req.params.id);
    } catch (e) {
      res.status(500).send(e);
    }
  })
}