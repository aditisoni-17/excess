"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { createAuction, fetchAuction, fetchAuctions, placeBid } from "../api";
import type { Auction } from "../types";

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function createInitialForm() {
  return {
    title: "",
    description: "",
    category: "",
    sellerName: "",
    startingPrice: "100",
    reservePrice: "",
    bidIncrement: "10",
    currency: "USD",
    startsAt: toLocalInputValue(new Date()),
    endsAt: toLocalInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  };
}

const initialForm = createInitialForm();

export function AuctionsDashboard() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [bidAmount, setBidAmount] = useState("0");
  const selectedAuction = auctions.find((auction) => auction.id === selectedAuctionId) ?? null;

  useEffect(() => {
    let active = true;
    fetchAuctions()
      .then((data) => {
        if (!active) return;
        setAuctions(data);
        setSelectedAuctionId(data[0]?.id ?? null);
      })
      .catch(() => setMessage("Failed to load auctions"))
      .finally(() => setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (selectedAuction) {
      setBidAmount(String(selectedAuction.currentPrice + selectedAuction.bidIncrement));
    }
  }, [selectedAuction]);

  useEffect(() => {
    if (!selectedAuctionId) {
      return;
    }

    let active = true;
    fetchAuction(selectedAuctionId)
      .then((auction) => {
        if (!active) return;
        setAuctions((current) =>
          current.map((item) => (item.id === auction.id ? auction : item)),
        );
      })
      .catch(() => {
        if (active) setMessage("Failed to load auction details");
      });

    return () => {
      active = false;
    };
  }, [selectedAuctionId]);

  async function handleCreateAuction(formData: typeof initialForm) {
    setMessage(null);
    try {
      const auction = await createAuction({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        sellerName: formData.sellerName,
        startingPrice: Number(formData.startingPrice),
        reservePrice: formData.reservePrice ? Number(formData.reservePrice) : undefined,
        bidIncrement: Number(formData.bidIncrement),
        currency: formData.currency,
        startsAt: new Date(formData.startsAt).toISOString(),
        endsAt: new Date(formData.endsAt).toISOString(),
      });
      setAuctions((current) => [auction, ...current]);
      setSelectedAuctionId(auction.id);
      setForm(createInitialForm());
      setMessage("Auction created");
    } catch (error) {
      setMessage(getErrorMessage(error, "Failed to create auction"));
    }
  }

  async function handleBidSubmit() {
    if (!selectedAuction) return;
    setMessage(null);
    try {
      const response = await placeBid(selectedAuction.id, {
        bidderName: "Procurement Team",
        bidderCompany: "Mirai Buyer",
        amount: Number(bidAmount),
      });
      setAuctions((current) =>
        current.map((auction) =>
          auction.id === response.auction.id
            ? {
                ...response.auction,
                bids: [...(auction.bids ?? []), response.bid].sort((left, right) => right.amount - left.amount),
              }
            : auction,
        ),
      );
      setMessage("Bid placed");
    } catch (error) {
      setMessage(getErrorMessage(error, "Failed to place bid"));
    }
  }

  if (loading) {
    return <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">Loading auctions...</div>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <Panel title="Auction Board" subtitle="Live inventory and bidding status">
          <div className="grid gap-4 md:grid-cols-2">
            <AnimatePresence>
              {auctions.map((auction) => (
                <motion.button
                  key={auction.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  onClick={() => setSelectedAuctionId(auction.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    auction.id === selectedAuctionId
                      ? "border-sky-400/60 bg-sky-400/10"
                      : "border-white/10 bg-white/5 hover:bg-white/8"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">{auction.title}</h3>
                    <StatusPill status={auction.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{auction.category || "Uncategorized"}</p>
                  <p className="mt-3 text-sm text-slate-200">
                    Current: {auction.currency} {auction.currentPrice.toFixed(2)}
                  </p>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
          {auctions.length === 0 ? <EmptyState /> : null}
        </Panel>

        <Panel title="Create Auction" subtitle="Standalone creation flow for new inventory lots">
          <AuctionForm value={form} onChange={setForm} onSubmit={handleCreateAuction} />
        </Panel>
      </section>

      <section className="space-y-6">
        <Panel title="Auction Details" subtitle="Selected lot and bid controls">
          {selectedAuction ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-semibold">{selectedAuction.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{selectedAuction.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Metric label="Seller" value={selectedAuction.sellerName} />
                <Metric label="Status" value={selectedAuction.status} />
                <Metric label="Start" value={selectedAuction.currency + " " + selectedAuction.startingPrice.toFixed(2)} />
                <Metric label="Current" value={selectedAuction.currency + " " + selectedAuction.currentPrice.toFixed(2)} />
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <label className="text-sm text-slate-300">Place bid</label>
                <div className="mt-3 flex gap-3">
                  <input
                    value={bidAmount}
                    onChange={(event) => setBidAmount(event.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                  />
                  <button
                    onClick={handleBidSubmit}
                    className="rounded-xl bg-sky-500 px-5 py-3 font-medium text-white transition hover:bg-sky-400"
                  >
                    Bid
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-sm uppercase tracking-[0.2em] text-slate-400">Bid History</h3>
                <div className="mt-3 space-y-2">
                  {selectedAuction.bids?.length ? (
                    selectedAuction.bids.map((bid) => (
                      <div key={bid.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium">{bid.bidderName}</p>
                          <p className="text-slate-400">{bid.bidderCompany}</p>
                        </div>
                        <p className="font-semibold text-sky-300">
                          {selectedAuction.currency} {bid.amount.toFixed(2)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No bids yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </Panel>
        {message ? <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">{message}</div> : null}
      </section>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[var(--panel)] p-5 shadow-xl shadow-black/20 backdrop-blur">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: Auction["status"] }) {
  const tone =
    status === "live"
      ? "bg-emerald-400/15 text-emerald-300"
      : status === "closed"
        ? "bg-rose-400/15 text-rose-300"
        : "bg-slate-400/15 text-slate-300";
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>{status}</span>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 font-medium text-white">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">
      No auctions available yet.
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    return (
      (typeof error.response?.data?.error === "string" && error.response.data.error) ||
      error.message ||
      fallback
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

function AuctionForm({
  value,
  onChange,
  onSubmit,
}: {
  value: typeof initialForm;
  onChange: (next: typeof initialForm) => void;
  onSubmit: (value: typeof initialForm) => void;
}) {
  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
    >
      <Field label="Title" value={value.title} onChange={(next) => onChange({ ...value, title: next })} />
      <Field label="Category" value={value.category} onChange={(next) => onChange({ ...value, category: next })} />
      <Field label="Seller" value={value.sellerName} onChange={(next) => onChange({ ...value, sellerName: next })} />
      <label className="md:col-span-2">
        <span className="mb-2 block text-sm text-slate-300">Description</span>
        <textarea
          value={value.description}
          onChange={(event) => onChange({ ...value, description: event.target.value })}
          rows={5}
          className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
        />
      </label>
      <Field
        label="Starting Price"
        value={value.startingPrice}
        type="number"
        inputMode="decimal"
        step="0.01"
        onChange={(next) => onChange({ ...value, startingPrice: next })}
      />
      <Field
        label="Reserve Price"
        value={value.reservePrice}
        type="number"
        inputMode="decimal"
        step="0.01"
        onChange={(next) => onChange({ ...value, reservePrice: next })}
      />
      <Field
        label="Bid Increment"
        value={value.bidIncrement}
        type="number"
        inputMode="decimal"
        step="0.01"
        onChange={(next) => onChange({ ...value, bidIncrement: next })}
      />
      <Field label="Currency" value={value.currency} onChange={(next) => onChange({ ...value, currency: next })} />
      <Field
        label="Starts At"
        value={value.startsAt}
        type="datetime-local"
        onChange={(next) => onChange({ ...value, startsAt: next })}
      />
      <Field
        label="Ends At"
        value={value.endsAt}
        type="datetime-local"
        onChange={(next) => onChange({ ...value, endsAt: next })}
      />
      <button className="md:col-span-2 rounded-xl bg-white px-5 py-3 font-medium text-slate-950 transition hover:bg-sky-200">
        Create Auction
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  type?: "text" | "number" | "datetime-local";
  step?: string;
  inputMode?: "text" | "decimal" | "numeric";
}) {
  return (
    <label>
      <span className="mb-2 block text-sm text-slate-300">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        inputMode={inputMode}
        step={step}
        className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
      />
    </label>
  );
}
