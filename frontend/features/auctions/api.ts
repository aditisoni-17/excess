import axios from "axios";
import type { Auction, Bid, InventoryItem } from "./types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api",
});

export async function fetchAuctions() {
  const response = await api.get<{ success: boolean; data: { auctions: Auction[] } }>("/auctions");
  return response.data.data.auctions;
}

export async function fetchInventory() {
  const response = await api.get<{ success: boolean; data: { inventory: InventoryItem[] } }>("/inventory");
  return response.data.data.inventory;
}

export async function fetchAuction(id: string) {
  const response = await api.get<{ success: boolean; data: Auction }>("/auctions/" + id);
  return response.data.data;
}

export async function createAuction(payload: {
  inventoryId: string;
  startTime: string;
  endTime: string;
  startingPrice: number;
  reservePrice?: number;
  createdByUserId?: string;
}) {
  const response = await api.post<{ success: boolean; data: Auction }>("/auctions", payload);
  return response.data.data;
}

export async function placeBid(auctionId: string, payload: {
  bidderName: string;
  bidderCompany?: string;
  amount: number;
}) {
  const response = await api.post<{ success: boolean; data: { bid: Bid; highestBid: number } }>(
    `/auctions/${auctionId}/bid`,
    payload,
  );
  return response.data.data;
}
