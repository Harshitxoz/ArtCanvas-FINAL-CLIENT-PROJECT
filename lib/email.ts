import nodemailer from "nodemailer";
import { formatINR } from "@/lib/utils";
import type { OrderStatus, NotificationType, OrderNotificationRecord } from "@/types";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export interface EmailOrderItem {
  title: string;
  size?: string;
  frame?: string;
  quantity: number;
  price: number;
  image?: string;
  slug?: string;
  artType?: string;
}

export interface EmailOrderData {
  _id?: string | ObjectId | { toString(): string };
  paymentId?: string;
  razorpayOrderId?: string;
  total: number;
  subtotal: number;
  shipping: number;
  discount?: number;
  couponCode?: string;
  accountEmail?: string;
  guestEmail?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode?: string;
    pincode?: string;
  };
  items: EmailOrderItem[];
  createdAt?: Date | string;
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  customerMessage?: string;
  refund?: {
    id: string;
    amount: number;
    note?: string;
  };
}

export interface ShippingNotificationData {
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  customerMessage?: string;
}

export interface RefundNotificationData {
  id: string;
  amount: number;
  note?: string;
}

export type EmailProviderType = "resend" | "smtp" | "mock";

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  provider: EmailProviderType;
  messageId?: string;
  error?: string;
}

// -----------------------------------------------------------------------------
// Provider Layer: Resend & SMTP
// -----------------------------------------------------------------------------

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function getDefaultFrom(): string {
  return (
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    process.env.STORE_EMAIL ||
    "ArtCanvas Studio <onboarding@resend.dev>"
  );
}

export function getTransporter() {
  const service = process.env.SMTP_SERVICE?.trim();
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const port = Number(process.env.SMTP_PORT || (host === "smtp.gmail.com" ? 465 : 587));

  if (!user || !pass) {
    return null;
  }

  if (service) {
    return nodemailer.createTransport({
      service,
      auth: { user, pass }
    });
  }

  if (!host) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production"
    }
  });
}

/**
 * Universal server-side email sender.
 * 1. Checks RESEND_API_KEY -> Uses Resend API via native fetch.
 * 2. Checks SMTP credentials -> Uses Nodemailer transporter.
 * 3. Fallback -> Logs safely in mock mode without throwing.
 */
export async function sendEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
  const from = payload.from || getDefaultFrom();
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  const validRecipients = recipients.map(r => r.trim().toLowerCase()).filter(Boolean);

  if (validRecipients.length === 0) {
    return { ok: false, provider: "mock", error: "No valid recipient email address provided." };
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  // 1. Send via Resend if key exists
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from,
          to: validRecipients,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
          ...(payload.replyTo ? { reply_to: payload.replyTo } : {})
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = data?.message || data?.error || `Resend HTTP error ${res.status}`;
        console.error("[EMAIL_DISPATCH_FAIL]", `Provider: Resend | Error: ${errorMsg}`);
        return { ok: false, provider: "resend", error: String(errorMsg) };
      }

      const messageId = String(data?.id || `resend-${Date.now()}`);
      console.log(`[EMAIL_SENT] Provider: Resend | Id: ${messageId} | To: ${validRecipients.join(", ")}`);
      return { ok: true, provider: "resend", messageId };
    } catch (err) {
      const safeError = err instanceof Error ? err.message : "Network error contacting Resend";
      console.error("[EMAIL_DISPATCH_FAIL]", `Provider: Resend | Network Error: ${safeError}`);
      return { ok: false, provider: "resend", error: safeError };
    }
  }

  // 2. Send via Nodemailer SMTP if configured
  const transporter = getTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to: validRecipients.join(", "),
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        ...(payload.replyTo ? { replyTo: payload.replyTo } : {})
      });

      const messageId = String(info.messageId || `smtp-${Date.now()}`);
      console.log(`[EMAIL_SENT] Provider: SMTP | Id: ${messageId} | To: ${validRecipients.join(", ")}`);
      return { ok: true, provider: "smtp", messageId };
    } catch (err) {
      const safeError = err instanceof Error ? err.message : "SMTP transmission failed";
      console.error("[EMAIL_DISPATCH_FAIL]", `Provider: SMTP | Error: ${safeError}`);
      return { ok: false, provider: "smtp", error: safeError };
    }
  }

  // 3. Fallback: Mock mode for development without crashing
  const mockId = `mock-${Date.now()}`;
  console.warn(
    `[EMAIL_DEV_NOTICE] No email provider configured (RESEND_API_KEY or SMTP_USER/PASS).\n` +
    `Subject: "${payload.subject}"\n` +
    `Recipient(s): ${validRecipients.join(", ")}\n` +
    `Order status and history saved cleanly.`
  );
  return { ok: true, provider: "mock", messageId: mockId };
}

