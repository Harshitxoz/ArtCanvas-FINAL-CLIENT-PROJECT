export type ArtType = "hand-painted" | "printed-canvas";
export type UserRole = "customer" | "admin";
export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
export type ProductStatus = "draft" | "published" | "archived";

export interface Category {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  active?: boolean;
}

export interface ProductSize {
  label: string;
  width: number;
  height: number;
  price: number;
  compareAt?: number;
  stock: number;
  sku?: string;
}

export interface Product {
  _id?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  productId: string;
  title: string;
  slug: string;
  image: string;
  size: string;
  price: number;
  quantity: number;
  frame?: "unframed" | "framed";
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Order {
  _id?: string;
  userId?: string;
  items: CartItem[];
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
  };
  subtotal: number;
  discount?: number;
  couponCode?: string;
    shipping: number;
  total: number;
  status: OrderStatus;
  paymentStatus: "pending" | "paid" | "failed";
  paymentId?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  adminShippingNotes?: string;
  refund?: {
    id: string;
    amount: number;
    createdAt: string;
    note?: string;
  };
  createdAt?: string;
}


export interface Review {
  _id: string;
  productId: string;
  userId?: string | null;
  customerName: string;
  rating: number;
  title?: string;
  body: string;
  approved: boolean;
  verifiedPurchase?: boolean;
  createdAt?: string;
}

