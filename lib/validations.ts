import { z } from "zod";
export const customOrderRequestSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: z.string().trim().email("Please enter a valid email address.").max(160),
  phone: z
    .string()
    .trim()
    .regex(/^[+()\-.\s\d]{8,20}$/, "Please enter a valid phone number.")
    .max(20),
  artworkType: z.enum(["hand-painted", "printed-canvas"]),
  size: z.string().trim().max(80).default(""),
  style: z.string().trim().max(80).default(""),
  budget: z.number().nonnegative().max(10000000).optional(),
  deadline: z.string().trim().max(30).default(""),
  description: z
    .string()
    .trim()
    .min(10, "Please describe your artwork in at least 10 characters.")
    .max(3000),
  notes: z.string().trim().max(2000).default(""),
  referenceImage: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .refine((v) => !v || /^https?:\/\//i.test(v) || v.startsWith("/"), {
      message: "Reference image must be a valid URL.",
    }),
});

export type CustomOrderRequest = z.infer<typeof customOrderRequestSchema>;


export const productSizeSchema = z.object({
  label: z.string().min(1).max(50),
  width: z.number().positive(),
  height: z.number().positive(),
  price: z.number().nonnegative(),
  compareAt: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative(),
  sku: z.string().max(60).optional()
});

/** Accepts either a plain URL string (legacy) or an object with url + optional publicId (new). */
const imageInput = z.union([
  z.string().url(),
  z.object({
    url: z.string().url(),
    publicId: z.string().optional()
  }).passthrough()
]).transform(v => {
  if (typeof v === "string") return { url: v };
  return { url: v.url, publicId: v.publicId };
});

export const productSchema = z.object({
  title: z.string().min(2).max(120),
  slug: z.string().min(2).max(140).regex(/^[a-z0-9-]+$/),
  artType: z.enum(["hand-painted", "printed-canvas"]),
  category: z.string().min(2).max(80),
  artist: z.string().max(120).optional().default(""),
  description: z.string().min(10).max(5000),
  medium: z.string().max(120).optional().default(""),
  canvasMaterial: z.string().max(120).optional().default(""),
  orientation: z.enum(["landscape", "portrait", "square"]).optional().default("landscape"),
  images: z.array(imageInput).min(1).max(8),
  roomPreview: z.string().url().or(z.string().startsWith("/")).optional().or(z.literal("")),
  closeUp: z.string().url().or(z.string().startsWith("/")).optional().or(z.literal("")),
  authenticityImage: z.string().url().or(z.string().startsWith("/")).optional().or(z.literal("")),
  sizes: z.array(productSizeSchema).min(1).max(10),
  sku: z.string().max(60).optional().default(""),
  weight: z.number().nonnegative().max(500).optional().default(0),
  deliveryTime: z.string().max(120).optional().default(""),
  frameAvailable: z.boolean().default(false),
  framedPrice: z.number().nonnegative().optional().default(0),
  unframedPrice: z.number().nonnegative().optional().default(0),
  care: z.string().max(2000).optional().default(""),
  featured: z.boolean().default(false),
  bestseller: z.boolean().default(false),
  newArrival: z.boolean().default(false),
  active: z.boolean().default(true),
  status: z.enum(["draft", "published", "archived"]).default("published"),
  seoTitle: z.string().max(70).optional().default(""),
  seoDescription: z.string().max(170).optional().default("")
});


export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const orderStatusSchema = z.object({
  status: z.enum(["pending", "paid", "processing", "packed", "shipped", "delivered", "cancelled", "refunded"])
});

export const orderShippingSchema = z.object({
  shippingCarrier: z.string().max(100).optional().or(z.literal("")),
  trackingNumber: z.string().max(100).optional().or(z.literal("")),
  trackingUrl: z.string().max(500).optional().or(z.literal("")).refine(v => !v || /^https?:\/\//i.test(v), { message: "Tracking URL must be a valid URL." }),
  estimatedDelivery: z.string().max(100).optional().or(z.literal("")),
  adminShippingNotes: z.string().max(2000).optional().or(z.literal(""))
});

export const orderRefundSchema = z.object({
  amount: z.number().positive().max(10000000),
  note: z.string().max(2000).optional().or(z.literal(""))
});

export const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    size: z.string().min(1),
    quantity: z.number().int().positive().max(20),
    frame: z.enum(["unframed", "framed"]).optional()
  })).min(1),
  couponCode: z.string().max(30).optional().or(z.literal("")),
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(8).max(20),
    address: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(4).max(12)
  })
});

