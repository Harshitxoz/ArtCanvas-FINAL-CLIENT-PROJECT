export const metadata = {
  title: "Terms & Conditions | ArtCanvas",
  description: "Terms and conditions governing the purchase of fine art and canvas prints on ArtCanvas.",
};

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-neutral-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-[#9a5d19]">Commercial Agreement</p>
        <h1 className="mt-2 font-serif text-3xl font-bold sm:text-5xl">Terms & Conditions</h1>
        <p className="mt-3 text-neutral-600 text-sm sm:text-base leading-relaxed">
          Welcome to ArtCanvas. By browsing our website, commissioning artwork, or placing an order, you agree to comply with and be bound by the following terms.
        </p>
      </div>

      <div className="mt-10 space-y-8 text-neutral-700 leading-relaxed text-sm sm:text-base">
        <div>
          <h2 className="font-serif text-xl font-bold text-neutral-900 mb-3">1. Artwork Accuracy & Handcrafted Nuances</h2>
          <p>
            We strive to display colors and textures with absolute fidelity. However, please note that color rendition can vary across calibrated display screens. For <strong>Hand-Painted Originals</strong>, subtle brush stroke variations, texture impasto, and paint layer depth are inherent hallmarks of genuine human craftsmanship and make each piece unique.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold text-neutral-900 mb-3">2. Pricing, Taxes & Payment Terms</h2>
          <p>
            All prices listed on the website are in Indian Rupees (INR) and inclusive of all applicable goods and services taxes (GST). We reserve the right to modify prices or discontinue items without prior notice. In the event an artwork is mistakenly listed at an incorrect price due to typographical error, ArtCanvas reserves the right to cancel or adjust the order before dispatch, issuing a full immediate refund.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold text-neutral-900 mb-3">3. Order Acceptance & Custom Commissions</h2>
          <p>
            Receipt of an electronic order confirmation does not signify our final acceptance of your order. We reserve the right at any time after receipt of your order to accept or decline it for reasons including inventory exhaustion, unauthorized coupon use, or regional logistics non-serviceability.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold text-neutral-900 mb-3">4. Intellectual Property & Copyright</h2>
          <p>
            All artworks, brand marks, photography, copy, and layout designs published on ArtCanvas are the exclusive intellectual property of ArtCanvas and its licensed artists. Purchasing an artwork confers ownership of the physical piece, but does not transfer copyright or reproduction rights. Artwork may not be copied, reproduced, or used for commercial redistribution without explicit written consent.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold text-neutral-900 mb-3">5. Governing Law & Jurisdiction</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of India. Any disputes arising out of or related to your use of this site or transactions concluded herein shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka.
          </p>
        </div>
      </div>
    </section>
  );
}
