import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getTransporter } from "@/lib/email";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(3000),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const result = contactSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid submission", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, phone, subject, message } = result.data;
    const db = await getDb();
    const now = new Date();

    const doc = {
      name,
      email,
      phone: phone || null,
      subject,
      message,
      status: "new",
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await db.collection("inquiries").insertOne(doc);

    // If an SMTP transporter is configured, send an alert to store admin
    try {
      const transporter = getTransporter();
      const adminEmail = process.env.ADMIN_EMAIL || process.env.STORE_EMAIL;
      const storeEmail = process.env.STORE_EMAIL || "orders@artcanvas.com";

      if (transporter && adminEmail) {
        await transporter.sendMail({
          from: storeEmail,
          to: adminEmail,
          replyTo: email,
          subject: `[New Inquiry] ${subject} — ${name}`,
          html: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #222;">
              <h2>New Studio Inquiry</h2>
              <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
              ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
              <p><strong>Subject:</strong> ${subject}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error("[CONTACT_EMAIL_NOTIFICATION_ERROR]", emailErr);
    }

    return NextResponse.json(
      { ok: true, id: String(insertResult.insertedId) },
      { status: 201 }
    );
  } catch (error) {
    console.error("[CONTACT_INQUIRY_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry. Please try again later." },
      { status: 500 }
    );
  }
}
