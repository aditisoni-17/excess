import { ApiError } from "../../shared/error-handler.js";
import { auctionsRepository } from "./auctions.repository.js";
import { createAuctionSchema, bidAuctionSchema, auctionIdParamSchema } from "./auctions.validation.js";
import { inventoryService } from "../inventory/inventory.service.js";
import { auctionLifecycleService } from "./auction-lifecycle.service.js";

export const auctionsService = {
  async createAuction(body: unknown) {
    const parsed = createAuctionSchema.parse(body);
    if (new Date(parsed.endTime) <= new Date(parsed.startTime)) {
      throw new ApiError(400, "End time must be after start time");
    }

    const inventory = await inventoryService.getInventoryById(parsed.inventoryId);
    const alreadyAuctioned = await auctionsRepository.findAuctionForInventory(parsed.inventoryId);
    if (alreadyAuctioned) {
      throw new ApiError(409, "Inventory already auctioned");
    }

    return auctionsRepository.create({
      inventoryId: parsed.inventoryId,
      createdByUserId: parsed.createdByUserId ?? null,
      title: inventory.title,
      partNumber: inventory.partNumber,
      manufacturer: inventory.manufacturer,
      quantity: inventory.quantity,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      startingPrice: parsed.startingPrice,
      reservePrice: parsed.reservePrice ?? null,
    });
  },

  async listAuctions() {
    await auctionLifecycleService.resolveExpiredAuctions();
    const auctions = await auctionsRepository.list();
    return auctions;
  },

  async getAuctionById(id: string) {
    auctionIdParamSchema.parse({ id });
    await auctionLifecycleService.resolveExpiredAuction(id);
    const auction = await auctionsRepository.findById(id);
    if (!auction) {
      throw new ApiError(404, "Auction not found");
    }
    const bids = await auctionsRepository.getBidsByAuctionId(id);
    const highestBid = await auctionsRepository.findHighestBid(id);
    return {
      ...auction,
      bids,
      highestBid,
      bidCount: bids.length,
    };
  },

  async publishAuction(id: string) {
    auctionIdParamSchema.parse({ id });
    const auction = await auctionsRepository.findById(id);
    if (!auction) {
      throw new ApiError(404, "Auction not found");
    }
    if (auction.status !== "draft") {
      throw new ApiError(400, "Only draft auctions can be published");
    }
    if (new Date(auction.endTime) <= new Date()) {
      throw new ApiError(400, "Cannot publish an expired auction");
    }
    return auctionsRepository.publish(id);
  },

  async placeBid(id: string, body: unknown) {
    auctionIdParamSchema.parse({ id });
    const parsed = bidAuctionSchema.parse(body);
    return auctionsRepository.placeBid({
      auctionId: id,
      bidderCompanyId: parsed.bidderCompanyId,
      amount: parsed.amount,
    });
  },

  async closeAuction(id: string) {
    auctionIdParamSchema.parse({ id });
    return auctionLifecycleService.settleAuction(id);
  },
};
