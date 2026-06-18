import pg from "pg";
import type { CreateInventoryInput, InventoryRecord } from "./inventory.types.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const mapInventory = (row: InventoryRecord) => ({
  id: row.id,
  companyId: row.company_id,
  sku: row.sku,
  partNumber: row.part_number,
  manufacturer: row.manufacturer,
  title: row.title,
  description: row.description,
  quantity: row.quantity,
  unitCondition: row.unit_condition,
  location: row.location,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const inventoryRepository = {
  async create(input: CreateInventoryInput) {
    const result = await pool.query<InventoryRecord>(
      `insert into inventory (
        company_id, sku, part_number, manufacturer, title, description,
        quantity, unit_condition, location
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      returning *`,
      [
        input.companyId,
        input.sku,
        input.partNumber,
        input.manufacturer,
        input.title,
        input.description,
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
};

