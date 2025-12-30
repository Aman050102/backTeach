
import {Hono} from 'hono';
import * as z from 'zod'
import { zValidator } from '@hono/zod-validator'

const productsRouters = new Hono()

const createProductsSchema = z.object({
  id: z.string()
  .min(5),
  name: z.string()
    .min(5),
  price: z.number(),
  cost : z.number(),
  note: z.string()
  .optional(),
})

productsRouters.get('/', (c) => {
  return c.json({ message: 'List of users'})
})

productsRouters.get('/:id' , (c) => {
  const { id } = c.req.param()
  return c.json({ message: `User details for Id: ${id}`})
 })

productsRouters.post('/',
  zValidator('json', createProductsSchema)
  , async (c) => {
  const body = await c.req.json()
  return c.json({ message: 'Product created', data: body})

})
export default productsRouters


