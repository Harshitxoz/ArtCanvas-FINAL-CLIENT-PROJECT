# ArtCanvas Client Handoff

## Included
This package contains the current ArtCanvas Next.js source code, MongoDB models/queries, authentication, admin product/order flows, storefront, cart, checkout, Razorpay integration, Cloudinary integration, and sample seed data.

## Not included for security
- `.env.local`
- `node_modules/`
- `.next/`
- `.git/`
- API keys, database passwords, JWT secrets, Cloudinary secrets, or Razorpay secrets

## Local setup
1. Install Node.js 20.19+.
2. Copy `.env.example` to `.env.local`.
3. Fill in the production/test credentials securely.
4. Run `npm install`.
5. Run `npm run bootstrap-admin` to create your initial store administrator account.
6. Run `npm run build`.
7. Run `npm run start` for a production build.

## Required production configuration
- MongoDB Atlas database/user for `artcanvas`.
- Strong `AUTH_SECRET` (at least 32 random characters).
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` (used by `npm run bootstrap-admin`).
- Cloudinary credentials for artwork uploads.
- Razorpay test keys for testing, then live keys after business onboarding.
- Production `NEXT_PUBLIC_SITE_URL`.

## Admin Account Creation
- Run `npm run bootstrap-admin` locally or on your server to create or reset the store administrator.
- The administrator can then sign in at `/login` and manage products, orders, categories, coupons, reviews, and settings at `/admin`.

## Important
Review the admin pages and business policies before production launch. Shipping provider integration, transactional email, tax/GST configuration, legal copy, and any business-specific coupon/review/custom-order workflows must be configured and tested against the client's actual requirements.
