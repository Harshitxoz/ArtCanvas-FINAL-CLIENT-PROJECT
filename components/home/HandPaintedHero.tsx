"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/videos/hand-painted.mp4";
const POSTER_SRC = "/images/hero.png";

export function HandPaintedHero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (failed || reducedMotion) return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const promise = video.play();
    if (promise) {
      promise.then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [failed, reducedMotion]);

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

  const showVideo = !failed && !reducedMotion;

  return (
    <section
      aria-label="Hand-painted originals — cinematic introduction"
      className="relative h-[55vh] max-h-[820px] min-h-[420px] overflow-hidden bg-[#17130f] text-white md:h-[60vh] lg:h-[70vh]"
    >
      {/* z-0: video / fallback image */}
      <div className="absolute inset-0 z-0">
        {showVideo ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={POSTER_SRC}
            onError={() => setFailed(true)}
            aria-label="Artist painting a hand-painted original artwork"
          >
            <source
              src={VIDEO_SRC}
              type="video/mp4"
              onError={() => setFailed(true)}
            />
          </video>
        ) : (
          <Image
            src={POSTER_SRC}
            alt="Hand-painted artwork displayed in a warm interior"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
      </div>

      {/* z-10: dark cinematic gradient overlay (no solid cover) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/75 via-black/30 to-black/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-black/55 via-black/15 to-transparent"
      />

      {/* z-20: text / content, bottom-left, max ~600px */}
      <div className="absolute inset-0 z-20 flex items-end">
        <div className="mx-auto w-full max-w-7xl px-5 pb-10 sm:px-8 sm:pb-12 lg:px-12 lg:pb-14">
          <div className="max-w-[600px] motion-safe:animate-[heroReveal_0.9s_ease-out_both]">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#e8bb7a] sm:text-xs">
              Hand-Painted Originals
            </p>
            <h1 className="mt-3 font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Made by Hand
            </h1>
            <p className="mt-4 max-w-[600px] text-[15px] leading-7 text-white/80 sm:text-base sm:leading-8">
              Every brushstroke carries the artist&apos;s touch. Discover
              original paintings created with care, texture, and character.
            </p>
            <div className="mt-7">
              <Link
                href="/hand-painted#hand-painted-collection"
                className="inline-flex items-center gap-2 rounded-full bg-[#e8bb7a] px-7 py-3 text-sm font-semibold text-[#17130f] shadow-lg transition outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#17130f]"
              >
                Explore Originals
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* z-30: playback control */}
      {showVideo ? (
        <div className="absolute bottom-5 right-5 z-30 sm:bottom-8 sm:right-8">
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={playing ? "Pause background video" : "Play background video"}
            aria-pressed={playing}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-sm transition outline-none hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#17130f]"
          >
            {playing ? (
              <Pause size={18} aria-hidden="true" />
            ) : (
              <Play size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      ) : null}

      <style jsx>{`@keyframes heroReveal{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </section>
  );
}
