export type AuctionStatus = "draft" | "scheduled" | "live" | "closed";

export type AuctionRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  seller_name: string;
  starting_price: string;
  reserve_price: string | null;
  current_price: string;
  bid_increment: string;
  currency: string;
  status: AuctionStatus;
  starts_at: string;
  ends_at: string;
  created_at: string;
  updated_at: string;
};

export type BidRecord = {
  id: string;
  auction_id: string;
  bidder_name: string;
  bidder_company: string;
  amount: string;
  created_at: string;
};

