import type { Product, ProductStatus } from "@/types";

export function totalStock(product: Pick<Product, "sizes">): number {
  return (product.sizes || []).reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
}

export function minPrice(product: Pick<Product, "sizes">): number {
  const prices = (product.sizes || []).map(s => Number(s.price) || 0);
  return prices.length ? Math.min(...prices) : 0;
}

export function sizeDiscount(price: number, compareAt?: number): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/** Display status with backward compatibility: old docs without `status` fall back to `active`. */
export function displayStatus(product: Pick<Product, "status" | "active" | "sizes">): ProductStatus | "sold-out" {
  if (product.status === "archived") return "archived";
  if (product.status === "draft" || product.active === false) return "draft";
  if (totalStock(product) <= 0) return "sold-out";
  return "published";
}

export function isVisibleToStorefront(product: Pick<Product, "status" | "active">): boolean {
  if (product.status) return product.status === "published" && product.active !== false;
  return product.active !== false;
}

export function statusLabel(status: string): string {
  switch (status) {
    case "sold-out": return "Sold Out";
    case "draft": return "Draft";
    case "archived": return "Archived";
    default: return "Published";
  }
}
