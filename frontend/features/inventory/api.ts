import axios from "axios";
import type { InventoryItem } from "../auctions/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api",
});

export type InventoryPayload = {
  partNumber: string;
  manufacturer: string;
  dateCode: string;
  quantity: number;
  unitCondition: string;
  location: string;
};

export async function fetchInventory() {
  const response = await api.get<{ success: boolean; data: { inventory: InventoryItem[] } }>("/inventory");
  return response.data.data.inventory;
}

export async function createInventory(payload: InventoryPayload) {
  const response = await api.post<{ success: boolean; data: InventoryItem }>("/inventory", payload);
  return response.data.data;
}

export async function updateInventory(id: string, payload: InventoryPayload) {
  const response = await api.put<{ success: boolean; data: InventoryItem }>(`/inventory/${id}`, payload);
  return response.data.data;
}

export async function deleteInventory(id: string) {
  const response = await api.delete<{ success: boolean; data: { deleted: true } }>(`/inventory/${id}`);
  return response.data.data;
}

