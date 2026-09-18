import Image from "next/image";
import Link from "next/link";
import { Brush, Fingerprint, Heart } from "lucide-react";

const points = [
  {
    icon: Fingerprint,
    title: "Original Artwork",
    text: "Created as one-of-a-kind pieces.",
  },
  {
    icon: Brush,
    title: "Hand-Finished",
    text: "Every detail carries the artist's touch.",
  },
  {
    icon: Heart,
    title: "Made With Intention",
    text: "Painted to bring character and meaning to your space.",
  },
];

export function HandPaintedStory() {
  return (
    <section
      aria-labelledby="hand-painted-story"
      className="bg-[#f4efe7] py-14 sm:py-20"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[45fr_55fr] lg:gap-14 lg:px-8">
        <div className="relative overflow-hidden rounded-[22px] shadow-[0_24px_60px_-24px_rgba(23,19,15,0.45)]">
          <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/5]">
            <Image
              src="/images/true-craftsmanship.png"
              alt="Artist's studio with an original hand-painted canvas resting on a wooden easel in warm natural light"
              fill
              sizes="(max-width: 1023px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#17130f]/15 via-transparent to-transparent"
          />
        </div>

        <div>
          <p
            aria-hidden="true"
            className="h-px w-12 bg-[#c99a4b]"
          />
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.3em] text-[#a96218] sm:text-xs">
            Our Craft
          </p>
          <h2
            id="hand-painted-story"
            className="mt-3 font-serif text-4xl leading-tight text-[#17130f] sm:text-5xl"
          >
            The Story Behind Every Painting
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-8 text-[#2e2924]/80 sm:text-base">
            Art isn&apos;t just decoration. Each original begins with an idea, a
            canvas and countless careful brushstrokes. We believe the beauty of
            a painting comes from the human touch behind it.
          </p>

          <ul className="mt-8 grid gap-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {points.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#c99a4b]/40 bg-white text-[#a96218]"
                >
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-[#17130f]">
                    {title}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-[#2e2924]/70">
                    {text}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-9">
            <Link
              href="/hand-painted#hand-painted-collection"
              className="inline-flex items-center gap-2 rounded-full bg-[#e8bb7a] px-7 py-3 text-sm font-semibold text-[#17130f] shadow-md transition outline-none hover:bg-[#a96218] hover:text-white focus-visible:ring-2 focus-visible:ring-[#a96218] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4efe7]"
            >
              Explore Originals
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
