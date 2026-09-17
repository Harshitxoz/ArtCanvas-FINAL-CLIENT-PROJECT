import { ObjectId, type Sort } from "mongodb";
import { getDb } from "./db";
import productsJson from "@/data/products.json";
import categoriesJson from "@/data/categories.json";
import type { Category, Product } from "@/types";
import { isVisibleToStorefront, totalStock, minPrice } from "./product";

const fallbackProducts = productsJson as Product[];

function normalize(doc: Record<string, unknown>): Product {
  const sizes = (Array.isArray(doc.sizes) ? doc.sizes : []) as Product["sizes"];
  return {
    ...(doc as unknown as Product),
    _id: String(doc._id),
    images: Array.isArray(doc.images) ? (doc.images as string[]) : [],
    sizes,
    featured: Boolean(doc.featured),
    bestseller: Boolean(doc.bestseller),
    active: doc.active !== false,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt ?? ""),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt ?? "")
  };
}

export type ShopFilters = {
  artType?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  frame?: string;
  availability?: string;
  sizes?: string[];
  search?: string;
  sort?: string;
  featured?: boolean;
  bestseller?: boolean;
};

async function applySort(products: Product[], sort?: string): Promise<Product[]> {
  switch (sort) {
    case "price-low": return [...products].sort((a, b) => minPrice(a) - minPrice(b));
    case "price-high": return [...products].sort((a, b) => minPrice(b) - minPrice(a));
    case "newest": return [...products].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    case "featured": return [...products].sort((a, b) => (b.featured === a.featured ? 0 : b.featured ? 1 : -1));
    case "bestseller":
    case "best-selling": return [...products].sort((a, b) => (b.bestseller === a.bestseller ? 0 : b.bestseller ? 1 : -1));
    default: return products;
  }
}

