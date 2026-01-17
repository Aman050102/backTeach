import { Hono } from 'hono';
import * as z from 'zod';
import { zValidator } from '@hono/zod-validator';
import db from '../db/index.js';

const supplierRoutes = new Hono();

type Supplier = {
    SupplierID: number;
    Name: string;
    Contact: string;
    Address: string;
    Email: string;
    Phone: string;
};

// --- Schema สำหรับ Validation ---
const SupplierSchema = z.object({
    Name: z.string().min(1, "กรุณากรอกชื่อ Supplier"),
    Contact: z.string().min(1, "กรุณากรอกชื่อผู้ติดต่อ"),
    Address: z.string().min(1, "กรุณากรอกที่อยู่"),
    Email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
    Phone: z.string().min(10, "เบอร์โทรศัพท์ต้องมีอย่างน้อย 10 หลัก")
});

// 1. GET All Suppliers
supplierRoutes.get('/', (c) => {
    const sql = 'SELECT * FROM Suppliers';
    const stmt = db.prepare(sql);
    const suppliers = stmt.all();
    return c.json({ message: 'List of suppliers', data: suppliers });
});

// 2. GET Supplier by ID
supplierRoutes.get('/:id', (c) => {
    const { id } = c.req.param();
    const sql = 'SELECT * FROM Suppliers WHERE SupplierID = ?';
    const supplier = db.prepare(sql).get(id);

    if (!supplier) {
        return c.json({ message: 'Supplier not found' }, 404);
    }
    return c.json({ message: 'Supplier details', data: supplier });
});

// 3. POST Create Supplier
supplierRoutes.post('/',
    zValidator('json', SupplierSchema, (result, c) => {
        if (!result.success) {
            return c.json({ message: 'Validation failed', errors: result.error.issues }, 400);
        }
    }),
    async (c) => {
        const body = await c.req.json();
        const sql = `
            INSERT INTO Suppliers (Name, Contact, Address, Email, Phone)
            VALUES (@Name, @Contact, @Address, @Email, @Phone)
        `;

        const stmt = db.prepare(sql);
        const result = stmt.run(body);

        if (result.changes === 0) {
            return c.json({ message: 'Failed to create supplier' }, 500);
        }

        const newSupplier = db.prepare('SELECT * FROM Suppliers WHERE SupplierID = ?')
                              .get(result.lastInsertRowid);

        return c.json({ message: 'Supplier created successfully', data: newSupplier }, 201);
    }
);

// 4. PUT Update Supplier
supplierRoutes.put('/:id',
    zValidator('json', SupplierSchema, (result, c) => {
        if (!result.success) {
            return c.json({ message: 'Validation failed', errors: result.error.issues }, 400);
        }
    }),
    async (c) => {
        const { id } = c.req.param();
        const body = await c.req.json();

        const sql = `
            UPDATE Suppliers
            SET Name = @Name, Contact = @Contact, Address = @Address, Email = @Email, Phone = @Phone
            WHERE SupplierID = @id
        `;

        const result = db.prepare(sql).run({ ...body, id });

        if (result.changes === 0) {
            return c.json({ message: 'Supplier not found or no changes made' }, 404);
        }

        const updatedSupplier = db.prepare('SELECT * FROM Suppliers WHERE SupplierID = ?').get(id);
        return c.json({ message: 'Supplier updated successfully', data: updatedSupplier });
    }
);

// 5. DELETE Supplier
supplierRoutes.delete('/:id', (c) => {
    const { id } = c.req.param();
    const result = db.prepare('DELETE FROM Suppliers WHERE SupplierID = ?').run(id);

    if (result.changes === 0) {
        return c.json({ message: 'Supplier not found' }, 404);
    }

    return c.json({ message: `Supplier ID: ${id} deleted successfully` });
});

export default supplierRoutes;