export const reviewActionSchema = z.object({
  approved: z.boolean()
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, "Category name must be at least 2 characters.").max(80),
  slug: z.string().trim().max(100).optional(),
  description: z.string().trim().max(500).default(""),
  image: z.string().trim().max(1000).default(""),
  active: z.boolean().default(true)
});

export const categoryUpdateSchema = z
  .object({
    name: z.string().trim().min(2, "Category name must be at least 2 characters.").max(80),
    slug: z.string().trim().max(100),
    description: z.string().trim().max(500),
    image: z.string().trim().max(1000),
    active: z.boolean()
  })
  .partial();

export const couponBaseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Coupon code must be at least 3 characters.")
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/, "Coupon code can only contain letters, numbers, dashes and underscores."),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().positive("Discount value must be greater than 0.").max(10000000),
  minimumOrderValue: z.number().nonnegative().max(10000000).default(0),
  maximumDiscount: z.number().positive().max(10000000).nullable().default(null),
  startsAt: z.string().trim().max(40).nullable().default(null),
  expiresAt: z.string().trim().max(40).nullable().default(null),
  usageLimit: z.number().int().positive().max(1000000).nullable().default(null),
  perCustomerLimit: z.number().int().positive().max(100).nullable().default(null),
  active: z.boolean().default(true)
});

export const couponInputSchema = couponBaseSchema.superRefine((value, ctx) => {
  if (value.discountType === "percentage" && value.discountValue > 100) {
    ctx.addIssue({ code: "custom", path: ["discountValue"], message: "Percentage discount cannot exceed 100." });
  }
  if (value.discountType === "fixed" && value.discountValue <= 0) {
    ctx.addIssue({ code: "custom", path: ["discountValue"], message: "Fixed discount must be greater than 0." });
  }
  const start = value.startsAt ? new Date(value.startsAt) : null;
  const end = value.expiresAt ? new Date(value.expiresAt) : null;
  if (start && Number.isNaN(start.getTime())) {
    ctx.addIssue({ code: "custom", path: ["startsAt"], message: "Start date is not valid." });
  }
  if (end && Number.isNaN(end.getTime())) {
    ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Expiry date is not valid." });
  }
  if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
    ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Expiry date must be after the start date." });
  }
});

export const couponUpdateSchema = couponBaseSchema.partial()
  .superRefine((value, ctx) => {
    const discountType = value.discountType;
    if (discountType === "percentage" && typeof value.discountValue === "number" && value.discountValue > 100) {
      ctx.addIssue({ code: "custom", path: ["discountValue"], message: "Percentage discount cannot exceed 100." });
    }
    if (discountType === "fixed" && typeof value.discountValue === "number" && value.discountValue <= 0) {
      ctx.addIssue({ code: "custom", path: ["discountValue"], message: "Fixed discount must be greater than 0." });
    }
    const startRaw = value.startsAt;
    const endRaw = value.expiresAt;
    if (startRaw && typeof startRaw === "string") {
      const start = new Date(startRaw);
      if (Number.isNaN(start.getTime())) ctx.addIssue({ code: "custom", path: ["startsAt"], message: "Start date is not valid." });
    }
    if (endRaw && typeof endRaw === "string") {
      const end = new Date(endRaw);
      if (Number.isNaN(end.getTime())) ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Expiry date is not valid." });
    }
    if (startRaw && endRaw && typeof startRaw === "string" && typeof endRaw === "string") {
      const start = new Date(startRaw);
      const end = new Date(endRaw);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
        ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Expiry date must be after the start date." });
      }
    }
  });

export const customOrderStatusSchema = z.object({
  status: z.enum(["new", "quoted", "in-progress", "completed", "cancelled"]),
  adminNotes: z.string().max(2000).optional()
});


export const homepageSettingsSchema = z.object({
  headline: z.string().min(3).max(120),
  subheadline: z.string().max(240).default(""),
  heroImageUrl: z.string().url().or(z.string().startsWith("/")).optional().or(z.literal("")),
  announcement: z.string().max(160).default("")
});