export async function getProducts(filters?: ShopFilters): Promise<Product[]> {
  const q = filters?.search?.trim();
  try {
    const db = await getDb();
    try {
      await db.collection("products").createIndexes([
        { key: { slug: 1 }, name: "slug_unique", unique: true },
        { key: { artType: 1, category: 1 } },
        { key: { createdAt: -1 } }
      ]);
    } catch { /* indexes may already exist */ }
    const baseQuery: Record<string, unknown> = {
      $and: [
        { $or: [{ status: "published" }, { status: { $exists: false } }] },
        { $or: [{ active: true }, { active: { $exists: false } }] }
      ]
    };
    const ands: Record<string, unknown>[] = [];
    const ors: Record<string, unknown>[] = [];
    if (filters?.artType) ands.push({ artType: filters.artType });
    if (filters?.category) {
      // DB stores category slugs (e.g. "custom-art"); accept display names too ("Custom Art").
      const raw = filters.category.trim();
      const slug = raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const slugRe = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      ands.push({ $or: [{ category: raw }, { category: new RegExp(`^${slugRe}$`, "i") }] });
    }
    if (filters?.featured) ands.push({ featured: true });
    if (filters?.bestseller) ands.push({ bestseller: true });
    if (q) {
      const terms = q.split(/\s+/).filter(Boolean).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      const fieldConds = terms.flatMap(t => ([
        { title: { $regex: t, $options: "i" } },
        { category: { $regex: t, $options: "i" } },
        { artist: { $regex: t, $options: "i" } },
        { description: { $regex: t, $options: "i" } },
        { sku: { $regex: t, $options: "i" } },
        { "sizes.sku": { $regex: t, $options: "i" } },
      ]));
      ands.push({ $or: fieldConds });
    }

    if (filters?.sizes && filters.sizes.length) {
      const sizeRegexes = filters.sizes.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      ands.push({ sizes: { $elemMatch: { label: { $in: sizeRegexes.map((r) => new RegExp(r, "i")) } } } });
    }
    if (filters?.minPrice || filters?.maxPrice) {
      const priceCond: Record<string, unknown> = {};
      if (filters.minPrice) priceCond.$gte = Number(filters.minPrice);
      if (filters.maxPrice) priceCond.$lte = Number(filters.maxPrice);
      ands.push({ sizes: { $elemMatch: { price: priceCond } } });
    }
    if (filters?.frame) {
      if (filters.frame === "framed") { ands.push({ frameAvailable: true }); }
      else if (filters.frame === "unframed") { ors.push({ frameAvailable: false }, { frameAvailable: { $exists: false } }); }
    }
    if (filters?.availability) {
      if (filters.availability === "in-stock") {
        ands.push({ sizes: { $elemMatch: { stock: { $gt: 0 } } } });
      } else if (filters.availability === "sold-out") {
        ors.push({ sizes: { $not: { $elemMatch: { stock: { $gt: 0 } } } } }, { sizes: { $size: 0 } });
      }
    }
    if (ands.length) (baseQuery.$and as unknown[]).push(...ands);
    if (ors.length) (baseQuery.$and as unknown[]).push({ $or: ors });
    const query = baseQuery;

    let sort: Sort = { createdAt: -1 };
    switch (filters?.sort) {
      case "price-low": sort = { "sizes.0.price": 1 } as Sort; break;
      case "price-high": sort = { "sizes.0.price": -1 } as Sort; break;
      case "newest": sort = { createdAt: -1 } as Sort; break;
      case "featured": sort = { featured: -1, createdAt: -1 } as Sort; break;
      case "bestseller":
      case "best-selling": sort = { bestseller: -1, createdAt: -1 } as Sort; break;
    }

    const docs = await db.collection("products").find(query).sort(sort).limit(200).toArray();
    const mapped = docs.map(normalize).filter(isVisibleToStorefront);
    if (mapped.length) {
      const filteredMapped = mapped.filter(p => {
        const haystack = ((p.title || "") + " " + (p.artist || "") + " " + (p.category || "") + " " + ((p.sizes || []).map(s => s.sku || "").join(" ")) + " " + (p.description || "")).toLowerCase();
        if (q && !haystack.includes(q.toLowerCase())) return false;
        if (filters?.sizes && filters.sizes.length && !(p.sizes || []).some(s => sizeMatchesLabel(s.label, filters.sizes!))) return false;
        if (filters?.minPrice || filters?.maxPrice) {
          const condMin = filters.minPrice ? Number(filters.minPrice) : null;
          const condMax = filters.maxPrice ? Number(filters.maxPrice) : null;
          const inRange = (p.sizes || []).some(s => {
            if (condMin !== null && (Number(s.price) || 0) < condMin) return false;
            if (condMax !== null && (Number(s.price) || 0) > condMax) return false;
            return true;
          });
          if (!inRange) return false;
        }
        if (filters?.availability === "in-stock" && totalStock(p) <= 0) return false;
        if (filters?.availability === "sold-out" && totalStock(p) > 0) return false;
        return true;
      });
      const sorted = applySort(filteredMapped, filters?.sort);
      return sorted;
    }
  } catch { /* fall through to seed data */ }
  const filtered = fallbackProducts.filter(isVisibleToStorefront).filter(p => {
    const haystack = (p.title + " " + (p.artist || "") + " " + (p.category || "") + " " + (p.sizes || []).map(s => s.sku || "").join(" ") + " " + p.description).toLowerCase();
    return (!filters?.artType || p.artType === filters.artType) &&
    (!filters?.category || p.category === filters.category) &&
    (!filters?.featured || p.featured) &&
    (!filters?.bestseller || p.bestseller) &&
    (!q || haystack.includes(q.toLowerCase())) &&
    (!filters?.sizes || !filters.sizes.length || p.sizes.some(s => sizeMatchesLabel(s.label, filters.sizes!))) &&
    (!filters?.minPrice && !filters?.maxPrice ? true : (p.sizes || []).some(s => (!filters?.minPrice || Number(s.price) >= Number(filters.minPrice)) && (!filters?.maxPrice || Number(s.price) <= Number(filters.maxPrice)))) &&
    (!filters?.frame || (filters.frame === "framed" ? p.frameAvailable : !p.frameAvailable)) &&
    (!filters?.availability || (filters.availability === "in-stock" ? totalStock(p) > 0 : totalStock(p) === 0))
  });
  return applySort(filtered, filters?.sort);
}

