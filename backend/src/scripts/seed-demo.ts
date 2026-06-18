import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const demo = {
  companies: [
    { id: "11111111-1111-4111-8111-111111111111", name: "ABC Electronics", legalName: "ABC Electronics Pvt Ltd" },
    { id: "22222222-2222-4222-8222-222222222222", name: "XYZ EMS", legalName: "XYZ EMS Solutions LLC" },
    { id: "33333333-3333-4333-8333-333333333333", name: "NexSemi", legalName: "NexSemi Technologies Inc" },
    { id: "44444444-4444-4444-8444-444444444444", name: "MicroCore", legalName: "MicroCore Components Ltd" },
  ],
  users: [
    {
      id: "51111111-1111-4111-8111-111111111111",
      companyId: "11111111-1111-4111-8111-111111111111",
      fullName: "Aditi Sharma",
      email: "a.sharma@abc-electronics.example",
      role: "admin",
    },
    {
      id: "52222222-2222-4222-8222-222222222222",
      companyId: "22222222-2222-4222-8222-222222222222",
      fullName: "Maya Chen",
      email: "m.chen@xyz-ems.example",
      role: "buyer",
    },
    {
      id: "53333333-3333-4333-8333-333333333333",
      companyId: "33333333-3333-4333-8333-333333333333",
      fullName: "Rahul Iyer",
      email: "r.iyer@nexsemi.example",
      role: "member",
    },
    {
      id: "54444444-4444-4444-8444-444444444444",
      companyId: "44444444-4444-4444-8444-444444444444",
      fullName: "Daniel Brooks",
      email: "d.brooks@microcore.example",
      role: "member",
    },
  ],
  inventory: [
    {
      id: "61111111-1111-4111-8111-111111111111",
      companyId: "11111111-1111-4111-8111-111111111111",
      sku: "STM32F407VGT6-2234",
      partNumber: "STM32F407VGT6",
      manufacturer: "STMicroelectronics",
      title: "STMicroelectronics STM32F407VGT6",
      description: "Condition: New surplus; Date Code: 2234; Location: Austin, TX",
      dateCode: "2234",
      quantity: 480,
      unitCondition: "New surplus",
      location: "Austin, TX",
    },
    {
      id: "62222222-2222-4222-8222-222222222222",
      companyId: "22222222-2222-4222-8222-222222222222",
      sku: "ATMEGA328P-2318",
      partNumber: "ATMEGA328P",
      manufacturer: "Microchip",
      title: "Microchip ATMEGA328P",
      description: "Condition: Tested pull; Date Code: 2318; Location: Guadalajara, MX",
      dateCode: "2318",
      quantity: 1200,
      unitCondition: "Tested pull",
      location: "Guadalajara, MX",
    },
    {
      id: "63333333-3333-4333-8333-333333333333",
      companyId: "33333333-3333-4333-8333-333333333333",
      sku: "ESP32-WROOM-2410",
      partNumber: "ESP32-WROOM",
      manufacturer: "Espressif",
      title: "Espressif ESP32-WROOM",
      description: "Condition: Surplus reel; Date Code: 2410; Location: Bengaluru, IN",
      dateCode: "2410",
      quantity: 640,
      unitCondition: "Surplus reel",
      location: "Bengaluru, IN",
    },
    {
      id: "64444444-4444-4444-8444-444444444444",
      companyId: "44444444-4444-4444-8444-444444444444",
      sku: "TPS5430-2307",
      partNumber: "TPS5430",
      manufacturer: "Texas Instruments",
      title: "Texas Instruments TPS5430",
      description: "Condition: OEM excess; Date Code: 2307; Location: Penang, MY",
      dateCode: "2307",
      quantity: 900,
      unitCondition: "OEM excess",
      location: "Penang, MY",
    },
  ],
};

const now = new Date();
const hoursFromNow = (hours: number) => new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

const auctions = [
  {
    id: "71111111-1111-4111-8111-111111111111",
    inventoryId: "61111111-1111-4111-8111-111111111111",
    createdByUserId: "51111111-1111-4111-8111-111111111111",
    title: "STMicroelectronics STM32F407VGT6",
    partNumber: "STM32F407VGT6",
    manufacturer: "STMicroelectronics",
    quantity: 480,
    startingPrice: "6.50",
    reservePrice: "8.75",
    startTime: hoursAgo(4),
    endTime: hoursFromNow(36),
    status: "live",
  },
  {
    id: "72222222-2222-4222-8222-222222222222",
    inventoryId: "62222222-2222-4222-8222-222222222222",
    createdByUserId: "52222222-2222-4222-8222-222222222222",
    title: "Microchip ATMEGA328P",
    partNumber: "ATMEGA328P",
    manufacturer: "Microchip",
    quantity: 1200,
    startingPrice: "1.25",
    reservePrice: "1.75",
    startTime: hoursAgo(2),
    endTime: hoursFromNow(24),
    status: "live",
  },
  {
    id: "73333333-3333-4333-8333-333333333333",
    inventoryId: "63333333-3333-4333-8333-333333333333",
    createdByUserId: "53333333-3333-4333-8333-333333333333",
    title: "Espressif ESP32-WROOM",
    partNumber: "ESP32-WROOM",
    manufacturer: "Espressif",
    quantity: 640,
    startingPrice: "2.80",
    reservePrice: "4.50",
    startTime: hoursAgo(96),
    endTime: hoursAgo(12),
    status: "sold",
  },
  {
    id: "74444444-4444-4444-8444-444444444444",
    inventoryId: "64444444-4444-4444-8444-444444444444",
    createdByUserId: "54444444-4444-4444-8444-444444444444",
    title: "Texas Instruments TPS5430",
    partNumber: "TPS5430",
    manufacturer: "Texas Instruments",
    quantity: 900,
    startingPrice: "0.95",
    reservePrice: "1.35",
    startTime: hoursAgo(72),
    endTime: hoursAgo(6),
    status: "sold",
  },
];

