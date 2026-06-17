import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { auctionsRouter } from "./features/auctions/auctions.routes.js";
import { errorHandler } from "./shared/error-handler.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

app.use(
  cors({
    origin: frontendOrigin,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "mirai-auction-backend" });
});

app.use("/api/auctions", auctionsRouter);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Mirai Auction API listening on http://localhost:${port}`);
});

