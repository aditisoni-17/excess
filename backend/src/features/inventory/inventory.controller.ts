import type { Request, Response, NextFunction } from "express";
import { inventoryService } from "./inventory.service.js";

export const inventoryController = {
  async createInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const inventory = await inventoryService.createInventory(req.body);
      res.status(201).json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      next(error);
    }
  },

  async listInventory(_req: Request, res: Response, next: NextFunction) {
    try {
      const inventory = await inventoryService.listInventory();
      res.json({
        success: true,
        data: {
          inventory,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

