import { z } from "zod";
import { uuidSchema } from "../../shared/validation.js";

const text = z.string().trim().min(1).max(255);

export const inventoryIdParamSchema = z.object({
  id: uuidSchema,
});

export const createInventorySchema = z.object({
  companyId: uuidSchema,
  sku: text.max(100),
  partNumber: text.max(100),
  manufacturer: text.max(120),
  title: text.max(180),
  description: z.string().trim().max(5000).optional().default(""),
  quantity: z.coerce.number().int().nonnegative(),
  unitCondition: z.string().trim().min(1).max(80).optional().default("unknown"),
  location: z.string().trim().max(120).optional().default(""),
});

