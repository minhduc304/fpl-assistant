import { Suspense } from "react";
import { PlayersPageClient } from "./players-page-client";

export default function PlayersPage() {
  return (
    <Suspense fallback={null}>
      <PlayersPageClient />
    </Suspense>
  );
}
