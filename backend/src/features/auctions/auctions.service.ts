import { ApiError } from "../../shared/error-handler.js";
import { auctionCreateSchema, bidCreateSchema } from "../../shared/validation.js";
import { auctionsRepository } from "./auctions.repository.js";

export const auctionsService = {
  async listAuctions() {
    await auctionsRepository.closeExpiredAuctions();
    return auctionsRepository.list();
  },

  async getAuction(id: string) {
    await auctionsRepository.closeExpiredAuctions();
    const auction = await auctionsRepository.findById(id);
    if (!auction) {
      throw new ApiError(404, "Auction not found");
    }
    const bids = await auctionsRepository.getBids(id);
    return { ...auction, bids };
  },

  async createAuction(body: unknown) {
    const parsed = auctionCreateSchema.parse(body);
    if (new Date(parsed.endsAt) <= new Date(parsed.startsAt)) {
      throw new ApiError(400, "Auction end time must be after start time");
    }
    return auctionsRepository.create({
      title: parsed.title,
      description: parsed.description,
      category: parsed.category,
      sellerName: parsed.sellerName,
      startingPrice: parsed.startingPrice,
      reservePrice: parsed.reservePrice ?? null,
      bidIncrement: parsed.bidIncrement ?? 1,
      currency: parsed.currency,
      startsAt: parsed.startsAt,
      endsAt: parsed.endsAt,
    });
  },

  async placeBid(auctionId: string, body: unknown) {
    const parsed = bidCreateSchema.parse(body);
    return auctionsRepository.placeBid({
      auctionId,
      bidderName: parsed.bidderName,
      bidderCompany: parsed.bidderCompany,
      amount: parsed.amount,
    });
  },
};

