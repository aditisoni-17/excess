import pg from "pg";
import { ApiError } from "../../shared/error-handler.js";
import type { AuctionRecord, BidRecord } from "./auctions.types.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const mapAuction = (row: AuctionRecord) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  sellerName: row.seller_name,
  startingPrice: Number(row.starting_price),
  reservePrice: row.reserve_price === null ? null : Number(row.reserve_price),
  currentPrice: Number(row.current_price),
  bidIncrement: Number(row.bid_increment),
  currency: row.currency,
  status: row.status,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapBid = (row: BidRecord) => ({
  id: row.id,
  auctionId: row.auction_id,
  bidderName: row.bidder_name,
  bidderCompany: row.bidder_company,
  amount: Number(row.amount),
  createdAt: row.created_at,
});

export const auctionsRepository = {
  async list() {
    const result = await pool.query<AuctionRecord>(
      "select * from auctions order by created_at desc",
    );
    return result.rows.map(mapAuction);
  },

  async findById(id: string) {
    const result = await pool.query<AuctionRecord>(
      "select * from auctions where id = $1",
      [id],
    );
    return result.rows[0] ? mapAuction(result.rows[0]) : null;
  },

  async getBids(auctionId: string) {
    const result = await pool.query<BidRecord>(
      "select * from bids where auction_id = $1 order by amount desc, created_at asc",
      [auctionId],
    );
    return result.rows.map(mapBid);
  },

  async create(input: {
    title: string;
    description: string;
    category: string;
    sellerName: string;
    startingPrice: number;
    reservePrice: number | null;
    bidIncrement: number;
    currency: string;
    startsAt: string;
    endsAt: string;
  }) {
    const status = new Date(input.startsAt) > new Date() ? "scheduled" : "live";
    const result = await pool.query<AuctionRecord>(
      `insert into auctions (
        title, description, category, seller_name, starting_price, reserve_price,
        current_price, bid_increment, currency, status, starts_at, ends_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      returning *`,
      [
        input.title,
        input.description,
        input.category,
        input.sellerName,
        input.startingPrice,
        input.reservePrice,
        input.startingPrice,
        input.bidIncrement,
        input.currency,
        status,
        input.startsAt,
        input.endsAt,
      ],
    );
    return mapAuction(result.rows[0]);
  },

  async placeBid(input: {
    auctionId: string;
    bidderName: string;
    bidderCompany: string;
    amount: number;
  }) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      const auctionResult = await client.query<AuctionRecord>(
        "select * from auctions where id = $1 for update",
        [input.auctionId],
      );
      const auctionRow = auctionResult.rows[0];
      if (!auctionRow) {
        throw new ApiError(404, "Auction not found");
      }
      const auction = mapAuction(auctionRow);
      const now = new Date();
      if (auction.status === "closed" || now < new Date(auction.startsAt) || now > new Date(auction.endsAt)) {
        throw new ApiError(400, "Auction is not open for bidding");
      }
      if (input.amount < auction.currentPrice + auction.bidIncrement) {
        throw new ApiError(400, "Bid must meet the minimum increment");
      }
      const bidResult = await client.query<BidRecord>(
        `insert into bids (auction_id, bidder_name, bidder_company, amount)
         values ($1, $2, $3, $4)
         returning *`,
        [input.auctionId, input.bidderName, input.bidderCompany, input.amount],
      );
      const updatedAuction = await client.query<AuctionRecord>(
        `update auctions
         set current_price = $2, status = case when status = 'draft' then 'live' else status end, updated_at = now()
         where id = $1
         returning *`,
        [input.auctionId, input.amount],
      );
      await client.query("commit");
      return {
        auction: mapAuction(updatedAuction.rows[0]),
        bid: mapBid(bidResult.rows[0]),
      };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  },

  async closeExpiredAuctions() {
    await pool.query(
      `update auctions
       set status = 'closed', updated_at = now()
       where status in ('scheduled', 'live') and ends_at <= now()`,
    );
  },
};

