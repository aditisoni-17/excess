import { z } from "zod";
import { uuidSchema } from "../../shared/validation.js";

const text = z.string().trim().min(1).max(255);

export const inventoryIdParamSchema = z.object({
  id: uuidSchema,
});

export const createInventorySchema = z.object({
  partNumber: text.max(100),
  manufacturer: text.max(120),
  dateCode: text.max(40),
  quantity: z.coerce.number().int().nonnegative(),
  unitCondition: z.string().trim().min(1).max(80),
  location: z.string().trim().max(120).optional().default(""),
});

export const updateInventorySchema = createInventorySchema;
