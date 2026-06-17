import { z } from "zod";

export const auctionCreateSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(5000).optional().default(""),
  category: z.string().min(1).max(80).optional().default(""),
  sellerName: z.string().min(2).max(120),
  startingPrice: z.number().nonnegative(),
  reservePrice: z.number().nonnegative().optional(),
  bidIncrement: z.number().positive().optional().default(1),
  currency: z.string().min(3).max(3).optional().default("USD"),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export const bidCreateSchema = z.object({
  bidderName: z.string().min(2).max(120),
  bidderCompany: z.string().max(120).optional().default(""),
  amount: z.number().positive(),
});

