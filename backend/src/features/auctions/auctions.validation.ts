import { z } from "zod";
import { isoDateTimeSchema, positiveMoneySchema, uuidSchema } from "../../shared/validation.js";

export const auctionIdParamSchema = z.object({
  id: uuidSchema,
});

export const createAuctionSchema = z.object({
  inventoryId: uuidSchema,
  createdByUserId: uuidSchema.optional(),
  startTime: isoDateTimeSchema,
  endTime: isoDateTimeSchema,
  startingPrice: z.coerce.number().nonnegative(),
  reservePrice: z.coerce.number().nonnegative().optional(),
});

export const bidAuctionSchema = z.object({
  bidderCompanyId: uuidSchema,
  amount: positiveMoneySchema,
});

