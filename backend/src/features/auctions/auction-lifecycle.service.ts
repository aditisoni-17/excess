import { ApiError } from "../../shared/error-handler.js";
import { auctionsRepository } from "./auctions.repository.js";
import { auctionIdParamSchema } from "./auctions.validation.js";

let sweepTimer: NodeJS.Timeout | null = null;

export const auctionLifecycleService = {
  async resolveExpiredAuctions(now = new Date()) {
    return auctionsRepository.resolveExpiredAuctions(now);
  },

  async resolveExpiredAuction(auctionId: string, now = new Date()) {
    auctionIdParamSchema.parse({ id: auctionId });
    const auction = await auctionsRepository.findById(auctionId);
    if (!auction) {
      throw new ApiError(404, "Auction not found");
    }
    if (auction.status !== "live") {
      return auction;
    }
    if (new Date(auction.endTime) > now) {
      return auction;
    }
    return auctionsRepository.settleAuction(auctionId);
  },

  async settleAuction(auctionId: string) {
    auctionIdParamSchema.parse({ id: auctionId });
    const auction = await auctionsRepository.findById(auctionId);
    if (!auction) {
      throw new ApiError(404, "Auction not found");
    }
    if (auction.status === "ended" || auction.status === "sold") {
      return auction;
    }
    return auctionsRepository.settleAuction(auctionId);
  },

  startAutoResolution(intervalMs = 60_000) {
    if (sweepTimer) {
      return sweepTimer;
    }

    sweepTimer = setInterval(() => {
      void auctionsRepository.resolveExpiredAuctions().catch((error: unknown) => {
        console.error("Auction lifecycle sweep failed", error);
      });
    }, intervalMs);

    sweepTimer.unref?.();
    return sweepTimer;
  },
};
