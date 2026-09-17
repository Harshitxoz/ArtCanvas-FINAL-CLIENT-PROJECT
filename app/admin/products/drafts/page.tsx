import { StatusPageBase } from "../StatusPageBase";

export const dynamic = "force-dynamic";

export default function DraftsPage() {
  return <StatusPageBase filter="draft" title="Drafts" subtitle="Unpublished artworks. Hidden from the store until published." />;
}

