import pg from "pg";
import type { CreateInventoryInput, InventoryRecord, UpdateInventoryInput } from "./inventory.types.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function resolveDemoCompanyId(client = pool) {
  const result = await client.query<{ id: string }>(
    `insert into companies (name, legal_name)
     values ('Mirai Demo Seller', 'Mirai Demo Seller')
     on conflict (name) do update set legal_name = excluded.legal_name, updated_at = now()
     returning id`,
  );
  return result.rows[0].id;
}

const mapInventory = (row: InventoryRecord) => ({
  id: row.id,
  companyId: row.company_id,
  sku: row.sku,
  partNumber: row.part_number,
  manufacturer: row.manufacturer,
  title: row.title,
  description: row.description,
  dateCode: row.date_code,
  quantity: row.quantity,
  unitCondition: row.unit_condition,
  location: row.location,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const inventoryRepository = {
  async create(input: CreateInventoryInput) {
    const companyId = await resolveDemoCompanyId();
    const result = await pool.query<InventoryRecord>(
      `insert into inventory (
        company_id, sku, part_number, manufacturer, title, description,
        date_code, quantity, unit_condition, location
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      returning *`,
      [
        companyId,
        input.sku,
        input.partNumber,
        input.manufacturer,
        input.title,
        input.description,
        input.dateCode,
        input.quantity,
        input.unitCondition,
        input.location,
      ],
    );
    return mapInventory(result.rows[0]);
  },

  async list() {
    const result = await pool.query<InventoryRecord>(
      "select * from inventory order by created_at desc",
    );
    return result.rows.map(mapInventory);
  },

  async findById(id: string) {
    const result = await pool.query<InventoryRecord>(
      "select * from inventory where id = $1",
      [id],
    );
    return result.rows[0] ? mapInventory(result.rows[0]) : null;
  },

  async update(id: string, input: UpdateInventoryInput) {
    const result = await pool.query<InventoryRecord>(
      `update inventory
       set sku = $2,
           part_number = $3,
           manufacturer = $4,
           title = $5,
           description = $6,
           date_code = $7,
           quantity = $8,
           unit_condition = $9,
           location = $10
       where id = $1
       returning *`,
      [
        id,
        input.sku,
        input.partNumber,
        input.manufacturer,
        input.title,
        input.description,
        input.dateCode,
        input.quantity,
        input.unitCondition,
        input.location,
      ],
    );
    return result.rows[0] ? mapInventory(result.rows[0]) : null;
  },

  async delete(id: string) {
    const result = await pool.query(
      "delete from inventory where id = $1 returning id",
      [id],
    );
    return result.rowCount > 0;
  },

  async hasAuction(id: string) {
    const result = await pool.query(
      "select 1 from auctions where inventory_id = $1 limit 1",
      [id],
    );
    return result.rowCount > 0;
  },
};
