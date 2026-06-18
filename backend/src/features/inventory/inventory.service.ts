import { ApiError } from "../../shared/error-handler.js";
import { createInventorySchema } from "./inventory.validation.js";
import { inventoryRepository } from "./inventory.repository.js";

export const inventoryService = {
  async createInventory(body: unknown) {
    const parsed = createInventorySchema.parse(body);
    return inventoryRepository.create({
      companyId: parsed.companyId,
      sku: parsed.sku,
      partNumber: parsed.partNumber,
      manufacturer: parsed.manufacturer,
      title: parsed.title,
      description: parsed.description,
      quantity: parsed.quantity,
      unitCondition: parsed.unitCondition,
      location: parsed.location,
    });
  },

  async listInventory() {
    return inventoryRepository.list();
  },

  async getInventoryById(id: string) {
    const inventory = await inventoryRepository.findById(id);
    if (!inventory) {
      throw new ApiError(404, "Inventory not found");
    }
    return inventory;
  },
};

