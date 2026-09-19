import { Truck, ShieldCheck, Clock, PackageCheck, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Shipping & Delivery Policy | ArtCanvas",
  description: "Learn about our pan-India delivery timelines, museum-grade packaging, and transit insurance.",
};

export default function ShippingPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-neutral-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-[#9a5d19]">Care & Logistics</p>
        <h1 className="mt-2 font-serif text-3xl font-bold sm:text-5xl">Shipping & Delivery Policy</h1>
        <p className="mt-3 text-neutral-600 text-sm sm:text-base leading-relaxed">
          Every artwork leaving ArtCanvas is treated as an irreplaceable heirloom. We take utmost care in packaging and partner with top-tier courier networks for safe, timely delivery across India.
        </p>
      </div>

      <div className="mt-10 space-y-10 text-neutral-700 leading-relaxed text-sm sm:text-base">
        {/* Key Highlights Grid */}
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
            <Clock className="text-[#9a5d19] mb-3" size={24} />
            <h3 className="font-serif text-base font-bold text-neutral-900">3–7 Business Days</h3>
            <p className="mt-1 text-xs text-neutral-500">Pan-India delivery across metros and tier 1/2 cities.</p>
          </div>
          <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
            <PackageCheck className="text-[#9a5d19] mb-3" size={24} />
            <h3 className="font-serif text-base font-bold text-neutral-900">5-Layer Protective Wrap</h3>
            <p className="mt-1 text-xs text-neutral-500">Rigid corner guards and moisture-barrier casing.</p>
          </div>
          <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
            <ShieldCheck className="text-emerald-700 mb-3" size={24} />
            <h3 className="font-serif text-base font-bold text-neutral-900">100% Transit Insured</h3>
            <p className="mt-1 text-xs text-neutral-500">Full free replacement if damaged during courier transit.</p>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold text-neutral-900 mb-3">1. Order Processing & Fulfillment Timelines</h2>
          <p>
            Because our canvas works involve custom sizing, hand-stretching, and bespoke museum framing:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5 text-neutral-600">
            <li><strong>Printed Canvas:</strong> Dispatched within 24 to 48 hours after payment verification.</li>
            <li><strong>Hand-Painted Originals & Custom Framing:</strong> Dispatched within 2 to 4 business days to allow final varnishing, frame assembly, and quality inspection.</li>
            <li><strong>Transit Duration:</strong> Metro cities typically arrive within 3-4 days; remote & non-metro regions take 5-7 business days.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold text-neutral-900 mb-3">2. Shipping Charges & Free Delivery Threshold</h2>
          <p>
            We offer <strong>Free Standard Insured Shipping</strong> on all orders meeting the store threshold (as announced on the website banner and cart). For orders below the threshold, a flat subsidised handling fee is applied at checkout to cover transit insurance and heavy protective packaging.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold text-neutral-900 mb-3">3. Packaging Standards</h2>
          <p>
            We adhere to international fine art shipping protocols:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5 text-neutral-600">
            <li><strong>Rolled Canvases:</strong> Wrapped in archival glassine paper, rolled over heavy-duty cylinders, and sealed inside impact-resistant rigid PVC tubes.</li>
            <li><strong>Stretched & Framed Artworks:</strong> Fitted with heavy-duty foam corner guards, sealed in waterproof bubble wrap, sandwiched between double-wall corrugated boards, and shipped in reinforced wooden-edge export cartons.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold text-neutral-900 mb-3">4. Courier Partners & Real-Time Tracking</h2>
          <p>
            We partner exclusively with trusted air & express ground logistics providers including <strong>BlueDart, Delhivery, and DTDC</strong>. Once your order leaves our Bengaluru studio, you will receive an email containing your tracking number and live tracking link. You can also monitor the status anytime from your <a href="/account/orders" className="text-[#9a5d19] font-semibold underline">My Orders</a> dashboard.
          </p>
        </div>

        <div className="rounded-2xl bg-amber-50/70 border border-amber-200/60 p-5 flex gap-4 text-xs sm:text-sm text-amber-900">
          <AlertCircle size={24} className="shrink-0 text-amber-700" />
          <div>
            <strong className="font-bold">Inspection on Delivery:</strong>
            <p className="mt-0.5">
              Please inspect the outer package before accepting delivery. If the package appears severely compromised or pierced, please record a quick photo/video and refuse delivery, or notify us immediately at <a href="mailto:support@artcanvas.com" className="underline font-semibold">support@artcanvas.com</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
