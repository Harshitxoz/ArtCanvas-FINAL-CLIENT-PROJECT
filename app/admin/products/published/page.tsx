import { StatusPageBase } from "../StatusPageBase";

export const dynamic = "force-dynamic";

export default function PublishedPage() {
  return <StatusPageBase filter="published" title="Published Artworks" subtitle="Live on the store right now." />;
}

