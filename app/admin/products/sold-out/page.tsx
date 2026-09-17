import { StatusPageBase } from "../StatusPageBase";

export const dynamic = "force-dynamic";

export default function SoldOutPage() {
  return <StatusPageBase filter="sold-out" title="Sold Out" subtitle="Artworks whose sizes are all out of stock." />;
}

