import nodemailer from "nodemailer";
import { formatINR } from "@/lib/utils";

interface EmailOrderItem {
  title: string;
  size?: string;
  frame?: string;
  quantity: number;
  price: number;
}

interface EmailOrderData {
  _id?: string | { toString(): string };
  paymentId?: string;
  razorpayOrderId?: string;
  total: number;
  subtotal: number;
  shipping: number;
  discount?: number;
  couponCode?: string;
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
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

export async function sendOrderConfirmationEmail(order: EmailOrderData) {
  try {
    const orderNumber = String(order._id).slice(-8).toUpperCase();
    const postal = order.customer.postalCode || order.customer.pincode || "";
    const fullAddress = `${order.customer.address}, ${order.customer.city}, ${order.customer.state} ${postal}`.trim();
    const storeEmail = process.env.SMTP_FROM || process.env.STORE_EMAIL || "ArtCanvas <orders@artcanvas.com>";
    const adminEmail = process.env.ADMIN_EMAIL;

    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #eee;">
            <strong style="color: #222;">${item.title}</strong>
            <br>
            <span style="color: #777; font-size: 12px;">Size: ${item.size || "Standard"} ${item.frame === "framed" ? "• Framed" : "• Unframed"}</span>
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center; color: #555;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; color: #222; font-weight: 600;">
            ${formatINR(item.price * item.quantity)}
          </td>
        </tr>
      `
      )
      .join("");

    const customerHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e0d8; border-radius: 16px; overflow: hidden;">
        <div style="background: #201a16; padding: 28px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px; color: #d4a373;">ARTCANVAS</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #cfc8c0;">Order Confirmed & Payment Received</p>
        </div>

        <div style="padding: 28px 24px;">
          <h2 style="font-size: 20px; color: #222; margin-top: 0;">Thank you for your order, ${order.customer.name}!</h2>
          <p style="color: #555; line-height: 1.6; font-size: 14px;">
            We have received your payment and our studio artists are preparing your canvas with utmost care. You will receive tracking details as soon as your shipment is dispatched.
          </p>

          <div style="background: #fdfaf6; border: 1px solid #fae8d4; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #777;"><strong>Order Number:</strong> #${orderNumber}</p>
            ${order.paymentId ? `<p style="margin: 0 0 8px 0; font-size: 13px; color: #777;"><strong>Payment ID:</strong> ${order.paymentId}</p>` : ""}
            <p style="margin: 0; font-size: 13px; color: #777;"><strong>Delivery Address:</strong> ${fullAddress}</p>
          </div>

          <h3 style="font-size: 16px; color: #222; margin: 24px 0 12px 0;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: #f5f3ef; text-align: left; font-size: 12px; color: #666; text-transform: uppercase;">
                <th style="padding: 10px 8px;">Artwork</th>
                <th style="padding: 10px 8px; text-align: center;">Qty</th>
                <th style="padding: 10px 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 20px; padding-top: 12px; border-top: 2px solid #eee; font-size: 14px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #555;">
              <span>Subtotal:</span>
              <span>${formatINR(order.subtotal)}</span>
            </div>
            ${order.discount ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #1f7a4d;">
              <span>Discount ${order.couponCode ? `(${order.couponCode})` : ""}:</span>
              <span>-${formatINR(order.discount)}</span>
            </div>` : ""}
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #555;">
              <span>Shipping:</span>
              <span>${order.shipping > 0 ? formatINR(order.shipping) : "FREE"}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 16px; font-weight: bold; color: #222;">
              <span>Total Paid:</span>
              <span>${formatINR(order.total)}</span>
            </div>
          </div>

          <div style="margin-top: 32px; padding: 16px; background: #f9f8f6; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 13px; color: #777;">
              Need help with your order? Reply directly to this email or reach us at <a href="mailto:support@artcanvas.com" style="color: #9a5d19; text-decoration: none;">support@artcanvas.com</a>.
            </p>
          </div>
        </div>

        <div style="background: #f5f3ef; padding: 16px; text-align: center; font-size: 12px; color: #888;">
          ArtCanvas Studio • Fine Art & Canvas Prints
        </div>
      </div>
    `;

    const transporter = getTransporter();

    if (!transporter) {
      console.log(`[EMAIL_NOTICE] SMTP not configured. Customer confirmation email for order #${orderNumber} (${order.customer.email}) logged successfully.`);
      return { ok: true, mocked: true };
    }

    // Send customer receipt
    await transporter.sendMail({
      from: storeEmail,
      to: order.customer.email,
      subject: `Order Confirmed: #${orderNumber} — ArtCanvas`,
      html: customerHtml
    });

    // Send admin new-order alert if configured
    if (adminEmail) {
      await transporter.sendMail({
        from: storeEmail,
        to: adminEmail,
        subject: `[New Order Alert] #${orderNumber} — ₹${order.total} by ${order.customer.name}`,
        html: `
          <h3>New Paid Order Placed!</h3>
          <p><strong>Order ID:</strong> #${orderNumber}</p>
          <p><strong>Customer:</strong> ${order.customer.name} (${order.customer.phone}, ${order.customer.email})</p>
          <p><strong>Total:</strong> ${formatINR(order.total)}</p>
          <p><strong>Items:</strong> ${order.items.length} artwork(s)</p>
          <p><strong>Address:</strong> ${fullAddress}</p>
          <p>Check the admin dashboard to manage fulfillment and update shipping details.</p>
        `
      });
    }

    return { ok: true };
  } catch (error) {
    console.error("[EMAIL_DISPATCH_ERROR]", error);
    // Never throw error so checkout verification is not impacted
    return { ok: false, error };
  }
}
