import axios from "axios";
import type { Auction, Bid } from "./types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api",
});

export async function fetchAuctions() {
  const response = await api.get<{ auctions: Auction[] }>("/auctions");
  return response.data.auctions;
}

export async function fetchAuction(id: string) {
  const response = await api.get<{ auction: Auction }>("/auctions/" + id);
  return response.data.auction;
}

export async function createAuction(payload: {
  title: string;
  description: string;
  category: string;
  sellerName: string;
  startingPrice: number;
  reservePrice?: number;
  bidIncrement: number;
  currency: string;
  startsAt: string;
  endsAt: string;
}) {
  const response = await api.post<{ auction: Auction }>("/auctions", payload);
  return response.data.auction;
}

export async function placeBid(auctionId: string, payload: {
  bidderName: string;
  bidderCompany?: string;
  amount: number;
}) {
  const response = await api.post<{ auction: Auction; bid: Bid }>(`/auctions/${auctionId}/bids`, payload);
  return response.data;
}
