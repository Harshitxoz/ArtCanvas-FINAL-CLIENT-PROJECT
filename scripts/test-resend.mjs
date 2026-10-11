import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = resolve(process.cwd(), file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx > 0) {
          const key = trimmed.slice(0, idx).trim();
          const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }
}

loadEnv();

const hasApiKey = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0);
const hasEmailFrom = Boolean(process.env.EMAIL_FROM && process.env.EMAIL_FROM.trim().length > 0);
const recipient = process.argv[2] || process.env.ADMIN_EMAIL || "";

console.log("=== RESEND CONFIGURATION CHECK ===");
console.log(`RESEND_API_KEY configured: ${hasApiKey ? "YES (" + process.env.RESEND_API_KEY.trim().substring(0, 3) + "..." + ")" : "NO"}`);
console.log(`EMAIL_FROM configured: ${hasEmailFrom ? "YES (" + process.env.EMAIL_FROM.trim() + ")" : "NO"}`);
console.log(`Target Test Recipient: ${recipient || "(none specified)"}`);

if (!hasApiKey) {
  console.error("\n❌ RESEND_API_KEY is not configured in .env or .env.local.");
  process.exit(1);
}

if (!recipient) {
  console.error("\n❌ No recipient email specified.");
  process.exit(1);
}

async function sendTest() {
  const apiKey = process.env.RESEND_API_KEY.trim();
  const from = process.env.EMAIL_FROM ? process.env.EMAIL_FROM.trim() : "ArtCanvas Studio <onboarding@resend.dev>";
  
  console.log(`\nAttempting to send test email via Resend API to: ${recipient}...`);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject: "ArtCanvas Resend Integration Test 🎨",
        html: `
          <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #faf7f2; border: 1px solid #ebe4d8; border-radius: 16px; overflow: hidden;">
            <div style="background: #1a1614; padding: 24px; text-align: center;">
              <h1 style="color: #d4a373; margin: 0; font-size: 22px; letter-spacing: 2px;">ARTCANVAS</h1>
              <p style="color: #cfc8c0; margin: 6px 0 0; font-size: 12px; letter-spacing: 1px;">Fine Art & Canvas Prints</p>
            </div>
            <div style="padding: 28px; background: #ffffff;">
              <h2 style="color: #1a1614; margin-top: 0; font-size: 20px;">Resend Integration Verification Successful!</h2>
              <p style="color: #555; line-height: 1.6; font-size: 14px;">
                This test confirms that your ArtCanvas project is successfully connected to Resend. All customer transactional emails—including order confirmations, payment receipts, courier dispatches, and delivery updates—will be reliably routed through Resend.
              </p>
              <div style="background: #faf7f2; border: 1px solid #ebd9c5; border-radius: 10px; padding: 14px; margin: 20px 0; font-size: 13px;">
                <p style="margin: 0 0 6px 0;"><strong>Status:</strong> <span style="color: #1f7a4d; font-weight: bold;">Verified & Active</span></p>
                <p style="margin: 0;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              </div>
            </div>
            <div style="background: #f7f3ec; padding: 16px; text-align: center; font-size: 12px; color: #7a7267;">
              ArtCanvas Studio • Transactional Email Engine
            </div>
          </div>
        `,
        text: `ArtCanvas Resend Integration Test\n\nVerification Successful! Your ArtCanvas transactional email engine is connected to Resend.\nTimestamp: ${new Date().toISOString()}`
      })
    });

    const data = await res.json().catch(() => ({}));

    console.log(`HTTP Status: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      console.error("\n❌ Resend API Error Response:");
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log("\n✅ Resend API Response:");
    console.log(`- Email ID: ${data.id}`);
    console.log(`- Recipient: ${recipient}`);
    console.log("- Status: Dispatched successfully by Resend!");

    // Query Resend for email status
    console.log("\nWaiting 2 seconds to check delivery status from Resend API...");
    await new Promise(r => setTimeout(r, 2000));
    try {
      const getRes = await fetch(`https://api.resend.com/emails/${data.id}`, {
        headers: { "Authorization": `Bearer ${apiKey}` }
      });
      const emailDetail = await getRes.json();
      console.log("Resend Provider Log & Delivery Record (Raw):", JSON.stringify(emailDetail, null, 2));
    } catch (checkErr) {
      console.log("Could not query individual email status:", checkErr.message);
    }
  } catch (err) {
    console.error("❌ Exception during send:", err.message);
    process.exit(1);
  }
}

sendTest();
