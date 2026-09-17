import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Brush, HandHeart, Mountain, Palette } from "lucide-react";

const cards = [
  {
    title: "Real Materials",
    text: "Paint, natural canvas and real tools give every piece authentic texture you can see and feel.",
    image: "/images/real-materials.png",
    icon: Palette,
  },
  {
    title: "True Craftsmanship",
    text: "Each brushstroke is guided by a steady hand and years of patient practice.",
    image: "/images/true-craftsmanship.png",
    icon: Brush,
  },
  {
    title: "Timeless Creations",
    text: "Landscapes and compositions made to feel calm, considered and lasting in your space.",
    image: "/images/timeless-creations.png",
    icon: Mountain,
  },
  {
    title: "Supporting Artists",
    text: "Every original purchase helps independent creative talent keep doing what they love.",
    image: "/images/supporting-artists.png",
    icon: HandHeart,
  },
];

type FeatureCardData = (typeof cards)[number];

function FeatureCard({ card }: { card: FeatureCardData }) {
  const Icon = card.icon;
  return (
    <Link
      href="#hand-painted-collection"
      className="group relative block h-[240px] min-w-0 overflow-hidden rounded-[20px] bg-[#17130f] text-white transition duration-500 outline-none focus-visible:ring-2 focus-visible:ring-[#e8bb7a] focus-visible:ring-offset-2 motion-safe:group-hover:-translate-y-1 md:h-[280px] lg:h-[300px]"
    >
      {/* Real PNG photo covers the full card — z-0 */}
      <Image
        src={card.image}
        alt={card.title}
        fill
        sizes="(max-width: 767px) 86vw, (max-width: 1023px) 50vw, 25vw"
        className="z-0 object-cover transition duration-700 motion-safe:group-hover:scale-105"
      />

      {/* Readability gradient over the photo — z-10 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/35 to-transparent"
      />

      {/* Small icon badge — top left */}
      <div
        className="absolute left-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-black/30 text-[#e8bb7a] backdrop-blur-sm"
        aria-hidden="true"
      >
        <Icon size={18} />
      </div>

      {/* Content — bottom left, kept inside this card */}
      <div className="absolute inset-0 z-20 flex min-w-0 flex-col justify-end p-5 pr-16 sm:p-6 sm:pr-16">
        <h3 className="font-serif text-2xl text-white">{card.title}</h3>
        <p className="mt-2 max-w-[90%] break-words text-sm leading-6 text-white/80">
          {card.text}
        </p>
      </div>

      {/* Circular arrow button — bottom right, separate from the text */}
      <div
        className="absolute bottom-4 right-4 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur transition duration-300 motion-safe:group-hover:bg-[#e8bb7a] motion-safe:group-hover:text-[#17130f] motion-safe:group-hover:translate-x-0.5"
        aria-hidden="true"
      >
        <ArrowUpRight size={18} />
      </div>
    </Link>
  );
}

export function HandPaintedFeatures() {
  return (
    <section className="overflow-x-clip bg-[#f4efe7] py-10 sm:py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Mobile: horizontal snap carousel — one card at a time */}
        <div
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:hidden"
          role="region"
          aria-label="How we work — swipe for more cards"
        >
          {cards.map((card) => (
            <div key={card.title} className="w-[86%] shrink-0 snap-center">
              <FeatureCard card={card} />
            </div>
          ))}
        </div>

        {/* Tablet: 2 columns · Desktop: 4 equal cards across the full width */}
        <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {cards.map((card) => (
            <FeatureCard key={card.title} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}