import type { ObjectId } from "mongodb";
import type { CartItem, OrderStatus, OrderNotificationRecord } from "@/types";

export interface OrderRefund {
  id: string;
  amount: number;
  createdAt: string;
  note?: string;
}

export interface OrderDocument {
  _id?: ObjectId;
  userId?: ObjectId;
  userEmail?: string;
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
  razorpayOrderId?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  adminShippingNotes?: string;
  customerMessage?: string;
  refund?: OrderRefund;
  notifications?: OrderNotificationRecord[];
  latestNotification?: {
    type: string;
    sentAt: Date | string;
    success: boolean;
    error?: string;
    recipient?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
