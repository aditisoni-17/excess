import { Router } from "express";
import { inventoryController } from "./inventory.controller.js";

export const inventoryRouter = Router();

inventoryRouter.post("/", inventoryController.createInventory);
inventoryRouter.get("/", inventoryController.listInventory);
inventoryRouter.put("/:id", inventoryController.updateInventory);
inventoryRouter.delete("/:id", inventoryController.deleteInventory);