const bids = [
  { id: "81111111-1111-4111-8111-111111111111", auctionId: "71111111-1111-4111-8111-111111111111", bidderCompanyId: "22222222-2222-4222-8222-222222222222", amount: "6.90", timestamp: hoursAgo(3) },
  { id: "81111111-1111-4111-8111-111111111112", auctionId: "71111111-1111-4111-8111-111111111111", bidderCompanyId: "33333333-3333-4333-8333-333333333333", amount: "7.45", timestamp: hoursAgo(2) },
  { id: "81111111-1111-4111-8111-111111111113", auctionId: "71111111-1111-4111-8111-111111111111", bidderCompanyId: "44444444-4444-4444-8444-444444444444", amount: "8.10", timestamp: hoursAgo(1) },
  { id: "82222222-2222-4222-8222-222222222221", auctionId: "72222222-2222-4222-8222-222222222222", bidderCompanyId: "11111111-1111-4111-8111-111111111111", amount: "1.30", timestamp: hoursAgo(1) },
  { id: "82222222-2222-4222-8222-222222222222", auctionId: "72222222-2222-4222-8222-222222222222", bidderCompanyId: "33333333-3333-4333-8333-333333333333", amount: "1.55", timestamp: hoursAgo(30) },
  { id: "83333333-3333-4333-8333-333333333331", auctionId: "73333333-3333-4333-8333-333333333333", bidderCompanyId: "11111111-1111-4111-8111-111111111111", amount: "3.05", timestamp: hoursAgo(90) },
  { id: "83333333-3333-4333-8333-333333333332", auctionId: "73333333-3333-4333-8333-333333333333", bidderCompanyId: "22222222-2222-4222-8222-222222222222", amount: "3.80", timestamp: hoursAgo(48) },
  { id: "83333333-3333-4333-8333-333333333333", auctionId: "73333333-3333-4333-8333-333333333333", bidderCompanyId: "44444444-4444-4444-8444-444444444444", amount: "4.65", timestamp: hoursAgo(20) },
  { id: "83333333-3333-4333-8333-333333333334", auctionId: "73333333-3333-4333-8333-333333333333", bidderCompanyId: "22222222-2222-4222-8222-222222222222", amount: "5.15", timestamp: hoursAgo(14) },
  { id: "84444444-4444-4444-8444-444444444441", auctionId: "74444444-4444-4444-8444-444444444444", bidderCompanyId: "11111111-1111-4111-8111-111111111111", amount: "1.05", timestamp: hoursAgo(60) },
  { id: "84444444-4444-4444-8444-444444444442", auctionId: "74444444-4444-4444-8444-444444444444", bidderCompanyId: "22222222-2222-4222-8222-222222222222", amount: "1.20", timestamp: hoursAgo(24) },
  { id: "84444444-4444-4444-8444-444444444443", auctionId: "74444444-4444-4444-8444-444444444444", bidderCompanyId: "33333333-3333-4333-8333-333333333333", amount: "1.55", timestamp: hoursAgo(8) },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("truncate table bids, auctions, inventory, users, companies restart identity cascade");

    for (const company of demo.companies) {
      await client.query(
        `insert into companies (id, name, legal_name)
         values ($1, $2, $3)`,
        [company.id, company.name, company.legalName],
      );
    }

    for (const user of demo.users) {
      await client.query(
        `insert into users (id, company_id, full_name, email, role)
         values ($1, $2, $3, $4, $5)`,
        [user.id, user.companyId, user.fullName, user.email, user.role],
      );
    }

    for (const item of demo.inventory) {
      await client.query(
        `insert into inventory (
           id, company_id, sku, part_number, manufacturer, title,
           description, date_code, quantity, unit_condition, location
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          item.id,
          item.companyId,
          item.sku,
          item.partNumber,
          item.manufacturer,
          item.title,
          item.description,
          item.dateCode,
          item.quantity,
          item.unitCondition,
          item.location,
        ],
      );
    }

    for (const auction of auctions) {
      await client.query(
        `insert into auctions (
           id, inventory_id, created_by_user_id, title, part_number,
           manufacturer, quantity, starting_price, reserve_price,
           start_time, end_time, status
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          auction.id,
          auction.inventoryId,
          auction.createdByUserId,
          auction.title,
          auction.partNumber,
          auction.manufacturer,
          auction.quantity,
          auction.startingPrice,
          auction.reservePrice,
          auction.startTime,
          auction.endTime,
          auction.status,
        ],
      );
    }

    for (const bid of bids) {
      await client.query(
        `insert into bids (id, auction_id, bidder_company_id, amount, timestamp)
         values ($1, $2, $3, $4, $5)`,
        [bid.id, bid.auctionId, bid.bidderCompanyId, bid.amount, bid.timestamp],
      );
    }

    await client.query("commit");
    console.log("Demo seed applied: companies, users, inventory, auctions, and bids");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
