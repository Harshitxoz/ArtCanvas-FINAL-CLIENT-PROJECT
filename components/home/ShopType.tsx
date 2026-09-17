"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Play, Sparkles } from "lucide-react";

const cards = [
  {
    href: "/hand-painted" as const,
    title: "Made by Hand",
    text: "Original artwork with visible brushwork, real texture and the personality of the artist.",
    tag: "Hand-Painted Originals",
    video: "/videos/hand-painted.mp4",
    image: "/images/hero.png",
  },
  {
    href: "/printed-canvas" as const,
    title: "Art for Your Space",
    text: "Premium canvas reproductions designed to make your home feel considered, warm and personal.",
    tag: "Premium Canvas Prints",
    video: "/videos/art-for-your-space.mp4",
    image: "/images/hero.png",
  },
];

export function ShopType() {
  return (
    <section className="bg-[#f4efe7] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#9a5d19]">
              Choose your canvas
            </p>
            <h2 className="mt-2 max-w-xl font-serif text-4xl font-medium sm:text-5xl">
              Two ways to bring art home.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-black/55">
            One story, two experiences — collect an original, or bring the feeling home with a
            premium print.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {cards.map((card) => (
            <Link
              href={card.href}
              key={card.href}
              className="group relative min-h-[500px] overflow-hidden rounded-[2rem] bg-[#17130f] text-white"
            >
              <div className="absolute inset-0">
                <video
                  className="h-full w-full object-cover opacity-70 transition duration-1000 group-hover:scale-105"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={card.image}
                  aria-hidden="true"
                >
                  <source src={card.video} type="video/mp4" />
                </video>
                <Image src={card.image} alt="" fill className="object-cover opacity-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
              </div>

              <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur">
                <Sparkles size={12} className="text-[#e8bb7a]" />
                {card.tag}
              </div>

              <div className="absolute right-6 top-6 grid h-12 w-12 place-items-center rounded-full border border-white/30 bg-white/10 backdrop-blur transition group-hover:bg-[#e8bb7a] group-hover:text-[#17130f]">
                <Play size={18} fill="currentColor" />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <h3 className="font-serif text-4xl font-medium">{card.title}</h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-white/75 sm:text-base">{card.text}</p>
                <span className="mt-6 inline-flex items-center gap-2 font-semibold">
                  Explore collection <ArrowUpRight size={17} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-black/8 bg-white px-5 py-4 text-center text-sm text-black/55">
          <span className="font-semibold text-black">Tip:</span> Add short 8–20 second MP4 loops to
          <code className="mx-1 rounded bg-black/5 px-1.5 py-0.5">public/videos/</code> for the full cinematic experience.
        </div>
      </div>
    </section>
  );
}
