import type { ObjectId } from "mongodb";
import type { CartItem, OrderStatus } from "@/types";

export interface OrderDocument {
  _id?: ObjectId;
  userId?: ObjectId;
  items: CartItem[];
  customer: {
    name: string; email: string; phone: string; address: string; city: string; state: string; postalCode: string;
  };
  subtotal: number;
  discount?: number;
  couponCode?: string;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentStatus: "pending" | "paid" | "failed";
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}
