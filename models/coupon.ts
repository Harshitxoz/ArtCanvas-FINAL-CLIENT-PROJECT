import type { ObjectId } from "mongodb";

export interface CouponDocument {
  _id?: ObjectId;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  active: boolean;
  expiresAt?: Date;
  usageLimit?: number;
  usedCount: number;
  createdAt: Date;
}