// -----------------------------------------------------------------------------
// HTML & Text Templates (Warm cream & brown luxury palette)
// -----------------------------------------------------------------------------

function renderEmailShell({
  preheader,
  badgeText,
  badgeBg = "#eaf6ec",
  badgeColor = "#1f7a4d",
  heading,
  subheading,
  contentHtml
}: {
  preheader: string;
  badgeText: string;
  badgeBg?: string;
  badgeColor?: string;
  heading: string;
  subheading: string;
  contentHtml: string;
}) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${heading}</title>
    </head>
    <body style="margin: 0; padding: 24px 0; background-color: #faf7f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2e2823; line-height: 1.55;">
      <!-- Hidden Preheader -->
      <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
        ${preheader}
      </div>

      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center">
            <!-- Main Card Container -->
            <table width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 18px rgba(32, 26, 22, 0.05); border: 1px solid #ebe4d8;">
              
              <!-- Brand Header -->
              <tr>
                <td style="background-color: #1a1614; padding: 34px 28px; text-align: center; border-bottom: 3px solid #d4a373;">
                  <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; letter-spacing: 3px; color: #d4a373; font-weight: normal;">
                    ARTCANVAS
                  </h1>
                  <p style="margin: 6px 0 0 0; font-size: 12px; letter-spacing: 1.6px; text-transform: uppercase; color: #cfc8c0;">
                    Original Artworks & Fine Art Canvas Prints
                  </p>
                </td>
              </tr>

              <!-- Card Content Area -->
              <tr>
                <td style="padding: 34px 28px;">
                  
                  <!-- Status Pill -->
                  <div style="text-align: center; margin-bottom: 22px;">
                    <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 20px;">
                      ${badgeText}
                    </span>
                  </div>

                  <h2 style="font-family: Georgia, serif; font-size: 23px; color: #1a1614; margin: 0 0 10px 0; text-align: center;">
                    ${heading}
                  </h2>
                  <p style="color: #6e665d; font-size: 14px; text-align: center; margin: 0 0 26px 0; line-height: 1.6;">
                    ${subheading}
                  </p>

                  ${contentHtml}

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f7f3ec; padding: 22px 28px; text-align: center; border-top: 1px solid #ebe4d8;">
                  <p style="margin: 0 0 6px 0; font-size: 12px; color: #7a7267;">
                    Have questions about framing or delivery? Reply directly to this email or contact <a href="mailto:support@artcanvas.com" style="color: #9a5d19; text-decoration: underline;">support@artcanvas.com</a>.
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #a69e94;">
                    ArtCanvas Studio • Fine Art & Canvas Prints • All rights reserved
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function renderItemsTableHtml(items: EmailOrderItem[]) {
  const rows = items
    .map((item) => {
      const artTypeLabel = item.artType === "printed-canvas" ? "Printed Canvas" : "Hand-Painted Canvas";
      const frameLabel = item.frame === "framed" ? "Museum Wood Frame" : "Rolled Canvas";
      return `
        <tr>
          <td style="padding: 14px 10px; border-bottom: 1px solid #f2ede4; vertical-align: top;">
            <table border="0" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                ${item.image ? `
                <td style="vertical-align: top; padding-right: 12px;">
                  <img src="${item.image}" alt="" width="56" height="56" style="display: block; border-radius: 8px; object-fit: cover; border: 1px solid #e8e2d8;" />
                </td>` : ""}
                <td style="vertical-align: top;">
                  <div style="font-size: 14px; font-weight: 700; color: #1a1614; line-height: 1.3;">
                    ${item.title}
                  </div>
                  <div style="margin-top: 3px; font-size: 12px; color: #7a7267;">
                    ${artTypeLabel} • Size: <strong style="color: #4a443b;">${item.size || "Standard"}</strong> • ${frameLabel}
                  </div>
                </td>
              </tr>
            </table>
          </td>
          <td style="padding: 14px 10px; border-bottom: 1px solid #f2ede4; text-align: center; color: #555; vertical-align: middle; font-size: 13px;">
            ${item.quantity}
          </td>
          <td style="padding: 14px 10px; border-bottom: 1px solid #f2ede4; text-align: right; color: #1a1614; font-weight: 700; vertical-align: middle; font-size: 14px;">
            ${formatINR(item.price * item.quantity)}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse; margin-bottom: 18px;">
      <thead>
        <tr style="background-color: #f7f3ec; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; color: #776e65;">
          <th style="padding: 9px 10px; text-align: left;">Artwork Details</th>
          <th style="padding: 9px 10px; text-align: center; width: 50px;">Qty</th>
          <th style="padding: 9px 10px; text-align: right; width: 90px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function renderPriceBreakdownHtml(order: EmailOrderData) {
  return `
    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="font-size: 13px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 5px 0; color: #6e665d;">Artwork Subtotal</td>
        <td style="padding: 5px 0; text-align: right; color: #1a1614; font-weight: 600;">${formatINR(order.subtotal)}</td>
      </tr>
      ${order.discount ? `
      <tr>
        <td style="padding: 5px 0; color: #1f7a4d;">Discount Applied ${order.couponCode ? `(${order.couponCode})` : ""}</td>
        <td style="padding: 5px 0; text-align: right; color: #1f7a4d; font-weight: 600;">-${formatINR(order.discount)}</td>
      </tr>` : ""}
      <tr>
        <td style="padding: 5px 0; color: #6e665d;">Transit-Insured Shipping</td>
        <td style="padding: 5px 0; text-align: right; color: #1a1614; font-weight: 600;">${order.shipping > 0 ? formatINR(order.shipping) : "FREE"}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0 0 0; font-size: 15px; font-weight: 700; color: #1a1614; border-top: 2px solid #ebe4d8;">Final Paid Amount</td>
        <td style="padding: 12px 0 0 0; text-align: right; font-size: 18px; font-weight: 700; color: #9a5d19; border-top: 2px solid #ebe4d8;">${formatINR(order.total)}</td>
      </tr>
    </table>
  `;
}

// -----------------------------------------------------------------------------
// 1. Payment Confirmation Template
// -----------------------------------------------------------------------------

export function buildPaymentConfirmationEmail(order: EmailOrderData) {
  const orderIdStr = String(order._id || "");
  const orderNumber = orderIdStr ? orderIdStr.slice(-8).toUpperCase() : "AC-" + Date.now().toString().slice(-6);
  const siteUrl = getSiteUrl();
  const orderUrl = orderIdStr ? `${siteUrl}/order-confirmation/${orderIdStr}` : `${siteUrl}/account/orders`;
  const postal = order.customer.postalCode || order.customer.pincode || "";
  const fullAddress = `${order.customer.address}, ${order.customer.city}, ${order.customer.state} ${postal}`.trim();

  const contentHtml = `
    <!-- Order Snapshot Card -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #faf7f2; border: 1px solid #ebd9c5; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 18px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size: 13px; color: #776e65; padding-bottom: 5px;">
                <strong>Order Reference:</strong> <span style="font-family: monospace; color: #1a1614; font-size: 14px; font-weight: bold;">#AC-${orderNumber}</span>
              </td>
            </tr>
            ${order.paymentId ? `
            <tr>
              <td style="font-size: 13px; color: #776e65; padding-bottom: 5px;">
                <strong>Payment ID:</strong> <span style="font-family: monospace; color: #1a1614;">${order.paymentId}</span>
              </td>
            </tr>` : ""}
            <tr>
              <td style="font-size: 13px; color: #776e65; padding-bottom: 5px;">
                <strong>Payment Status:</strong> <span style="color: #1f7a4d; font-weight: bold;">Paid & Verified</span>
              </td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #776e65;">
                <strong>Delivery Address:</strong> <span style="color: #1a1614;">${fullAddress}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <h3 style="font-family: Georgia, serif; font-size: 17px; color: #1a1614; margin: 0 0 10px 0; border-bottom: 2px solid #f2ede4; padding-bottom: 6px;">
      Artwork Summary (${order.items.length} item${order.items.length === 1 ? "" : "s"})
    </h3>

    ${renderItemsTableHtml(order.items)}
    ${renderPriceBreakdownHtml(order)}

    <div style="text-align: center; margin: 28px 0 20px 0;">
      <a href="${orderUrl}" style="display: inline-block; background-color: #9a5d19; color: #ffffff; text-decoration: none; padding: 13px 30px; border-radius: 26px; font-weight: 700; font-size: 13px; letter-spacing: 0.5px;">
        View Live Order Details →
      </a>
    </div>

    <!-- Fulfillment Roadmap -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #fbfaf8; border-radius: 12px; padding: 16px; border: 1px solid #f0ebe4; margin-top: 18px;">
      <tr>
        <td>
          <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #9a5d19;">
            Studio Preparation Timeline:
          </h4>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #5a544d;">
            1. <strong>Studio Inspection:</strong> Our artists verify canvas quality, apply protective varnish, and assemble custom frames.
          </p>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #5a544d;">
            2. <strong>Transit Protection:</strong> Every canvas is safely wrapped in shockproof bubble insulation and corner guards.
          </p>
          <p style="margin: 0; font-size: 12px; color: #5a544d;">
            3. <strong>Dispatched:</strong> You will receive courier tracking details as soon as the courier collects your shipment.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailShell({
    preheader: `Payment verified for Order #AC-${orderNumber}. Preparing your artwork with care.`,
    badgeText: "✓ Payment Confirmed",
    heading: `Thank you for your order, ${order.customer.name}!`,
    subheading: "We have confirmed your payment. Our studio team is preparing your artwork for custom framing and secure transit.",
    contentHtml
  });

  const text = [
    `ARTCANVAS — Order Confirmed: #AC-${orderNumber}`,
    `Thank you for your purchase, ${order.customer.name}!`,
    ``,
    `Payment Status: Paid`,
    order.paymentId ? `Payment ID: ${order.paymentId}` : "",
    `Total Paid: ${formatINR(order.total)}`,
    `Delivery Address: ${fullAddress}`,
    ``,
    `Items:`,
    ...order.items.map(
      i => `- ${i.title} (${i.artType || "Artwork"}) | Size: ${i.size || "Standard"} | ${i.frame === "framed" ? "Framed" : "Unframed"} | Qty: ${i.quantity} | ${formatINR(i.price * i.quantity)}`
    ),
    ``,
    `View order details online: ${orderUrl}`,
    ``,
    `ArtCanvas Studio • support@artcanvas.com`
  ].filter(Boolean).join("\n");

  return {
    subject: "Your ArtCanvas order is confirmed! 🎨",
    html,
    text
  };
}

// -----------------------------------------------------------------------------
// 2. Order Shipped Template
// -----------------------------------------------------------------------------

export function buildOrderShippedEmail(order: EmailOrderData, shipping: ShippingNotificationData) {
  const orderIdStr = String(order._id || "");
  const orderNumber = orderIdStr ? orderIdStr.slice(-8).toUpperCase() : "AC-" + Date.now().toString().slice(-6);
  const siteUrl = getSiteUrl();
  const orderUrl = orderIdStr ? `${siteUrl}/order-confirmation/${orderIdStr}` : `${siteUrl}/account/orders`;
  const postal = order.customer.postalCode || order.customer.pincode || "";
  const fullAddress = `${order.customer.address}, ${order.customer.city}, ${order.customer.state} ${postal}`.trim();

  const carrier = shipping.shippingCarrier || order.shippingCarrier || "Standard Studio Courier";
  const trackingNumber = shipping.trackingNumber || order.trackingNumber || "Pending Courier Scan";
  const trackingUrl = shipping.trackingUrl || order.trackingUrl;
  const estimatedDelivery = shipping.estimatedDelivery || order.estimatedDelivery;
  const customerMessage = shipping.customerMessage || order.customerMessage;

  const contentHtml = `
    <!-- Tracking Card -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #faf7f2; border: 1px solid #fae8d4; border-radius: 14px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 18px 20px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size: 13px; color: #776e65; padding-bottom: 6px;">
                <strong>Shipping Courier:</strong> <span style="color: #1a1614; font-weight: bold;">${carrier}</span>
              </td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #776e65; padding-bottom: 6px;">
                <strong>Tracking Number:</strong> <span style="font-family: monospace; font-size: 14px; color: #1a1614; font-weight: bold;">${trackingNumber}</span>
              </td>
            </tr>
            ${estimatedDelivery ? `
            <tr>
              <td style="font-size: 13px; color: #776e65; padding-bottom: 6px;">
                <strong>Estimated Delivery:</strong> <span style="color: #9a5d19; font-weight: bold;">${estimatedDelivery}</span>
              </td>
            </tr>` : ""}
            <tr>
              <td style="font-size: 13px; color: #776e65;">
                <strong>Delivering To:</strong> <span style="color: #1a1614;">${fullAddress}</span>
              </td>
            </tr>
          </table>

          ${trackingUrl ? `
          <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid #ebd9c5; text-align: center;">
            <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #9a5d19; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">
              Track Shipment Online →
            </a>
          </div>` : ""}
        </td>
      </tr>
    </table>

    ${customerMessage ? `
    <div style="background-color: #f6f3ee; border-left: 4px solid #9a5d19; padding: 14px 16px; margin-bottom: 22px; border-radius: 0 10px 10px 0;">
      <p style="margin: 0; font-size: 13px; color: #4a443b; font-style: italic;">
        "${customerMessage}"
      </p>
      <span style="display: block; margin-top: 4px; font-size: 11px; color: #887e73;">— ArtCanvas Studio Note</span>
    </div>` : ""}

    <h3 style="font-family: Georgia, serif; font-size: 17px; color: #1a1614; margin: 0 0 10px 0; border-bottom: 2px solid #f2ede4; padding-bottom: 6px;">
      Artworks in Transit (${order.items.length})
    </h3>

    ${renderItemsTableHtml(order.items)}

    <div style="text-align: center; margin: 26px 0 10px 0;">
      <a href="${orderUrl}" style="display: inline-block; background-color: #201a16; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 24px; font-weight: 700; font-size: 13px;">
        View Order Status Online →
      </a>
    </div>
  `;

  const html = renderEmailShell({
    preheader: `Artwork package dispatched via ${carrier}. Tracking: ${trackingNumber}`,
    badgeText: "🚚 Order Dispatched",
    badgeBg: "#e7f2ed",
    badgeColor: "#1d6643",
    heading: `Your artwork is on its way, ${order.customer.name}!`,
    subheading: `Your order #AC-${orderNumber} has been safely packed with wooden corner guards and handed over to our courier partner.`,
    contentHtml
  });

  const text = [
    `ARTCANVAS — Order Shipped: #AC-${orderNumber}`,
    `Good news, ${order.customer.name}! Your order has been dispatched.`,
    ``,
    `Courier: ${carrier}`,
    `Tracking ID: ${trackingNumber}`,
    trackingUrl ? `Tracking URL: ${trackingUrl}` : "",
    estimatedDelivery ? `Estimated Delivery: ${estimatedDelivery}` : "",
    `Shipping Address: ${fullAddress}`,
    customerMessage ? `Studio Note: "${customerMessage}"` : "",
    ``,
    `Items in shipment:`,
    ...order.items.map(i => `- ${i.title} (${i.size || "Standard"}) x${i.quantity}`),
    ``,
    `View online: ${orderUrl}`,
    `ArtCanvas Studio • support@artcanvas.com`
  ].filter(Boolean).join("\n");

  return {
    subject: "Your ArtCanvas artwork has shipped! 🚚",
    html,
    text
  };
}

// -----------------------------------------------------------------------------
// 3. Order Delivered Template
// -----------------------------------------------------------------------------

export function buildOrderDeliveredEmail(order: EmailOrderData) {
  const orderIdStr = String(order._id || "");
  const orderNumber = orderIdStr ? orderIdStr.slice(-8).toUpperCase() : "AC-" + Date.now().toString().slice(-6);
  const siteUrl = getSiteUrl();
  const orderUrl = orderIdStr ? `${siteUrl}/order-confirmation/${orderIdStr}` : `${siteUrl}/account/orders`;

  const contentHtml = `
    <div style="background-color: #f7faf7; border: 1px solid #d4e8d8; border-radius: 12px; padding: 18px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #1f7a4d; font-weight: bold;">
        Package marked as Delivered
      </p>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #627566;">
        Order #AC-${orderNumber} has arrived at your shipping address.
      </p>
    </div>

    <h3 style="font-family: Georgia, serif; font-size: 17px; color: #1a1614; margin: 0 0 10px 0; border-bottom: 2px solid #f2ede4; padding-bottom: 6px;">
      Delivered Artworks
    </h3>
    ${renderItemsTableHtml(order.items)}

    <!-- Care Tips Card -->
    <div style="background-color: #faf7f2; border: 1px solid #fae8d4; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #9a5d19;">
        Artwork Display & Care Tips:
      </h4>
      <p style="margin: 0 0 6px 0; font-size: 12px; color: #5a544d;">
        • <strong>Placement:</strong> Keep away from prolonged direct humidity (bathrooms) and active radiators.
      </p>
      <p style="margin: 0 0 6px 0; font-size: 12px; color: #5a544d;">
        • <strong>Cleaning:</strong> Use a dry, soft microfiber duster. Never use wet sprays, ammonia, or detergents.
      </p>
      <p style="margin: 0; font-size: 12px; color: #5a544d;">
        • <strong>Mounting:</strong> Use sturdy two-point drywall anchors or picture hooks suitable for canvas weight.
      </p>
    </div>

    <div style="text-align: center; margin: 26px 0 10px 0;">
      <a href="${orderUrl}" style="display: inline-block; background-color: #9a5d19; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 24px; font-weight: 700; font-size: 13px;">
        Leave Artwork Review / View Details →
      </a>
    </div>
  `;

  const html = renderEmailShell({
    preheader: `Your ArtCanvas order #AC-${orderNumber} has been delivered!`,
    badgeText: "🖼️ Delivered & Complete",
    badgeBg: "#eaf6ec",
    badgeColor: "#1f7a4d",
    heading: "Your artwork has arrived!",
    subheading: `We hope your new canvas brings life and inspiration to your space, ${order.customer.name}.`,
    contentHtml
  });

  const text = [
    `ARTCANVAS — Order Delivered: #AC-${orderNumber}`,
    `Your artwork has arrived! We hope it brings inspiration to your home.`,
    ``,
    `Items delivered:`,
    ...order.items.map(i => `- ${i.title} (${i.size || "Standard"}) x${i.quantity}`),
    ``,
    `View order details or share a review: ${orderUrl}`,
    `ArtCanvas Studio • support@artcanvas.com`
  ].join("\n");

  return {
    subject: "Your ArtCanvas artwork has been delivered! 🖼️",
    html,
    text
  };
}

// -----------------------------------------------------------------------------
// 4. Status Update / Cancellation / Refund Template
// -----------------------------------------------------------------------------

export function buildOrderStatusEmail(
  order: EmailOrderData,
  newStatus: OrderStatus,
  customMessage?: string
) {
  const orderIdStr = String(order._id || "");
  const orderNumber = orderIdStr ? orderIdStr.slice(-8).toUpperCase() : "AC-" + Date.now().toString().slice(-6);
  const siteUrl = getSiteUrl();
  const orderUrl = orderIdStr ? `${siteUrl}/order-confirmation/${orderIdStr}` : `${siteUrl}/account/orders`;

  const statusTitles: Record<string, { badge: string; heading: string; desc: string; color: string; bg: string }> = {
    processing: {
      badge: "In Progress",
      heading: "Your order is being processed",
      desc: "Our artists are currently preparing and inspecting your artwork canvases.",
      color: "#8a6a3b",
      bg: "#f8f3ec"
    },
    packed: {
      badge: "Packed & Ready",
      heading: "Artwork packaged for transit",
      desc: "Your canvas has been securely packed with wooden protective framing and is queued for courier collection.",
      color: "#5a4fcf",
      bg: "#f3f2fc"
    },
    cancelled: {
      badge: "Order Cancelled",
      heading: "Your order has been cancelled",
      desc: "Order #AC-" + orderNumber + " has been cancelled. If any payment was captured, a full refund has been initiated.",
      color: "#c0392b",
      bg: "#fdedec"
    },
    refunded: {
      badge: "Refund Processed",
      heading: "Refund issued for your order",
      desc: "A refund has been successfully processed for your ArtCanvas purchase.",
      color: "#d35400",
      bg: "#fdf2e9"
    }
  };

  const currentMeta = statusTitles[newStatus] || {
    badge: newStatus.toUpperCase(),
    heading: `Order Status Updated: ${newStatus}`,
    desc: `Your ArtCanvas order #AC-${orderNumber} status has updated to ${newStatus}.`,
    color: "#9a5d19",
    bg: "#faf7f2"
  };

  const contentHtml = `
    ${order.refund ? `
    <div style="background-color: #faf5ed; border: 1px solid #ebd9c5; border-radius: 12px; padding: 16px; margin-bottom: 22px;">
      <p style="margin: 0 0 5px 0; font-size: 13px; color: #776e65;"><strong>Refund ID:</strong> <span style="font-family: monospace; color: #1a1614;">${order.refund.id}</span></p>
      <p style="margin: 0 0 5px 0; font-size: 13px; color: #776e65;"><strong>Amount Refunded:</strong> <span style="color: #9a5d19; font-weight: bold;">${formatINR(order.refund.amount)}</span></p>
      ${order.refund.note ? `<p style="margin: 0; font-size: 13px; color: #776e65;"><strong>Note:</strong> ${order.refund.note}</p>` : ""}
    </div>` : ""}

    ${customMessage ? `
    <div style="background-color: #f7f4ee; border-left: 4px solid #9a5d19; padding: 12px 16px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 13px; color: #333;">${customMessage}</p>
    </div>` : ""}

    ${renderItemsTableHtml(order.items)}

    <div style="text-align: center; margin: 24px 0 10px 0;">
      <a href="${orderUrl}" style="display: inline-block; background-color: #9a5d19; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 24px; font-weight: 700; font-size: 13px;">
        View Order Status Online →
      </a>
    </div>
  `;

  const html = renderEmailShell({
    preheader: `Update regarding ArtCanvas order #AC-${orderNumber}: ${newStatus}`,
    badgeText: currentMeta.badge,
    badgeBg: currentMeta.bg,
    badgeColor: currentMeta.color,
    heading: currentMeta.heading,
    subheading: currentMeta.desc,
    contentHtml
  });

  const text = [
    `ARTCANVAS — Order Update: #AC-${orderNumber}`,
    `Status: ${newStatus}`,
    customMessage ? `Note: ${customMessage}` : "",
    order.refund ? `Refund Amount: ${formatINR(order.refund.amount)} (ID: ${order.refund.id})` : "",
    ``,
    `View online: ${orderUrl}`,
    `ArtCanvas Studio • support@artcanvas.com`
  ].filter(Boolean).join("\n");

  return {
    subject: `Update on your ArtCanvas order #${orderNumber}`,
    html,
    text
  };
}

// -----------------------------------------------------------------------------
// Idempotent Notification Dispatcher with MongoDB Auditing
// -----------------------------------------------------------------------------

export interface DispatchNotificationOptions {
  orderId: string | ObjectId;
  type: NotificationType;
  targetStatus: OrderStatus;
  idempotencyKey?: string;
  forceResend?: boolean;
  shippingData?: ShippingNotificationData;
  refundData?: RefundNotificationData;
  customMessage?: string;
}

export async function sendAndRecordOrderNotification(
  options: DispatchNotificationOptions
): Promise<{ ok: boolean; alreadySent: boolean; messageId?: string; error?: string }> {
  try {
    const db = await getDb();
    const orderDoc = await db.collection("orders").findOne({ _id: new ObjectId(String(options.orderId)) });

    if (!orderDoc) {
      return { ok: false, alreadySent: false, error: "Order not found" };
    }

    // 1. Resolve recipient email strictly from order's customer email
    let resolvedEmail = orderDoc.customer?.email?.trim().toLowerCase();
    if (!resolvedEmail && orderDoc.userId) {
      try {
        const userDoc = await db.collection("users").findOne({ _id: new ObjectId(String(orderDoc.userId)) });
        if (userDoc?.email) {
          resolvedEmail = String(userDoc.email).trim().toLowerCase();
        }
      } catch (userErr) {
        console.error("[USER_RESOLVE_WARN]", userErr);
      }
    }
    if (!resolvedEmail && orderDoc.userEmail) {
      resolvedEmail = String(orderDoc.userEmail).trim().toLowerCase();
    }

    if (!resolvedEmail) {
      return { ok: false, alreadySent: false, error: "No recipient email address on order record." };
    }

    // 2. Compute idempotency key
    const idempotencyKey =
      options.idempotencyKey ||
      (options.type === "payment_confirmed"
        ? `payment:${orderDoc.paymentId || orderDoc.razorpayOrderId || String(orderDoc._id)}`
        : options.type === "order_shipped"
        ? `shipped:${String(orderDoc._id)}:${options.shippingData?.trackingNumber || orderDoc.trackingNumber || "v1"}`
        : options.type === "order_refunded"
        ? `refund:${String(orderDoc._id)}:${options.refundData?.id || orderDoc.refund?.id || "v1"}`
        : `status:${String(orderDoc._id)}:${options.targetStatus}`);

    // 3. Idempotency check: Do not re-send if already succeeded unless forced
    const existingNotifications: OrderNotificationRecord[] = orderDoc.notifications || [];
    const alreadyDispatched = existingNotifications.some(
      n => n.idempotencyKey === idempotencyKey && n.success
    );

    if (alreadyDispatched && !options.forceResend) {
      console.log(`[NOTIFICATION_IDEMPOTENT] Duplicate skipped: ${idempotencyKey} for ${resolvedEmail}`);
      return { ok: true, alreadySent: true, messageId: "already-sent" };
    }

    // 4. Build email payload
    const orderData: EmailOrderData = {
      ...orderDoc,
      _id: String(orderDoc._id),
      accountEmail: resolvedEmail,
      guestEmail: orderDoc.customer?.email,
      items: orderDoc.items || [],
      customer: orderDoc.customer,
      total: orderDoc.total,
      subtotal: orderDoc.subtotal,
      shipping: orderDoc.shipping,
      shippingCarrier: options.shippingData?.shippingCarrier || orderDoc.shippingCarrier,
      trackingNumber: options.shippingData?.trackingNumber || orderDoc.trackingNumber,
      trackingUrl: options.shippingData?.trackingUrl || orderDoc.trackingUrl,
      estimatedDelivery: options.shippingData?.estimatedDelivery || orderDoc.estimatedDelivery,
      customerMessage: options.shippingData?.customerMessage || options.customMessage,
      refund: options.refundData || orderDoc.refund
    };

    let builtEmail: { subject: string; html: string; text: string };

    if (options.type === "payment_confirmed") {
      builtEmail = buildPaymentConfirmationEmail(orderData);
    } else if (options.type === "order_shipped") {
      builtEmail = buildOrderShippedEmail(orderData, options.shippingData || {});
    } else if (options.type === "order_delivered") {
      builtEmail = buildOrderDeliveredEmail(orderData);
    } else {
      builtEmail = buildOrderStatusEmail(orderData, options.targetStatus, options.customMessage);
    }

    // 5. Send via universal email sender
    const sendResult = await sendEmail({
      to: resolvedEmail,
      subject: builtEmail.subject,
      html: builtEmail.html,
      text: builtEmail.text
    });

    // 6. Record notification attempt in MongoDB order document
    const record: OrderNotificationRecord = {
      type: options.type,
      status: options.targetStatus,
      recipient: resolvedEmail,
      sentAt: new Date(),
      provider: sendResult.provider,
      messageId: sendResult.messageId,
      success: sendResult.ok,
      error: sendResult.error,
      idempotencyKey
    };

    await db.collection("orders").updateOne(
      { _id: new ObjectId(String(orderDoc._id)) },
      {
        $push: { notifications: record as unknown as never },
        $set: {
          latestNotification: {
            type: options.type,
            sentAt: new Date(),
            success: sendResult.ok,
            error: sendResult.error,
            recipient: resolvedEmail
          },
          updatedAt: new Date()
        }
      }
    );

    return {
      ok: sendResult.ok,
      alreadySent: false,
      messageId: sendResult.messageId,
      error: sendResult.error
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected notification error";
    console.error("[NOTIFICATION_DISPATCH_EXCEPTION]", errorMsg);
    return { ok: false, alreadySent: false, error: errorMsg };
  }
}

// Backward-compatibility export
export async function sendOrderConfirmationEmail(order: EmailOrderData) {
  return sendAndRecordOrderNotification({
    orderId: String(order._id || ""),
    type: "payment_confirmed",
    targetStatus: "paid"
  });
}
