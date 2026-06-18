import { Suspense } from "react";
import { CreateAuctionWizard } from "../../features/auctions/components/create-auction-wizard";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 p-8 text-slate-600">Loading create auction wizard...</div>
      }
    >
      <CreateAuctionWizard />
    </Suspense>
  );
}
