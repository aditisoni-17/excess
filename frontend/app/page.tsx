import { AuctionsDashboard } from "../features/auctions/components/auctions-dashboard";
import { AuctionShell } from "../features/auctions/components/auction-shell";

export default function Page() {
  return (
    <AuctionShell>
      <AuctionsDashboard />
    </AuctionShell>
  );
}

