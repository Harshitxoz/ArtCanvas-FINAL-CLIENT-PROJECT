export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-full border border-[#9a5d19]/20 bg-[#9a5d19]/8 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#7a4913]">{children}</span>;
}
