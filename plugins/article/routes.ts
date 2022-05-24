import jwt from 'jsonwebtoken'
import RESTfull from '../../driver/database/mongodb/rest'

const ArticleREST = new RESTfull('article', 'Article')

module.exports = (routes: any) => {
  routes.get('/', async (req: any, res: any) => {
    const { data, error } = await ArticleREST.list(req);
    if (error) return res.status(400).send(error);

    return res.status(200).send(data)
  })

  routes.get('/token', async (req: any, res: any) => {
    const user = {
      name: 'zaini',
      work: 'IT'
    }

    const token = jwt.sign(user, process.env.JWT_TOKEN_SECRET, { algorithm: 'HS256', expiresIn: '2w' })
    
    res.json(token)
  })
}