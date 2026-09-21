export const dynamic = "force-dynamic";

import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { SettingsManager } from "@/components/admin/BusinessManagers";

export const metadata = {
  title: "Store Settings — ArtCanvas Admin",
};

export default async function SettingsPage() {
  await requireAdmin();

  return (
    <AdminShell>
      <SettingsManager />
    </AdminShell>
  );
}
