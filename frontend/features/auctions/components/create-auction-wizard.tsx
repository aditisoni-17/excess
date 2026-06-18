"use client";

import { AxiosError } from "axios";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createAuction, fetchInventory, publishAuction } from "../api";
import type { InventoryItem } from "../types";

type DurationKey = "24" | "48" | "72" | "168";
type Step = 1 | 2 | 3 | 4;

const durationOptions: Array<{ key: DurationKey; label: string; hours: number }> = [
  { key: "24", label: "24 Hours", hours: 24 },
  { key: "48", label: "48 Hours", hours: 48 },
  { key: "72", label: "72 Hours", hours: 72 },
  { key: "168", label: "7 Days", hours: 168 },
];

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function addHours(base: Date, hours: number) {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

export function CreateAuctionWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [startingPrice, setStartingPrice] = useState("100");
  const [reservePrice, setReservePrice] = useState("");
  const [durationKey, setDurationKey] = useState<DurationKey>("24");
  const [publishing, setPublishing] = useState(false);
  const [publishedAuctionId, setPublishedAuctionId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchInventory()
      .then((items) => {
        if (!active) return;
        setInventory(items);
        const fromQuery = searchParams.get("inventoryId");
        if (fromQuery && items.some((item) => item.id === fromQuery)) {
          setSelectedInventoryId(fromQuery);
        } else {
          setSelectedInventoryId(items[0]?.id ?? "");
        }
      })
      .catch(() => setMessage("Failed to load inventory"))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [searchParams]);

  const selectedInventory = useMemo(
    () => inventory.find((item) => item.id === selectedInventoryId) ?? null,
    [inventory, selectedInventoryId],
  );

  const duration = durationOptions.find((option) => option.key === durationKey) ?? durationOptions[0];
  const startTime = new Date();
  const endTime = addHours(startTime, duration.hours);

  const review = selectedInventory
    ? {
        inventory: selectedInventory,
        startingPrice: Number(startingPrice || 0),
        reservePrice: reservePrice ? Number(reservePrice) : null,
        duration: duration.label,
        startTime: toLocalInputValue(startTime),
        endTime: toLocalInputValue(endTime),
      }
    : null;

  async function handlePublish() {
    if (!selectedInventory || !review) return;
    setPublishing(true);
    setMessage(null);
    try {
      const draft = await createAuction({
        inventoryId: selectedInventory.id,
        startTime: new Date(review.startTime).toISOString(),
        endTime: new Date(review.endTime).toISOString(),
        startingPrice: review.startingPrice,
        reservePrice: review.reservePrice ?? undefined,
      });
      const published = await publishAuction(draft.id);
      setPublishedAuctionId(published.id);
      setStep(4);
      setMessage("Auction published successfully");
    } catch (error) {
      setMessage(getErrorMessage(error, "Failed to publish auction"));
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-8 text-slate-600">Loading inventory...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Create Auction</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Turn selected inventory into a published auction.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Follow the guided wizard, review the final auction package, and publish directly from the last step.
              </p>
            </div>
            <Link
              href="/inventory"
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
            >
              Back to Inventory
            </Link>
          </div>
        </section>

        {message ? <Notice message={message} /> : null}

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
            <Stepper currentStep={step} />

            {step === 1 ? (
              <InventoryStep
                inventory={inventory}
                selectedInventoryId={selectedInventoryId}
                onSelect={setSelectedInventoryId}
                onNext={() => setStep(2)}
              />
            ) : null}

            {step === 2 ? (
              <DetailsStep
                startingPrice={startingPrice}
                reservePrice={reservePrice}
                durationKey={durationKey}
                onStartingPriceChange={setStartingPrice}
                onReservePriceChange={setReservePrice}
                onDurationChange={setDurationKey}
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            ) : null}

            {step === 3 ? (
              <ReviewStep
                inventory={selectedInventory}
                startingPrice={startingPrice}
                reservePrice={reservePrice}
                duration={duration}
                onBack={() => setStep(2)}
                onPublish={handlePublish}
                publishing={publishing}
              />
            ) : null}

            {step === 4 ? (
              <PublishStep
                inventory={selectedInventory}
                publishedAuctionId={publishedAuctionId}
                onRestart={() => {
                  setStep(1);
                  setPublishedAuctionId(null);
                  setReservePrice("");
                  setStartingPrice("100");
                  setDurationKey("24");
                }}
              />
            ) : null}
          </div>

          <div className="space-y-6">
            <InventorySummaryCard inventory={selectedInventory} />
            <WizardHints />
          </div>
        </section>
      </div>
    </div>
  );
}

function Stepper({ currentStep }: { currentStep: Step }) {
  const steps = ["Select Inventory", "Auction Details", "Review", "Publish"];
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      {steps.map((label, index) => {
        const stepNumber = (index + 1) as Step;
        const active = currentStep === stepNumber;
        const complete = currentStep > stepNumber;
        return (
          <div
            key={label}
            className={`rounded-2xl border p-4 text-sm font-medium ${
              active
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : complete
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            <div className="mb-2 text-xs uppercase tracking-[0.2em]">Step {stepNumber}</div>
            {label}
          </div>
        );
      })}
    </div>
  );
}

function InventoryStep({
  inventory,
  selectedInventoryId,
  onSelect,
  onNext,
}: {
  inventory: InventoryItem[];
  selectedInventoryId: string;
  onSelect: (id: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">Step 1. Select Inventory</h2>
        <p className="mt-2 text-sm text-slate-600">Choose the lot that will move into the auction workflow.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {inventory.map((item) => {
          const active = item.id === selectedInventoryId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                active ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-base font-semibold text-slate-950">{item.partNumber}</div>
                  <div className="mt-1 text-sm text-slate-500">{item.manufacturer}</div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  Qty {item.quantity}
                </span>
              </div>
              <div className="mt-4 grid gap-1 text-sm text-slate-600">
                <span>Condition: {item.unitCondition}</span>
                <span>Date Code: {item.dateCode}</span>
                <span>Location: {item.location}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedInventoryId}
          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function DetailsStep({
  startingPrice,
  reservePrice,
  durationKey,
  onStartingPriceChange,
  onReservePriceChange,
  onDurationChange,
  onBack,
  onNext,
}: {
  startingPrice: string;
  reservePrice: string;
  durationKey: DurationKey;
  onStartingPriceChange: (value: string) => void;
  onReservePriceChange: (value: string) => void;
  onDurationChange: (value: DurationKey) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">Step 2. Auction Details</h2>
        <p className="mt-2 text-sm text-slate-600">Set the auction economics and duration.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Starting Price" value={startingPrice} onChange={onStartingPriceChange} type="number" />
        <Field label="Reserve Price" value={reservePrice} onChange={onReservePriceChange} type="number" />
      </div>

      <div>
        <div className="mb-3 text-sm font-medium text-slate-700">Duration</div>
        <div className="grid gap-3 md:grid-cols-2">
          {durationOptions.map((option) => {
            const active = durationKey === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onDurationChange(option.key)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="text-sm font-semibold">{option.label}</div>
                <div className="mt-1 text-sm text-slate-500">{option.hours} hours from publish time</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Review
        </button>
      </div>
    </div>
  );
}

function ReviewStep({
  inventory,
  startingPrice,
  reservePrice,
  duration,
  onBack,
  onPublish,
  publishing,
}: {
  inventory: InventoryItem | null;
  startingPrice: string;
  reservePrice: string;
  duration: { label: string; hours: number };
  onBack: () => void;
  onPublish: () => void;
  publishing: boolean;
}) {
  const base = new Date();
  const end = addHours(base, duration.hours);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">Step 3. Review</h2>
        <p className="mt-2 text-sm text-slate-600">Confirm the inventory and auction details before publishing.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SummaryTile label="Inventory" value={inventory?.partNumber ?? "No inventory selected"} />
        <SummaryTile label="Manufacturer" value={inventory?.manufacturer ?? "—"} />
        <SummaryTile label="Starting Price" value={`USD ${Number(startingPrice || 0).toFixed(2)}`} />
        <SummaryTile label="Reserve Price" value={reservePrice ? `USD ${Number(reservePrice).toFixed(2)}` : "None"} />
        <SummaryTile label="Duration" value={duration.label} />
        <SummaryTile label="Ends At" value={toLocalInputValue(end)} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700">Inventory summary card</p>
        <p className="mt-2 text-sm text-slate-600">
          {inventory?.partNumber ?? "—"} · {inventory?.manufacturer ?? "—"} · Qty {inventory?.quantity ?? 0}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Condition: {inventory?.unitCondition ?? "—"} · Date Code: {inventory?.dateCode ?? "—"} · Location: {inventory?.location ?? "—"}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={publishing || !inventory}
          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {publishing ? "Publishing..." : "Publish"}
        </button>
      </div>
    </div>
  );
}

function PublishStep({
  inventory,
  publishedAuctionId,
  onRestart,
}: {
  inventory: InventoryItem | null;
  publishedAuctionId: string | null;
  onRestart: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">Step 4. Publish</h2>
        <p className="mt-2 text-sm text-slate-600">Your auction is live and ready for bidding.</p>
      </div>

      <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        <p className="font-semibold">Auction published successfully</p>
        <p className="mt-2 text-sm">
          {inventory?.partNumber ?? "Selected inventory"} is now available as a live auction.
        </p>
        {publishedAuctionId ? <p className="mt-2 text-xs text-emerald-700">Auction ID: {publishedAuctionId}</p> : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
        <button
          type="button"
          onClick={onRestart}
          className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Create Another Auction
        </button>
      </div>
    </div>
  );
}

function InventorySummaryCard({ inventory }: { inventory: InventoryItem | null }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Inventory Summary</p>
      {inventory ? (
        <div className="mt-4 space-y-4">
          <div>
            <div className="text-xl font-semibold text-slate-950">{inventory.partNumber}</div>
            <p className="mt-1 text-sm text-slate-500">{inventory.manufacturer}</p>
          </div>
          <div className="grid gap-3 text-sm text-slate-600">
            <SummaryRow label="Quantity" value={String(inventory.quantity)} />
            <SummaryRow label="Condition" value={inventory.unitCondition} />
            <SummaryRow label="Date Code" value={inventory.dateCode} />
            <SummaryRow label="Location" value={inventory.location} />
            <SummaryRow label="SKU" value={inventory.sku} />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Select an inventory item to preview the summary card.</p>
      )}
    </div>
  );
}

function WizardHints() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Workflow Notes</p>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
        <li>• Duration is calculated from the moment you publish the auction.</li>
        <li>• The wizard creates a draft first and then publishes it in the final step.</li>
        <li>• Inventory summary stays visible while you move through the steps.</li>
      </ul>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-950">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  type?: "text" | "number" | "datetime-local";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function Notice({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
      {message}
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    return (typeof error.response?.data?.error?.message === "string" && error.response.data.error.message) || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
