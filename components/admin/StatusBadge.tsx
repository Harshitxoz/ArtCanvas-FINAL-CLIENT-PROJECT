export function StatusBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    published: "bg-[#1f7a4d]/10 text-[#1f7a4d]",
    draft: "bg-black/5 text-black/60",
    archived: "bg-black/10 text-black/50",
    "sold-out": "bg-red-600/10 text-red-700",
    pending: "bg-black/5 text-black/60",
    paid: "bg-[#9a5d19]/10 text-[#9a5d19]",
    processing: "bg-[#8a6a3b]/10 text-[#8a6a3b]",
    packed: "bg-[#6a5acd]/10 text-[#5a4fcf]",
    shipped: "bg-[#2f6f4f]/10 text-[#2f6f4f]",
    delivered: "bg-[#1f7a4d]/10 text-[#1f7a4d]",
    cancelled: "bg-red-600/10 text-red-700",
    refunded: "bg-orange-600/10 text-orange-700",
    failed: "bg-red-600/10 text-red-700"
  };
  const style = styles[value] || "bg-black/5 text-black/60";
  const label = value.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase());
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${style}`}>{label}</span>;
}
