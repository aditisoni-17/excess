import { Router } from "express";
import { auctionsController } from "./auctions.controller.js";

export const auctionsRouter = Router();

auctionsRouter.post("/", auctionsController.createAuction);
auctionsRouter.get("/", auctionsController.listAuctions);
auctionsRouter.get("/:id", auctionsController.getAuctionById);
auctionsRouter.post("/:id/publish", auctionsController.publishAuction);
auctionsRouter.post("/:id/bid", auctionsController.placeBid);
auctionsRouter.post("/:id/close", auctionsController.closeAuction);

