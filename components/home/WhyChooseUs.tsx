import { ShieldCheck, Palette, PackageCheck, CreditCard } from "lucide-react";

const PROMISES = [
  {
    num: "01",
    title: "Original Quality",
    desc: "Hand-painted pieces are one-of-a-kind works created with real pigment and texture, never mass-produced prints.",
    icon: Palette,
  },
  {
    num: "02",
    title: "Museum Materials",
    desc: "Archival-grade canvases, fade-resistant European inks, and solid pine wood frames built to endure.",
    icon: ShieldCheck,
  },
  {
    num: "03",
    title: "Careful Delivery",
    desc: "Every canvas is protected with rigid corner guards and 5-layer bubble casing for 100% insured courier transit.",
    icon: PackageCheck,
  },
  {
    num: "04",
    title: "Secure Checkout",
    desc: "PCI-DSS compliant encrypted transactions powered by Razorpay with instant order confirmation.",
    icon: CreditCard,
  },
];

export function WhyChooseUs() {
  return (
    <section className="bg-[#efe9df] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-[#9a5d19]">
            The ArtCanvas Promise
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl text-neutral-900">
            Made for spaces that matter
          </h2>
          <p className="mt-3 text-sm text-neutral-600">
            Thoughtful curation, authentic craftsmanship, and meticulous packaging from our studio to your wall.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.num}
                className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#9a5d19]">{item.num}</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f6f1ea] text-[#9a5d19]">
                    <Icon size={18} />
                  </div>
                </div>
                <h3 className="mt-5 font-serif text-xl font-bold text-neutral-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-black/60">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
