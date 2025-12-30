import { Hono } from 'hono'
import * as z from 'zod'
import { zValidator } from '@hono/zod-validator'
import db from '../db/index.js'
import { create } from 'domain'

const roleRoutes = new Hono()

type Roles = {
    id: number
    name: string
}


roleRoutes.get('/', async (c) => {
    let sql = 'SELECT * FROM roles'
    let stmt = db.prepare(sql)
    let roles = await stmt.all()

    return c.json({ message: 'List of roles', data : roles })
})

roleRoutes.get('/:id', (c) => {
    const { id } = c.req.param()
    let sql = 'SELECT * FROM roles WHERE id = @id'
    let stmt = db.prepare<{id:string}, Roles>(sql)
    let role = stmt.get({id:id})

    if (!role) {
        return c.json({ message: `Role not found`}, 404)
    }

    return c.json({
        message: `Role detail for ID: ${id}`,
        data: role
    })
})



const CreateRoleSchema = z.object({
    name: z.string("กรุณากรอกชื่อบทบาท")
})

roleRoutes.post('/',
    zValidator('json' , CreateRoleSchema, (result,c) => {
        if (!result.success) {
            return c.json({
                message: 'Validation failed',
                errors : result.error.issues },400)
            }
    })

     , async (c) => {
        const body = await c.req.json<Roles>()
        let sql = `INSERT INTO roles
            (name)
            VALUES(@name);`

        let stmt = db.prepare<Omit<Roles, 'id'>>(sql)
        let result = stmt.run(body)

        if (result.changes === 0) {
            return c.json({ message: 'Create role failed' }, 500)
        }
        let lastRowid = result.lastInsertRowid as number

        let sql2 = 'SELECT * FROM roles WHERE id = ?'
        let stmt2 = db.prepare<[ number], Roles>(sql2)
        let newRole = stmt2.get( lastRowid )

        return c.json({ message: 'Create new role', data: newRole })
    }
)



const UpdateRoleSchema = z.object({
  name: z.string("กรุณากรอกชื่อบทบาท")
})

roleRoutes.put(
  '/:id',
  zValidator('json', UpdateRoleSchema, (result, c) => {
    if (!result.success) {
      return c.json({
        message: 'Validation failed',
        errors: result.error.issues
      }, 400)
    }
  }),
  async (c) => {
    const { id } = c.req.param()
    const body = await c.req.json<Omit<Roles, 'id'>>()

    let sql = `
      UPDATE roles
      SET name = @name
      WHERE id = @id
    `
    let stmt = db.prepare<{ name: string; id: string }>(sql)
    let result = stmt.run({ name: body.name, id })

    if (result.changes === 0) {
      return c.json({ message: 'Role not found or no change' }, 404)
    }

    let sql2 = 'SELECT * FROM roles WHERE id = ?'
    let stmt2 = db.prepare<[number], Roles>(sql2)
    let updatedRole = stmt2.get(Number(id))

    return c.json({
      message: `Update role ID: ${id}`,
      data: updatedRole
    })
  }
)



roleRoutes.delete('/:id', async (c) => {
  const { id } = c.req.param()

  let sql = 'DELETE FROM roles WHERE id = ?'
  let stmt = db.prepare<[number]>(sql)
  let result = stmt.run(Number(id))

  if (result.changes === 0) {
    return c.json({ message: 'Role not found' }, 404)
  }

  return c.json({
    message: `Delete role ID: ${id} success`
  })
})




export default roleRoutes
