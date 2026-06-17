# Mirai Auction Module

Standalone auction module for a B2B electronics marketplace.

## Structure

- `frontend/` Next.js 16 App Router UI
- `backend/` Node.js + Express API
- `backend/db/schema.sql` Supabase PostgreSQL schema
- `backend/src/shared/database.interfaces.ts` TypeScript interfaces for the data model

## Run

1. Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL`.
2. Copy `frontend/.env.example` to `frontend/.env.local` and set `NEXT_PUBLIC_API_BASE_URL` if needed.
3. Run `npm install` inside both `backend/` and `frontend/`.
4. Apply `backend/db/schema.sql` to your Supabase PostgreSQL database.
5. Start the backend from `backend/` with `npm run dev`.
6. Start the frontend from `frontend/` with `npm run dev`.

## Core Features

- Create auctions
- List and view auctions
- Place bids
- Track auction status
- Determine winners after auction close

## Excluded by Design

- AI
- Notifications
- Payments
- Chat
- Analytics
- WebSockets
- External integrations
