import { StatusPageBase } from "../StatusPageBase";

export const dynamic = "force-dynamic";

export default function ArchivedPage() {
  return <StatusPageBase filter="archived" title="Archived Artworks" subtitle="Hidden from the store, kept for order history." />;
}

