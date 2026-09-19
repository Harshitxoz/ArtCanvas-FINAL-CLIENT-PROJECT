export const metadata = {
  title: "Privacy Policy | ArtCanvas",
  description: "Learn how ArtCanvas collects, protects, and handles your personal information.",
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-neutral-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-[#9a5d19]">Security & Trust</p>
        <h1 className="mt-2 font-serif text-3xl font-bold sm:text-5xl">Privacy Policy</h1>
        <p className="mt-3 text-neutral-600 text-sm sm:text-base leading-relaxed">
          At ArtCanvas, we take your privacy and financial security with extreme seriousness. This policy outlines how your information is collected, processed, and safeguarded.
        </p>
      </div>

      <div className="mt-10 space-y-8 text-neutral-700 leading-relaxed text-sm sm:text-base">
        <div>
          <h2 className="font-serif text-xl font-bold text-neutral-900 mb-3">1. Information We Collect</h2>
          <p>
            When you browse our gallery, create an account, place an artwork order, or commission custom work, we collect:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-1.5 text-neutral-600">
            <li><strong>Contact & Shipping Data:</strong> Your name, delivery address, phone number, and email address for order fulfillment and logistics tracking.</li>
            <li><strong>Order History:</strong> Details of purchased artwork, custom dimensions, framing preferences, and coupon usage.</li>
            <li><strong>Device & Browsing Data:</strong> Anonymized cookies and session identifiers to remember your cart, wishlist, and currency preferences.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold text-neutral-900 mb-3">2. Payment Security & PCI-DSS Compliance</h2>
          <p>
            <strong>We do not store, process, or view your debit/credit card details, CVV, or banking passwords on our servers.</strong> All payments are securely tokenized and handled through <strong>Razorpay</strong>, which is certified under the highest level of payment industry security (PCI-DSS Level 1 compliant). All communication is encrypted via 256-bit SSL encryption.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold text-neutral-900 mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
            <li>To manufacture, package, and deliver your canvas orders to your doorstep.</li>
            <li>To dispatch transactional updates (order confirmation emails, dispatch notices, and tracking numbers).</li>
            <li>To provide personalized customer support and resolve custom sizing inquiries.</li>
            <li>We do not sell, rent, or trade your personal data to any third-party marketing brokers.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold text-neutral-900 mb-3">4. Third-Party Service Providers</h2>
          <p>
            We only share minimal necessary information with trusted operational partners:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-neutral-600">
            <li><strong>Logistics Partners:</strong> BlueDart, Delhivery, DTDC (only name, delivery address, and phone number for delivery coordination).</li>
            <li><strong>Cloud Infrastructure:</strong> Secure cloud databases and Cloudinary for optimized artwork imagery.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-xl font-bold text-neutral-900 mb-3">5. Your Rights & Data Deletion</h2>
          <p>
            You have the right to access, update, or request deletion of your account and personal details at any time. Simply email our data privacy officer at <a href="mailto:support@artcanvas.com" className="text-[#9a5d19] font-semibold underline">support@artcanvas.com</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
