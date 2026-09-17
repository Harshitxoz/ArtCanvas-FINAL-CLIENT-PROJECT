import type { ObjectId } from "mongodb";

export interface CategoryDocument {
  _id?: ObjectId;
  name: string;
  slug: string;
  description: string;
  image: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
