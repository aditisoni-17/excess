"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function AuctionShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-8 text-white md:px-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-3xl border border-white/10 bg-[var(--panel)] p-6 shadow-2xl shadow-black/20 backdrop-blur"
        >
          <p className="text-sm uppercase tracking-[0.24em] text-sky-300">Mirai Auction Module</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Core bidding workflows for B2B electronics trading
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
            Independent, embeddable auction experience built for productized resale, surplus inventory, and procurement flows.
          </p>
        </motion.header>
        {children}
      </div>
    </main>
  );
}
