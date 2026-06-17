import { Router } from "express";
import { auctionsService } from "./auctions.service.js";

export const auctionsRouter = Router();

auctionsRouter.get("/", async (_req, res, next) => {
  try {
    const auctions = await auctionsService.listAuctions();
    res.json({ auctions });
  } catch (error) {
    next(error);
  }
});

auctionsRouter.get("/:id", async (req, res, next) => {
  try {
    const auction = await auctionsService.getAuction(req.params.id);
    res.json({ auction });
  } catch (error) {
    next(error);
  }
});

auctionsRouter.post("/", async (req, res, next) => {
  try {
    const auction = await auctionsService.createAuction(req.body);
    res.status(201).json({ auction });
  } catch (error) {
    next(error);
  }
});

auctionsRouter.post("/:id/bids", async (req, res, next) => {
  try {
    const result = await auctionsService.placeBid(req.params.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
