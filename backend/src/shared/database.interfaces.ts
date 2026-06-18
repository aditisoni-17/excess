export type AuctionStatus = "draft" | "live" | "ended" | "sold";

export interface Company {
  id: string;
  name: string;
  legalName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  companyId: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  companyId: string;
  sku: string;
  partNumber: string;
  manufacturer: string;
  title: string;
  description: string;
  quantity: number;
  unitCondition: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface Auction {
  id: string;
  inventoryId: string;
  createdByUserId: string | null;
  title: string;
  partNumber: string;
  manufacturer: string;
  quantity: number;
  startingPrice: number;
  reservePrice: number | null;
  startTime: string;
  endTime: string;
  status: AuctionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuctionView extends Auction {
  highestBid: number | null;
  bidCount: number;
  bids?: Bid[];
  inventory?: InventoryItem;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderCompanyId: string;
  amount: number;
  timestamp: string;
}
