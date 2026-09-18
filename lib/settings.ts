import { getDb } from "./db";

export type SettingsDocument = {
  _id: string;
  storeName: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp: string;
  currency: string;
  freeShippingThreshold: number;
  shippingFee: number;
  instagram: string;
  address: string;
  announcement: string;
  headline: string;
  subheadline: string;
  heroImageUrl: string;
  updatedAt?: Date;
};

export const defaults: Omit<SettingsDocument, "_id"> = {
  storeName: "ArtCanvas",
  tagline: "Original art, made to be remembered",
  email: "",
  phone: "",
  whatsapp: "",
  currency: "INR",
  freeShippingThreshold: 999,
  shippingFee: 99,
  instagram: "",
  address: "",
  announcement: "",
  headline: "Bring Art Into Your Life",
  subheadline:
    "Discover original hand-painted canvases and premium prints that make your space feel like yours.",
  heroImageUrl: "",
};

export type StoreSettings = Readonly<Omit<SettingsDocument, "_id">>;

/**
 * Read the current store settings from MongoDB.
 * Returns defaults merged with any stored values so the storefront
 * always has a complete settings object even when the database is unavailable.
 */
export async function getSettings(): Promise<StoreSettings> {
  try {
    const db = await getDb();
    const doc = await db.collection<SettingsDocument>("settings").findOne({ _id: "store" });
    if (!doc) return defaults;
    return {
      storeName: doc.storeName ?? defaults.storeName,
      tagline: doc.tagline ?? defaults.tagline,
      email: doc.email ?? defaults.email,
      phone: doc.phone ?? defaults.phone,
      whatsapp: doc.whatsapp ?? defaults.whatsapp,
      currency: doc.currency ?? defaults.currency,
      freeShippingThreshold: typeof doc.freeShippingThreshold === "number" ? doc.freeShippingThreshold : defaults.freeShippingThreshold,
      shippingFee: typeof doc.shippingFee === "number" ? doc.shippingFee : defaults.shippingFee,
      instagram: doc.instagram ?? defaults.instagram,
      address: doc.address ?? defaults.address,
      announcement: doc.announcement ?? defaults.announcement,
      headline: doc.headline ?? defaults.headline,
      subheadline: doc.subheadline ?? defaults.subheadline,
      heroImageUrl: doc.heroImageUrl ?? defaults.heroImageUrl,
    } as StoreSettings;
  } catch {
    return defaults;
  }
}

export type ShippingConfig = Readonly<{ freeShippingThreshold: number; shippingFee: number }>;

export function getShippingConfig(settings: StoreSettings): ShippingConfig {
  return {
    freeShippingThreshold: settings.freeShippingThreshold,
    shippingFee: settings.shippingFee,
  };
}
