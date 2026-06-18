"use client";

import { useEffect, useState } from "react";
import { fetchAuctions, fetchInventory } from "../../auctions/api";
import type { Auction, InventoryItem } from "../../auctions/types";

type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
};

const navigation = ["Dashboard", "Inventory", "Auctions", "Results"] as const;

export function SellerDashboard() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([fetchAuctions(), fetchInventory()])
      .then(([auctionList, inventoryList]) => {
        if (!active) return;
        setAuctions(auctionList);
        setInventory(inventoryList);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const activeAuctions = auctions.filter((auction) => auction.status === "live").length;
  const totalInventoryUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const recoveredRevenue = auctions
    .filter((auction) => auction.status === "ended" || auction.status === "sold")
    .reduce((sum, auction) => sum + (auction.highestBid ?? auction.currentPrice ?? auction.startingPrice), 0);

  const metrics: DashboardMetric[] = [
    {
      label: "Active Auctions",
      value: String(activeAuctions),
      detail: "Currently live and accepting bids",
    },
    {
      label: "Total Inventory",
      value: formatNumber(totalInventoryUnits),
      detail: `${inventory.length} inventory SKUs tracked`,
    },
    {
      label: "Revenue Recovered",
      value: formatCurrency(recoveredRevenue),
      detail: "Closed and sold auction value",
    },
  ];

  const recentAuctions = [...auctions]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white px-6 py-8 lg:flex lg:flex-col">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">Mirai</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Seller Dashboard</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage inventory, auctions, and recovered value from one clean control center.
            </p>
          </div>

          <nav className="space-y-2">
            {navigation.map((item, index) => (
              <button
                key={item}
                type="button"
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                  index === 0
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{item}</span>
                {index === 0 ? <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> : null}
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900">Enterprise Operations</p>
            <p className="mt-1 text-sm leading-6 text-blue-800/80">
              Built for purchasing, surplus recovery, and dead-stock liquidation workflows.
            </p>
          </div>
        </aside>

        <main className="flex-1">
          <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">Mirai</p>
                <h1 className="text-lg font-semibold tracking-tight">Seller Dashboard</h1>
              </div>
              <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                Enterprise
              </div>
            </div>
          </div>

          <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">
                    Dashboard
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    Control your inventory and auction pipeline.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                    Track live auctions, identify available stock, and recover value from dead stock with a
                    streamlined seller workflow.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ActionButton
                    title="Upload Inventory"
                    description="Add fresh stock records"
                    tone="secondary"
                  />
                  <ActionButton
                    title="Create Auction"
                    description="Launch a new sale"
                    tone="primary"
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} metric={metric} loading={loading} />
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Quick Actions</h3>
                    <p className="text-sm text-slate-500">Common seller tasks</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <QuickAction
                    title="Upload Inventory"
                    description="Import items to your dead-stock pool"
                  />
                  <QuickAction
                    title="Create Auction"
                    description="Move eligible inventory into a live auction"
                  />
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Recent Auctions</h3>
                    <p className="text-sm text-slate-500">Latest auction activity</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {recentAuctions.length} shown
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          <th className="px-4 py-3">Auction</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Bids</th>
                          <th className="px-4 py-3">Highest Bid</th>
                          <th className="px-4 py-3">Ends</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {recentAuctions.length ? (
                          recentAuctions.map((auction) => (
                            <tr key={auction.id} className="text-sm">
                              <td className="px-4 py-4">
                                <div className="font-medium text-slate-950">{auction.title}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {auction.partNumber ?? "N/A"} · {auction.manufacturer ?? "N/A"}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                                <StatusBadge status={auction.status} />
                              </td>
                              <td className="px-4 py-4 text-slate-600">{auction.bidCount ?? 0}</td>
                              <td className="px-4 py-4 font-medium text-slate-950">
                                {formatCurrency(auction.highestBid ?? auction.currentPrice ?? auction.startingPrice)}
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                {auction.endsAt ? formatDate(auction.endsAt) : "—"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                              No auctions yet. Start by uploading inventory or creating an auction.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function MetricCard({ metric, loading }: { metric: DashboardMetric; loading: boolean }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
      <p className="text-sm font-medium text-slate-500">{metric.label}</p>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {loading ? "—" : metric.value}
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-500">{metric.detail}</p>
    </div>
  );
}

function QuickAction({ title, description }: { title: string; description: string }) {
  return (
    <button
      type="button"
      className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
    >
      <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
        +
      </span>
      <span>
        <span className="block text-sm font-semibold text-slate-950">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-500">{description}</span>
      </span>
    </button>
  );
}

function ActionButton({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: "primary" | "secondary";
}) {
  const styles =
    tone === "primary"
      ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
      : "border-slate-200 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50";

  return (
    <button
      type="button"
      className={`rounded-2xl border px-5 py-4 text-left shadow-sm transition ${styles}`}
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className={`mt-1 block text-xs leading-5 ${tone === "primary" ? "text-blue-100" : "text-slate-500"}`}>
        {description}
      </span>
    </button>
  );
}

function StatusBadge({ status }: { status: Auction["status"] }) {
  const styles =
    status === "live"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : status === "ended" || status === "sold"
        ? "bg-slate-100 text-slate-700 ring-slate-200"
        : "bg-amber-50 text-amber-700 ring-amber-100";

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${styles}`}>{status}</span>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
