import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/queries";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = ["", "/shop", "/hand-painted", "/printed-canvas", "/custom-artwork"].map(
    (path) => ({ url: `${BASE_URL}${path}` })
  );

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    productRoutes = products
      .filter((p) => Boolean(p.slug))
      .map((p) => ({
        url: `${BASE_URL}/products/${p.slug}`,
        lastModified: p.updatedAt || undefined,
      }));
  } catch {
    productRoutes = [];
  }

  return [...staticRoutes, ...productRoutes];
}
