export type AuctionStatus = "draft" | "scheduled" | "live" | "closed";

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
  title: string;
  description: string;
  category: string;
  sellerName: string;
  startingPrice: number;
  reservePrice: number | null;
  currentPrice: number;
  bidIncrement: number;
  currency: string;
  status: AuctionStatus;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
  bids?: Bid[];
};