export async function getProductBySlug(slug: string) {
  try {
    const db = await getDb();
    const doc = await db.collection("products").findOne({
      slug,
      $or: [{ status: "published" }, { status: { $exists: false } }]
    });
    if (doc) {
      const p = normalize(doc);
      if (p.active === false) return null;
      return p;
    }
  } catch { /* fall through to seed data */ }
  return fallbackProducts.find(p => p.slug === slug && p.active) ?? null;
}

export async function getStoreFilters() {
  const db = await getDb();
  try {
    const artTypes = await db.collection("products").distinct("artType");
    const categories = await db.collection("products").distinct("category");
    const sizes = await db.collection("products").distinct("sizes.label");
    return {
      artTypes: artTypes.filter(Boolean) as string[],
      categories: categories.filter(Boolean) as string[],
      sizes: sizes.filter(Boolean) as string[]
    };
  } catch {
    return {
      artTypes: ["hand-painted", "printed-canvas"],
      categories: categoriesJson.map(c => c.slug),
      sizes: ["12x18", "18x24", "24x36", "36x48"]
    };
  }
}

export async function getStoreProducts(filters: ShopFilters): Promise<Product[]> {
  return getProducts(filters);
}

export async function getCategories(): Promise<Category[]> {
  try {
    const db = await getDb();
    const docs = await db.collection("categories").find({ active: true }).sort({ name: 1 }).toArray();
    if (docs.length) return docs.map(d => ({ ...d, _id: String(d._id) })) as Category[];
  } catch { /* fall through to seed data */ }
  return categoriesJson as Category[];
}

export function categorySlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function categoryNameFromSlug(slug: string): string {
  return categoriesJson.find((c) => c.slug === slug)?.name ?? slug;
}

function sizeMatchesLabel(label: string, filters: string[]): boolean {
  const digitsOf = (s: string) => (s.match(/\d+/g) || []).join("x");
  const target = digitsOf(label);
  if (!target) {
    const needle = label.toLowerCase();
    return filters.some((f) => needle.includes(f.toLowerCase().replace("×", "x")));
  }
  return filters.some((f) => {
    const fd = digitsOf(f.replace("×", "x"));
    if (fd && fd === target) return true;
    return label.toLowerCase().includes(f.toLowerCase().replace("×", "x"));
  });
}

export async function getProductById(id: string) {
  try {
    if (!ObjectId.isValid(id)) return null;
    const db = await getDb();
    const doc = await db.collection("products").findOne({ _id: new ObjectId(id) });
    return doc ? ({ ...doc, _id: String(doc._id) } as Product) : null;
  } catch {
    return null;
  }
}

export async function getAllProductsAdmin(): Promise<Product[]> {
  const db = await getDb();
  try {
    await db.collection("products").createIndexes([
      { key: { slug: 1 }, name: "slug_unique", unique: true },
      { key: { status: 1, createdAt: -1 } },
      { key: { artType: 1, category: 1 } },
      { key: { createdAt: -1 } }
    ]);
  } catch { /* indexes may already exist */ }
  const docs = await db.collection("products").find({}).sort({ createdAt: -1 }).limit(500).toArray();
  return docs.map(d => ({ ...d, _id: String(d._id) }) as Product);
}

/** Ensure dashboard/supporting collections exist with sane indexes. Run lazily from admin pages. */
export async function ensureAdminCollections() {
  const db = await getDb();
  try {
    await db.collection("categories").createIndexes([{ key: { slug: 1 }, name: "slug_unique", unique: true }]);
  } catch {}
  try {
    await db.collection("orders").createIndexes([
      { key: { createdAt: -1 } },
      { key: { status: 1, createdAt: -1 } },
      { key: { userId: 1 } }
    ]);
  } catch {}
  try {
    await db.collection("reviews").createIndexes([{ key: { productId: 1, createdAt: -1 } }, { key: { approved: 1 } }]);
  } catch {}
  try {
    await db.collection("customOrders").createIndexes([{ key: { createdAt: -1 } }, { key: { status: 1 } }]);
  } catch {}
  try {
    await db.collection("homepage").createIndexes([{ key: { key: 1 }, name: "key_unique", unique: true }]);
  } catch {}
  return db;
}
