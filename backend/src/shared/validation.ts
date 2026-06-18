import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const isoDateTimeSchema = z.string().datetime();
export const positiveMoneySchema = z.coerce.number().positive();
export const nonNegativeMoneySchema = z.coerce.number().nonnegative();

