import pg from "pg";
import { ApiError } from "../../shared/error-handler.js";
import type { AuctionRecord, BidRecord, CreateAuctionInput } from "./auctions.types.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const mapAuction = (row: AuctionRecord) => ({
  id: row.id,
  inventoryId: row.inventory_id,
  createdByUserId: row.created_by_user_id,
  title: row.title,
  partNumber: row.part_number,
  manufacturer: row.manufacturer,
  quantity: row.quantity,
  startingPrice: Number(row.starting_price),
  reservePrice: row.reserve_price === null ? null : Number(row.reserve_price),
  startTime: row.start_time,
  endTime: row.end_time,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapBid = (row: BidRecord) => ({
  id: row.id,
  auctionId: row.auction_id,
  bidderCompanyId: row.bidder_company_id,
  amount: Number(row.amount),
  timestamp: row.timestamp,
});

export const auctionsRepository = {
  async create(input: CreateAuctionInput & { title: string; partNumber: string; manufacturer: string; quantity: number }) {
    const result = await pool.query<AuctionRecord>(
      `insert into auctions (
        inventory_id, created_by_user_id, title, part_number, manufacturer,
        quantity, starting_price, reserve_price, start_time, end_time, status
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft')
      returning *`,
      [
        input.inventoryId,
        input.createdByUserId,
        input.title,
        input.partNumber,
        input.manufacturer,
        input.quantity,
        input.startingPrice,
        input.reservePrice,
        input.startTime,
        input.endTime,
      ],
    );
    return mapAuction(result.rows[0]);
  },

  async list() {
    const result = await pool.query<{
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
      status: AuctionRecord["status"];
      created_at: string;
      updated_at: string;
      highest_bid: string | null;
      bid_count: string;
    }>(
      `select
        a.*,
        max(b.amount) as highest_bid,
        count(b.id) as bid_count
      from auctions a
      left join bids b on b.auction_id = a.id
      group by a.id
      order by a.created_at desc`,
    );
    return result.rows.map((row) => ({
      ...mapAuction(row as AuctionRecord),
      highestBid: row.highest_bid === null ? null : Number(row.highest_bid),
      bidCount: Number(row.bid_count),
    }));
  },

  async findById(id: string) {
    const result = await pool.query<AuctionRecord>(
      "select * from auctions where id = $1",
      [id],
    );
    return result.rows[0] ? mapAuction(result.rows[0]) : null;
  },

  async findAuctionForInventory(inventoryId: string) {
    const result = await pool.query(
      `select 1
       from auctions
       where inventory_id = $1
       limit 1`,
      [inventoryId],
    );
    return result.rowCount > 0;
  },

  async findHighestBid(auctionId: string, client = pool) {
    const result = await client.query<{ highest_bid: string | null }>(
      "select max(amount) as highest_bid from bids where auction_id = $1",
      [auctionId],
    );
    return result.rows[0]?.highest_bid === null || result.rows[0]?.highest_bid === undefined
      ? null
      : Number(result.rows[0].highest_bid);
  },

  async getBidsByAuctionId(auctionId: string) {
    const result = await pool.query<BidRecord>(
      "select * from bids where auction_id = $1 order by amount desc, timestamp asc",
      [auctionId],
    );
    return result.rows.map(mapBid);
  },

  async publish(auctionId: string) {
    const result = await pool.query<AuctionRecord>(
      `update auctions
       set status = 'live'
       where id = $1
       returning *`,
      [auctionId],
    );
    return result.rows[0] ? mapAuction(result.rows[0]) : null;
  },

  async placeBid(input: { auctionId: string; bidderCompanyId: string; amount: number }) {
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
      if (auction.status === "ended" || auction.status === "sold") {
        throw new ApiError(400, "Cannot bid on ended auction");
      }
      if (auction.status !== "live") {
        throw new ApiError(400, "Auction is not open for bidding");
      }

      const highestBid = await auctionsRepository.findHighestBid(input.auctionId, client);
      const floor = highestBid ?? auction.startingPrice;
      if (input.amount <= floor) {
        throw new ApiError(400, "Bid must be higher than current highest bid");
      }

      const bidResult = await client.query<BidRecord>(
        `insert into bids (auction_id, bidder_company_id, amount)
         values ($1, $2, $3)
         returning *`,
        [input.auctionId, input.bidderCompanyId, input.amount],
      );

      await client.query("commit");
      return {
        bid: mapBid(bidResult.rows[0]),
        highestBid: input.amount,
      };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  },

  async closeAuction(auctionId: string) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      const auctionResult = await client.query<AuctionRecord>(
        "select * from auctions where id = $1 for update",
        [auctionId],
      );
      const auctionRow = auctionResult.rows[0];
      if (!auctionRow) {
        throw new ApiError(404, "Auction not found");
      }

      const auction = mapAuction(auctionRow);
      if (auction.status === "ended" || auction.status === "sold") {
        await client.query("commit");
        return auction;
      }

      const highestBid = await auctionsRepository.findHighestBid(auctionId, client);
      const shouldSell =
        highestBid !== null &&
        (auction.reservePrice === null || highestBid >= auction.reservePrice);

      const status = shouldSell ? "sold" : "ended";
      const updateResult = await client.query<AuctionRecord>(
        `update auctions
         set status = $2
         where id = $1
         returning *`,
        [auctionId, status],
      );
      await client.query("commit");
      return mapAuction(updateResult.rows[0]);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  },
};
