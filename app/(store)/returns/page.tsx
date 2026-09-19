import { RotateCcw, ShieldCheck, HelpCircle, FileCheck2 } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Return & Replacement Policy | ArtCanvas",
  description: "Our 7-day transit damage replacement guarantee and return policy.",
};

export default function ReturnsPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-neutral-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-[#9a5d19]">Our Promise</p>
        <h1 className="mt-2 font-serif text-3xl font-bold sm:text-5xl">Returns & Replacements</h1>
        <p className="mt-3 text-neutral-600 text-sm sm:text-base leading-relaxed">
          We want your living spaces to glow with artwork you truly love. In the rare instance an artwork arrives damaged, defective, or incorrect, we provide a seamless 100% free replacement.
        </p>
      </div>

      <div className="mt-10 space-y-10 text-neutral-700 leading-relaxed text-sm sm:text-base">
        {/* Policy Overview Grid */}
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
            <RotateCcw className="text-[#9a5d19] mb-3" size={24} />
            <h3 className="font-serif text-base font-bold text-neutral-900">7-Day Guarantee</h3>
            <p className="mt-1 text-xs text-neutral-500">Report transit defects or damage within 7 days of delivery.</p>
          </div>
          <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
            <ShieldCheck className="text-emerald-700 mb-3" size={24} />
            <h3 className="font-serif text-base font-bold text-neutral-900">Zero-Cost Replacement</h3>
            <p className="mt-1 text-xs text-neutral-500">Free courier pickup and expedited replacement shipment.</p>
          </div>
          <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
            <FileCheck2 className="text-[#9a5d19] mb-3" size={24} />
            <h3 className="font-serif text-base font-bold text-neutral-900">Unboxing Verification</h3>
            <p className="mt-1 text-xs text-neutral-500">Quick video helps process instant courier insurance claims.</p>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold text-neutral-900 mb-3">1. Damaged in Transit or Manufacturing Defect</h2>
          <p>
            If your artwork arrives with a torn canvas, broken wooden frame, chipped glass/acrylic, or manufacturing print flaw:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5 text-neutral-600">
            <li>Notify us within <strong>7 calendar days</strong> of parcel receipt.</li>
            <li>Send photos or an unboxing video showing the damage to <a href="mailto:support@artcanvas.com" className="text-[#9a5d19] font-semibold underline">support@artcanvas.com</a> along with your Order ID (#AC-...).</li>
            <li>Our team will dispatch a brand-new replacement at zero additional charge and schedule a reverse courier pickup for the damaged unit.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold text-neutral-900 mb-3">2. Original Hand-Painted & Custom Commissioned Works</h2>
          <p>
            Because original hand-painted canvases and personalized custom artwork are crafted uniquely to order and cannot be resold, they are <strong>eligible for full replacement or repair if damaged in transit</strong>, but are non-returnable for change-of-mind. We share high-definition studio photos and video previews before dispatching original commissions to ensure complete satisfaction.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold text-neutral-900 mb-3">3. How to Initiate a Claim</h2>
          <ol className="list-decimal pl-5 mt-3 space-y-2 text-neutral-600">
            <li>Take 2–3 clear photographs of the package label, outer box, and the affected area of the canvas or frame.</li>
            <li>Reach our support desk at <a href="mailto:support@artcanvas.com" className="font-semibold underline text-[#9a5d19]">support@artcanvas.com</a> or WhatsApp us at <strong>+91 98765 43210</strong>.</li>
            <li>Upon validation (usually within 12 business hours), we trigger an immediate priority replacement order.</li>
          </ol>
        </div>

        <div className="rounded-3xl border border-black/8 bg-[#fdfbf9] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-neutral-900 flex items-center gap-2">
              <HelpCircle size={18} className="text-[#9a5d19]" />
              Need Help With an Existing Order?
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-neutral-600">
              Our studio care team is available Monday through Saturday to address any concerns.
            </p>
          </div>
          <Link
            href="/contact"
            className="shrink-0 rounded-full bg-[#9a5d19] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#834e15] transition"
          >
            Contact Studio Support
          </Link>
        </div>
      </div>
    </section>
  );
}
