export function Stars({ value, className = "" }: { value: number; className?: string }) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className={`inline-flex items-center gap-0.5 text-[#9a5d19] ${className}`} role="img" aria-label={`Rated ${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} aria-hidden="true" className={i <= rounded ? "" : "opacity-25"}>
          ★
        </span>
      ))}
    </span>
  );
}
