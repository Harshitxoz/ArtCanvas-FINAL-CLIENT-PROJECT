import type { ObjectId } from "mongodb";
import type { ArtType, ProductSize, ProductStatus } from "@/types";

export interface ProductDocument {
  _id?: ObjectId;
  title: string;
  slug: string;
  artType: ArtType;
  category: string;
  artist?: string;
  description: string;
  medium?: string;
  canvasMaterial?: string;
  orientation?: "landscape" | "portrait" | "square";
  images: string[];
  roomPreview?: string;
  closeUp?: string;
  authenticityImage?: string;
  sizes: ProductSize[];
  sku?: string;
  weight?: number;
  deliveryTime?: string;
  frameAvailable?: boolean;
  framedPrice?: number;
  unframedPrice?: number;
  care?: string;
  featured: boolean;
  bestseller: boolean;
  newArrival?: boolean;
  active: boolean;
  status?: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

