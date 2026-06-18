import { ApiError } from "../../shared/error-handler.js";
import { createInventorySchema, updateInventorySchema } from "./inventory.validation.js";
import { inventoryRepository } from "./inventory.repository.js";

export const inventoryService = {
  async createInventory(body: unknown) {
    const parsed = createInventorySchema.parse(body);
    const title = `${parsed.manufacturer} ${parsed.partNumber}`.trim();
    const description = `Condition: ${parsed.unitCondition}; Date Code: ${parsed.dateCode}; Location: ${parsed.location || "N/A"}`;
    const sku = `${parsed.partNumber}-${parsed.dateCode}`.replace(/\s+/g, "-").toUpperCase();
    return inventoryRepository.create({
      sku,
      partNumber: parsed.partNumber,
      manufacturer: parsed.manufacturer,
      title,
      description,
      dateCode: parsed.dateCode,
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

  async updateInventory(id: string, body: unknown) {
    const inventory = await inventoryRepository.findById(id);
    if (!inventory) {
      throw new ApiError(404, "Inventory not found");
    }
    if (await inventoryRepository.hasAuction(id)) {
      throw new ApiError(409, "Inventory already auctioned");
    }
    const parsed = updateInventorySchema.parse(body);
    const title = `${parsed.manufacturer} ${parsed.partNumber}`.trim();
    const description = `Condition: ${parsed.unitCondition}; Date Code: ${parsed.dateCode}; Location: ${parsed.location || "N/A"}`;
    const sku = `${parsed.partNumber}-${parsed.dateCode}`.replace(/\s+/g, "-").toUpperCase();
    const updated = await inventoryRepository.update(id, {
      sku,
      partNumber: parsed.partNumber,
      manufacturer: parsed.manufacturer,
      title,
      description,
      dateCode: parsed.dateCode,
      quantity: parsed.quantity,
      unitCondition: parsed.unitCondition,
      location: parsed.location,
    });
    if (!updated) {
      throw new ApiError(500, "Failed to update inventory");
    }
    return updated;
  },

  async deleteInventory(id: string) {
    const inventory = await inventoryRepository.findById(id);
    if (!inventory) {
      throw new ApiError(404, "Inventory not found");
    }
    if (await inventoryRepository.hasAuction(id)) {
      throw new ApiError(409, "Inventory already auctioned");
    }
    const deleted = await inventoryRepository.delete(id);
    if (!deleted) {
      throw new ApiError(500, "Failed to delete inventory");
    }
    return { deleted: true };
  },
};
