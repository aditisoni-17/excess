import type { AuctionStatus, Bid, InventoryItem } from "../../shared/database.interfaces.js";

export interface CreateAuctionInput {
  inventoryId: string;
  createdByUserId: string | null;
  startTime: string;
  endTime: string;
  startingPrice: number;
  reservePrice: number | null;
}

export interface AuctionRecord {
  id: string;
  inventory_id: string;
  created_by_user_id: string | null;
  title: string;
  part_number: string;
  manufacturer: string;
  quantity: number;
  starting_price: string;
  reserve_price: string | null;
  start_time: string;
  end_time: string;
  status: AuctionStatus;
  created_at: string;
  updated_at: string;
}

export interface BidRecord {
  id: string;
  auction_id: string;
  bidder_company_id: string;
  amount: string;
  timestamp: string;
}

export interface AuctionView {
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
  highestBid: number | null;
  bidCount: number;
  bids?: Bid[];
  inventory?: InventoryItem;
}

export interface PublishedAuctionResult {
  auction: AuctionView;
  inventoryAlreadyAuctioned: boolean;
}

