export type AuctionStatus = "draft" | "live" | "ended" | "sold";

export type Bid = {
  id: string;
  auctionId: string;
  bidderName: string;
  bidderCompany: string;
  amount: number;
  createdAt: string;
};

export type Auction = {
  id: string;
  inventoryId?: string;
  createdByUserId?: string | null;
  title: string;
  partNumber?: string;
  manufacturer?: string;
  quantity?: number;
  description: string;
  category: string;
  startingPrice: number;
  reservePrice: number | null;
  bidIncrement: number;
  currentPrice?: number;
  currency?: string;
  status: AuctionStatus;
  startsAt?: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
  highestBid?: number | null;
  bidCount?: number;
  bids?: Bid[];
};

export type InventoryItem = {
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
};
