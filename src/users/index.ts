import {Hono} from 'hono';
import * as z from 'zod'
import { zValidator } from '@hono/zod-validator'
import db from '../db/index.js'


const userRouters = new Hono()
const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.email()
})

userRouters.get('/', async (c) => {
  let sql = 'SELECT * FROM users'
  let stmt = db.prepare(sql)
  let users = await stmt.all()
  return c.json({ message: 'List of users', data : users})
})

userRouters.get('/:id' , (c) => {
  const { id } = c.req.param()
  return c.json({ message: `User details for Id: ${id}`})
 })

userRouters.post('/',
  zValidator('json', createUserSchema)
  , async (c) => {
  const body = await c.req.json()
  return c.json({ message: 'User created', data: body})

})


export default userRouters
