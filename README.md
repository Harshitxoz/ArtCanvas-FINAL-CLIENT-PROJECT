# ArtCanvas — Production E-commerce Store

A premium Next.js + MongoDB storefront for original hand-painted artwork and printed canvas products, with a client-friendly admin dashboard.

## Included

- Customer storefront, search, filters, categories and product detail pages
- Hand-Painted / Printed Canvas product types
- Wishlist and persistent cart
- Checkout with server-side product/stock validation
- Razorpay order creation + signature verification
- MongoDB-backed products, users, orders, categories, coupons, reviews and custom artwork enquiries
- Admin dashboard for products, orders, customers, categories, coupons, reviews, custom orders, homepage and settings
- Cloudinary image uploads with a 30 MB per-file limit
- Draft / published / archived products and per-size inventory
- Responsive mobile-first UI
- Production security baseline: HTTP-only session cookie, password hashing, Zod validation and admin authorization

## Local setup

1. Install Node.js 20.19+ (recommended for the MongoDB driver used by this project).
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Fill in MongoDB, AUTH_SECRET, Cloudinary and Razorpay credentials. **Never commit `.env.local`.**
5. Run `npm run dev`.
6. Before deployment run `npm run typecheck`, `npm run lint`, `npm run build`, then `npm start`.

## Production environment

Required: `MONGODB_URI`, `MONGODB_DB`, `AUTH_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Optional seed credentials are for development only. The seed endpoint is disabled when `NODE_ENV=production`.

## Client workflow

The client can manage artwork without coding from `/admin`: add artwork, upload images, set size/price/stock, publish or archive, process orders, create coupons, moderate reviews, handle custom commissions and update store settings.

## Important

The client package intentionally excludes `node_modules`, `.next`, `.git`, and `.env.local`. Run `npm install` after extracting it.
