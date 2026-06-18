import type { NextFunction, Request, Response } from "express";
import { auctionsService } from "./auctions.service.js";

export const auctionsController = {
  async createAuction(req: Request, res: Response, next: NextFunction) {
    try {
      const auction = await auctionsService.createAuction(req.body);
      res.status(201).json({
        success: true,
        data: auction,
      });
    } catch (error) {
      next(error);
    }
  },

  async listAuctions(_req: Request, res: Response, next: NextFunction) {
    try {
      const auctions = await auctionsService.listAuctions();
      res.json({
        success: true,
        data: {
          auctions,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getAuctionById(req: Request, res: Response, next: NextFunction) {
    try {
      const auction = await auctionsService.getAuctionById(req.params.id);
      res.json({
        success: true,
        data: auction,
      });
    } catch (error) {
      next(error);
    }
  },

  async publishAuction(req: Request, res: Response, next: NextFunction) {
    try {
      const auction = await auctionsService.publishAuction(req.params.id);
      res.json({
        success: true,
        data: auction,
      });
    } catch (error) {
      next(error);
    }
  },

  async placeBid(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await auctionsService.placeBid(req.params.id, req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async closeAuction(req: Request, res: Response, next: NextFunction) {
    try {
      const auction = await auctionsService.closeAuction(req.params.id);
      res.json({
        success: true,
        data: auction,
      });
    } catch (error) {
      next(error);
    }
  },
};

