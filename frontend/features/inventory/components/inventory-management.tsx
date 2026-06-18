"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";
import { createAuction, fetchAuctions } from "../../auctions/api";
import type { Auction } from "../../auctions/types";
import type { InventoryItem } from "../../auctions/types";
import {
  createInventory,
  deleteInventory,
  fetchInventory,
  updateInventory,
  type InventoryPayload,
} from "../api";

type SortKey = "partNumber" | "manufacturer" | "quantity" | "unitCondition" | "dateCode" | "location" | "createdAt";
type ModalMode = "create" | "edit" | null;

type FormState = InventoryPayload;
type AuctionFormState = {
  startTime: string;
  endTime: string;
  startingPrice: string;
  reservePrice: string;
};

const EMPTY_FORM: FormState = {
  partNumber: "",
  manufacturer: "",
  dateCode: "",
  quantity: 0,
  unitCondition: "Unknown",
  location: "",
};

function formatDateTimeLocal(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [auctionItem, setAuctionItem] = useState<InventoryItem | null>(null);
  const [auctionForm, setAuctionForm] = useState<AuctionFormState>({
    startTime: formatDateTimeLocal(new Date()),
    endTime: formatDateTimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    startingPrice: "100",
    reservePrice: "",
  });

  useEffect(() => {
    let active = true;
    Promise.all([fetchInventory(), fetchAuctions()])
      .then(([inventoryList, auctionList]) => {
        if (!active) return;
        setItems(inventoryList);
        setAuctions(auctionList);
      })
      .catch(() => setMessage("Failed to load inventory"))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const auctionedInventoryIds = useMemo(
    () => new Set(auctions.map((auction) => auction.inventoryId).filter(Boolean) as string[]),
    [auctions],
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    const list = items.filter((item) => {
      if (!search) return true;
      return [
        item.partNumber,
        item.manufacturer,
        item.unitCondition,
        item.dateCode,
        item.location,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

    const sorted = [...list].sort((left, right) => {
      const a = left[sortKey];
      const b = right[sortKey];
      const leftValue = typeof a === "number" ? a : String(a ?? "");
      const rightValue = typeof b === "number" ? b : String(b ?? "");
      if (leftValue < rightValue) return sortDirection === "asc" ? -1 : 1;
      if (leftValue > rightValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [items, query, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, sortDirection, sortKey]);

  async function submitInventoryForm() {
    try {
      const payload = {
        partNumber: form.partNumber,
        manufacturer: form.manufacturer,
        dateCode: form.dateCode,
        quantity: Number(form.quantity),
        unitCondition: form.unitCondition,
        location: form.location,
      };
      const saved =
        modalMode === "edit" && activeId
          ? await updateInventory(activeId, payload)
          : await createInventory(payload);

      setItems((current) =>
        modalMode === "edit" && activeId
          ? current.map((item) => (item.id === activeId ? saved : item))
          : [saved, ...current],
      );
      setModalMode(null);
      setForm(EMPTY_FORM);
      setActiveId(null);
      setMessage(modalMode === "edit" ? "Inventory updated" : "Inventory added");
    } catch (error) {
      setMessage(getErrorMessage(error, "Inventory action failed"));
    }
  }

  async function handleDelete(item: InventoryItem) {
    const confirmDelete = window.confirm(`Delete inventory ${item.partNumber}?`);
    if (!confirmDelete) return;
    try {
      await deleteInventory(item.id);
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      setMessage("Inventory deleted");
    } catch (error) {
      setMessage(getErrorMessage(error, "Failed to delete inventory"));
    }
  }

  function openCreateModal() {
    setModalMode("create");
    setActiveId(null);
    setForm(EMPTY_FORM);
  }

  function openEditModal(item: InventoryItem) {
    setModalMode("edit");
    setActiveId(item.id);
    setForm({
      partNumber: item.partNumber,
      manufacturer: item.manufacturer,
      dateCode: item.dateCode,
      quantity: item.quantity,
      unitCondition: item.unitCondition,
      location: item.location,
    });
  }

  function openAuctionModal(item: InventoryItem) {
    setAuctionItem(item);
    setAuctionForm({
      startTime: formatDateTimeLocal(new Date()),
      endTime: formatDateTimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      startingPrice: String(Math.max(100, item.quantity * 10)),
      reservePrice: "",
    });
  }

  async function submitAuction() {
    if (!auctionItem) return;
    try {
      const auction = await createAuction({
        inventoryId: auctionItem.id,
        startTime: new Date(auctionForm.startTime).toISOString(),
        endTime: new Date(auctionForm.endTime).toISOString(),
        startingPrice: Number(auctionForm.startingPrice),
        reservePrice: auctionForm.reservePrice ? Number(auctionForm.reservePrice) : undefined,
      });
      setAuctions((current) => [auction, ...current]);
      setAuctionItem(null);
      setMessage("Auction created from inventory");
    } catch (error) {
      setMessage(getErrorMessage(error, "Failed to create auction"));
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-8 text-slate-600">Loading inventory...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white px-6 py-8 lg:flex lg:flex-col">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">Mirai</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Inventory</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add, edit, and publish dead-stock inventory from one enterprise workspace.
            </p>
          </div>

          <nav className="space-y-2">
            <NavLink href="/" label="Dashboard" />
            <NavLink href="/inventory" label="Inventory" active />
            <NavLink href="/" label="Auctions" />
            <NavLink href="/" label="Results" />
          </nav>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Inventory Management</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Manage stock before it becomes an auction.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Search, sort, paginate, edit, and remove inventory records. Launch a quick auction from any row when the lot is ready.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateModal}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Add Inventory
              </button>
            </div>
          </section>

          {message ? <Alert message={message} onClose={() => setMessage(null)} /> : null}

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <Stat label="Inventory Items" value={String(items.length)} />
            <Stat label="Total Quantity" value={String(items.reduce((sum, item) => sum + item.quantity, 0))} />
            <Stat label="Auctioned Lots" value={String(auctionedInventoryIds.size)} />
          </section>

          <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Inventory Table</h3>
                <p className="text-sm text-slate-500">Search, sort, and paginate your stock list.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search inventory..."
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-blue-300"
                />
                <select
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value as SortKey)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-300"
                >
                  <option value="createdAt">Newest</option>
                  <option value="partNumber">Part Number</option>
                  <option value="manufacturer">Manufacturer</option>
                  <option value="quantity">Quantity</option>
                  <option value="unitCondition">Condition</option>
                  <option value="dateCode">Date Code</option>
                  <option value="location">Location</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  {sortDirection === "asc" ? "Ascending" : "Descending"}
                </button>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <th className="px-4 py-3">Part Number</th>
                      <th className="px-4 py-3">Manufacturer</th>
                      <th className="px-4 py-3">Quantity</th>
                      <th className="px-4 py-3">Condition</th>
                      <th className="px-4 py-3">Date Code</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginated.length ? (
                      paginated.map((item) => {
                        const isAuctioned = auctionedInventoryIds.has(item.id);
                        return (
                          <tr key={item.id} className="text-sm">
                            <td className="px-4 py-4 font-medium text-slate-950">{item.partNumber}</td>
                            <td className="px-4 py-4 text-slate-600">{item.manufacturer}</td>
                            <td className="px-4 py-4 text-slate-600">{item.quantity}</td>
                            <td className="px-4 py-4 text-slate-600">{item.unitCondition}</td>
                            <td className="px-4 py-4 text-slate-600">{item.dateCode}</td>
                            <td className="px-4 py-4 text-slate-600">{item.location}</td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => openAuctionModal(item)}
                                  disabled={isAuctioned}
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                  {isAuctioned ? "Auctioned" : "Create Auction"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(item)}
                                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(item)}
                                  className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                          No inventory found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                Showing {paginated.length ? (safePage - 1) * pageSize + 1 : 0}
                {" - "}
                {(safePage - 1) * pageSize + paginated.length} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={safePage === 1}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={safePage === totalPages}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {modalMode ? (
        <InventoryModal
          title={modalMode === "create" ? "Add Inventory" : "Edit Inventory"}
          onClose={() => setModalMode(null)}
          onSubmit={submitInventoryForm}
        >
          <InventoryForm value={form} onChange={setForm} />
        </InventoryModal>
      ) : null}

      {auctionItem ? (
        <InventoryModal
          title={`Create Auction: ${auctionItem.partNumber}`}
          onClose={() => setAuctionItem(null)}
          onSubmit={submitAuction}
          submitLabel="Create Auction"
        >
          <div className="mb-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            {auctionItem.manufacturer} · Qty {auctionItem.quantity} · {auctionItem.location}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Start Time"
              type="datetime-local"
              value={auctionForm.startTime}
              onChange={(value) => setAuctionForm((current) => ({ ...current, startTime: value }))}
            />
            <Field
              label="End Time"
              type="datetime-local"
              value={auctionForm.endTime}
              onChange={(value) => setAuctionForm((current) => ({ ...current, endTime: value }))}
            />
            <Field
              label="Starting Price"
              type="number"
              value={auctionForm.startingPrice}
              onChange={(value) => setAuctionForm((current) => ({ ...current, startingPrice: value }))}
            />
            <Field
              label="Reserve Price"
              type="number"
              value={auctionForm.reservePrice}
              onChange={(value) => setAuctionForm((current) => ({ ...current, reservePrice: value }))}
            />
          </div>
        </InventoryModal>
      ) : null}
    </div>
  );
}

function InventoryForm({
  value,
  onChange,
}: {
  value: FormState;
  onChange: (next: FormState) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field
        label="Part Number"
        value={value.partNumber}
        onChange={(next) => onChange({ ...value, partNumber: next })}
      />
      <Field
        label="Manufacturer"
        value={value.manufacturer}
        onChange={(next) => onChange({ ...value, manufacturer: next })}
      />
      <Field
        label="Quantity"
        type="number"
        value={String(value.quantity)}
        onChange={(next) => onChange({ ...value, quantity: Number(next) })}
      />
      <Field
        label="Condition"
        value={value.unitCondition}
        onChange={(next) => onChange({ ...value, unitCondition: next })}
      />
      <Field
        label="Date Code"
        value={value.dateCode}
        onChange={(next) => onChange({ ...value, dateCode: next })}
      />
      <Field
        label="Location"
        value={value.location}
        onChange={(next) => onChange({ ...value, location: next })}
      />
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

function InventoryModal({
  title,
  onClose,
  onSubmit,
  children,
  submitLabel = "Save",
}: {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
  submitLabel?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl shadow-slate-950/20">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600"
          >
            Close
          </button>
        </div>
        {children}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function NavLink({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
        active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span>{label}</span>
      {active ? <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> : null}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function Alert({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="mt-6 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
      <span>{message}</span>
      <button type="button" onClick={onClose} className="font-semibold text-blue-700">
        Dismiss
      </button>
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
