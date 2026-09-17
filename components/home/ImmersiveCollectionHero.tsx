"use client";

import Image from "next/image";
import Link from "next/link";
import { Pause, Play, ArrowRight, Sparkles, ShieldCheck, Ruler, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/types";

type Props = {
  type: "hand-painted" | "printed-canvas";
  products?: Product[];
};

const copy = {
  "hand-painted": {
    eyebrow: "Hand-Painted Originals",
    title: "Made by Hand",
    description:
      "Watch texture come alive, one brushstroke at a time. Original paintings created by artists, never mass-produced.",
    cta: "Explore Originals",
    secondary: "Watch the Process",
    video: "/videos/hand-painted.mp4",
    poster: "/images/hero.png",
    features: [
      { icon: Palette, title: "Real Materials", text: "Paint, canvas & texture" },
      { icon: Sparkles, title: "True Craftsmanship", text: "Created by skilled artists" },
      { icon: ShieldCheck, title: "One-of-a-Kind", text: "100% original artwork" },
    ],
  },
  "printed-canvas": {
    eyebrow: "Premium Canvas Prints",
    title: "Art That Belongs in Your Space",
    description:
      "Gallery-inspired prints, made to bring depth, colour and personality to your walls, from calm bedrooms to statement living rooms.",
    cta: "Shop Printed Canvas",
    secondary: "See the Difference",
    video: "/videos/art-for-your-space.mp4",
    poster: "/images/hero.png",
    features: [
      { icon: ShieldCheck, title: "Museum-Grade", text: "Premium print quality" },
      { icon: Ruler, title: "Multiple Sizes", text: "Find your perfect fit" },
      { icon: Sparkles, title: "Fade-Resistant", text: "Built for beautiful walls" },
    ],
  },
} as const;

export function ImmersiveCollectionHero({ type, products = [] }: Props) {
  const c = copy[type];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const promise = video.play();
    if (promise) {
      promise
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  }, []);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video || failed) return;
    try {
      if (video.paused) {
        await video.play();
        setPlaying(true);
      } else {
        video.pause();
        setPlaying(false);
      }
    } catch {
      setPlaying(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#17130f] text-white">
      <div className="absolute inset-0">
        {!failed ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover opacity-80"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={c.poster}
            onError={() => setFailed(true)}
            aria-label={type === "hand-painted" ? "Artist painting a hand-painted artwork" : "Printed canvas artwork styled in a room"}
          >
            <source src={c.video} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={c.poster}
            alt=""
            fill
            priority
            className="object-cover object-center"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#17130f]/95 via-[#17130f]/55 to-[#17130f]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#17130f] via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-end gap-10 px-5 pb-10 pt-24 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:px-10 lg:pb-12 lg:pt-28">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#e8bb7a]">{c.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl font-medium leading-[0.98] sm:text-6xl lg:text-7xl">
            {c.title}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
            {c.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={type === "hand-painted" ? "/hand-painted" : "/printed-canvas"}
              className="inline-flex items-center gap-2 rounded-full bg-[#e8bb7a] px-6 py-3 font-semibold text-[#17130f] transition hover:-translate-y-0.5 hover:bg-white"
            >
              {c.cta}
              <ArrowRight size={17} />
            </Link>

            <button
              type="button"
              onClick={togglePlayback}
              disabled={failed}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-6 py-3 font-semibold backdrop-blur transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={playing ? "Pause background video" : "Play background video"}
              aria-pressed={playing}
            >
              {playing ? <Pause size={17} /> : <Play size={17} />}
              {c.secondary}
            </button>
          </div>

          <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
            {c.features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-white/15 bg-black/20 p-4 backdrop-blur-sm">
                <Icon size={18} className="text-[#e8bb7a]" />
                <p className="mt-3 text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs text-white/55">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:block">
          {products.length ? (
            <div className="ml-auto max-w-md">
              <div className="grid grid-cols-3 gap-3">
                {products.slice(0, 3).map((product, index) => {
                  const src = product.images?.[0] || c.poster;
                  return (
                    <Link
                      key={String(product._id || product.slug || index)}
                      href={`/products/${product.slug}`}
                      className={`group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 ${index === 1 ? "mt-8" : ""}`}
                    >
                      <div className="relative aspect-[3/4]">
                        <Image
                          src={src}
                          alt={product.title}
                          fill
                          sizes="160px"
                          className="object-cover transition duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-3">
                          <p className="text-xs font-semibold">{product.title}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-wider text-white/55">
                            {type === "hand-painted" ? "Original" : "Canvas Print"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <p className="mt-4 text-right text-xs uppercase tracking-[0.25em] text-white/45">
                A few from the collection
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
