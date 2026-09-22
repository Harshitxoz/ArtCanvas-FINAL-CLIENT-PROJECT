"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, RotateCcw, Check, Compass, Home, Palette, Brush } from "lucide-react";
import type { Product } from "@/types";
import { ProductCard } from "@/components/products/ProductCard";

interface ArtFinderQuizProps {
  initialProducts: Product[];
}

const ROOMS = [
  {
    id: "living-room",
    title: "Living Room",
    desc: "Grand, welcoming statement pieces for family & guests",
    icon: "🛋️",
    keywords: ["statement", "landscape", "abstract", "modern", "large"],
  },
  {
    id: "bedroom",
    title: "Bedroom Suite",
    desc: "Peaceful, restorative palettes for deep relaxation",
    icon: "🛏️",
    keywords: ["zen", "calm", "nature", "peace", "serene", "soft"],
  },
  {
    id: "office",
    title: "Home Office / Studio",
    desc: "Inspiring, structured geometries to spark focus & ambition",
    icon: "💼",
    keywords: ["modern", "geometric", "abstract", "bold", "focus"],
  },
  {
    id: "dining",
    title: "Dining & Foyer",
    desc: "Engaging conversation pieces and rich artistic textures",
    icon: "🍷",
    keywords: ["spiritual", "floral", "classic", "vibrant", "figurative"],
  },
];

const VIBES = [
  {
    id: "warm-earthy",
    title: "Warm & Earthy",
    desc: "Terracotta, golden ochre, sand, and rich organic woods",
    color: "#a85d38",
    keywords: ["warm", "earth", "gold", "yellow", "orange", "brown", "autumn"],
  },
  {
    id: "calm-zen",
    title: "Calm & Zen",
    desc: "Sage green, misty morning neutrals, and tranquil waters",
    color: "#6b7d6a",
    keywords: ["calm", "green", "blue", "water", "nature", "zen", "peace", "forest"],
  },
  {
    id: "bold-dramatic",
    title: "Bold & Dramatic",
    desc: "Deep charcoals, vibrant contrasting strokes, and intense energy",
    color: "#272a30",
    keywords: ["bold", "black", "contrast", "dramatic", "vibrant", "red", "abstract"],
  },
  {
    id: "spiritual-sacred",
    title: "Spiritual & Divine",
    desc: "Sacred motifs, meditating forms, and peaceful spiritual devotion",
    color: "#c28d3b",
    keywords: ["spiritual", "buddha", "krishna", "ganesha", "shiva", "temple", "divine"],
  },
];

const MEDIUMS = [
  {
    id: "all",
    title: "Show Me All Mediums",
    desc: "Originals and fine museum canvas prints",
    badge: "All Art",
  },
  {
    id: "hand-painted",
    title: "100% Hand-Painted Originals",
    desc: "Rich physical brush textures by studio artists",
    badge: "Original Paintings",
  },
  {
    id: "printed-canvas",
    title: "Museum-Grade Canvas Prints",
    desc: "Archival pigment ink on 380 GSM cotton canvas",
    badge: "Canvas Prints",
  },
];

export function ArtFinderQuiz({ initialProducts }: ArtFinderQuizProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [selectedMedium, setSelectedMedium] = useState<string>("all");

  const activeRoomObj = ROOMS.find((r) => r.id === selectedRoom);
  const activeVibeObj = VIBES.find((v) => v.id === selectedVibe);

  // Recommendations scoring algorithm
  const recommendations = useMemo(() => {
    if (!selectedRoom || !selectedVibe) return initialProducts.slice(0, 8);

    const roomKeywords = activeRoomObj?.keywords || [];
    const vibeKeywords = activeVibeObj?.keywords || [];
    const allKeywords = [...roomKeywords, ...vibeKeywords];

    const scored = initialProducts
      .filter((p) => {
        if (selectedMedium === "all") return true;
        return p.artType === selectedMedium;
      })
      .map((product) => {
        let score = 0;
        const textToSearch = `${product.title} ${product.category} ${product.artist || ""} ${product.description || ""}`.toLowerCase();

        for (const kw of allKeywords) {
          if (textToSearch.includes(kw.toLowerCase())) {
            score += 3;
          }
        }

        if (selectedRoom === "dining" && product.category?.includes("spiritual")) score += 4;
        if (selectedRoom === "office" && product.category?.includes("abstract")) score += 4;
        if (selectedRoom === "bedroom" && product.category?.includes("nature")) score += 4;
        if (selectedVibe === "spiritual-sacred" && (product.category?.includes("spiritual") || textToSearch.includes("spiritual"))) score += 6;

        if (product.featured) score += 2;
        if (product.bestseller) score += 1;

        return { product, score };
      });

    scored.sort((a, b) => b.score - a.score);
    const topMatches = scored.map((s) => s.product);

    // If matches are few, fall back to general collection so user is never empty-handed
    return topMatches.length >= 4 ? topMatches.slice(0, 12) : initialProducts.slice(0, 12);
  }, [selectedRoom, selectedVibe, selectedMedium, initialProducts, activeRoomObj, activeVibeObj]);

  function restart() {
    setSelectedRoom(null);
    setSelectedVibe(null);
    setSelectedMedium("all");
    setStep(1);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Quiz Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#f6f1ea] px-4 py-1.5 text-xs font-semibold text-[#9a5d19]">
          <Sparkles size={14} />
          <span>Interactive Art Curator</span>
        </div>
        <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          Find the Perfect Canvas for Your Space
        </h1>
        <p className="mt-2 text-sm sm:text-base text-neutral-600">
          Answer 3 quick questions. Our art studio algorithm will curate original paintings and prints perfectly matched to your interior.
        </p>

        {/* Progress Pills */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === s
                  ? "w-8 bg-[#9a5d19]"
                  : step > s
                  ? "w-4 bg-[#c79a61]"
                  : "w-4 bg-neutral-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Room Selection */}
      {step === 1 && (
        <div className="mt-10 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-neutral-800">
            <Home size={18} className="text-[#9a5d19]" />
            <span>Step 1 of 3: Which room are you styling?</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {ROOMS.map((room) => {
              const selected = selectedRoom === room.id;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setSelectedRoom(room.id)}
                  className={`group relative flex flex-col items-start p-6 rounded-3xl border-2 text-left transition-all ${
                    selected
                      ? "border-[#9a5d19] bg-[#fbf9f6] shadow-md ring-2 ring-[#9a5d19]/20"
                      : "border-black/8 bg-white hover:border-black/20 hover:shadow-sm"
                  }`}
                >
                  <span className="text-3xl mb-3">{room.icon}</span>
                  <h3 className="font-serif text-lg font-bold text-neutral-900">
                    {room.title}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                    {room.desc}
                  </p>
                  {selected && (
                    <div className="absolute top-5 right-5 flex h-6 w-6 items-center justify-center rounded-full bg-[#9a5d19] text-white">
                      <Check size={14} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              disabled={!selectedRoom}
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 rounded-full bg-[#9a5d19] px-7 py-3 text-sm font-semibold text-white shadow transition hover:bg-[#834e15] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span>Next: Choose Color Vibe</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Vibe & Palette Selection */}
      {step === 2 && (
        <div className="mt-10 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
              <Palette size={18} className="text-[#9a5d19]" />
              <span>Step 2 of 3: What mood or color atmosphere speaks to you?</span>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-neutral-500 hover:text-neutral-900 underline"
            >
              Back
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {VIBES.map((vibe) => {
              const selected = selectedVibe === vibe.id;
              return (
                <button
                  key={vibe.id}
                  type="button"
                  onClick={() => setSelectedVibe(vibe.id)}
                  className={`group relative flex flex-col items-start p-6 rounded-3xl border-2 text-left transition-all ${
                    selected
                      ? "border-[#9a5d19] bg-[#fbf9f6] shadow-md ring-2 ring-[#9a5d19]/20"
                      : "border-black/8 bg-white hover:border-black/20 hover:shadow-sm"
                  }`}
                >
                  <div
                    className="h-7 w-7 rounded-full mb-3 shadow-inner border border-black/10"
                    style={{ backgroundColor: vibe.color }}
                  />
                  <h3 className="font-serif text-lg font-bold text-neutral-900">
                    {vibe.title}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                    {vibe.desc}
                  </p>
                  {selected && (
                    <div className="absolute top-5 right-5 flex h-6 w-6 items-center justify-center rounded-full bg-[#9a5d19] text-white">
                      <Check size={14} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-900"
            >
              ← Back to Room
            </button>
            <button
              type="button"
              disabled={!selectedVibe}
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 rounded-full bg-[#9a5d19] px-7 py-3 text-sm font-semibold text-white shadow transition hover:bg-[#834e15] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span>Next: Choose Medium</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Medium Preference */}
      {step === 3 && (
        <div className="mt-10 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
              <Brush size={18} className="text-[#9a5d19]" />
              <span>Step 3 of 3: Preferred Art Medium</span>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs text-neutral-500 hover:text-neutral-900 underline"
            >
              Back
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {MEDIUMS.map((m) => {
              const selected = selectedMedium === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMedium(m.id)}
                  className={`group relative flex flex-col items-start p-5 rounded-3xl border-2 text-left transition-all ${
                    selected
                      ? "border-[#9a5d19] bg-[#fbf9f6] shadow-md ring-2 ring-[#9a5d19]/20"
                      : "border-black/8 bg-white hover:border-black/20 hover:shadow-sm"
                  }`}
                >
                  <span className="inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-700 mb-2">
                    {m.badge}
                  </span>
                  <h3 className="font-serif text-base font-bold text-neutral-900">
                    {m.title}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                    {m.desc}
                  </p>
                  {selected && (
                    <div className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-[#9a5d19] text-white">
                      <Check size={12} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-900"
            >
              ← Back to Vibe
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-2 rounded-full bg-[#9a5d19] px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#834e15]"
            >
              <Sparkles size={16} />
              <span>Reveal Curated Artworks</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Curated Results */}
      {step === 4 && (
        <div className="mt-10">
          {/* Active Criteria Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-black/8 bg-[#fdfbf9] p-5 sm:px-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="font-semibold text-neutral-800">Your Selection:</span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 border border-neutral-200">
                {activeRoomObj?.title}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 border border-neutral-200">
                {activeVibeObj?.title}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 border border-neutral-200">
                {MEDIUMS.find((m) => m.id === selectedMedium)?.badge}
              </span>
            </div>
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9a5d19] hover:underline"
            >
              <RotateCcw size={14} />
              <span>Retake Quiz</span>
            </button>
          </div>

          {/* Results Grid */}
          <div className="mt-8">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-serif text-2xl font-bold text-neutral-900 sm:text-3xl">
                Recommended for You ({recommendations.length})
              </h2>
              <p className="text-xs text-neutral-500">
                Click any piece to simulate on your wall with custom framing
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {recommendations.map((product) => (
                <ProductCard key={String(product._id || product.slug)} product={product} />
              ))}
            </div>

            <div className="mt-12 text-center rounded-3xl bg-[#f6f1ea] p-8 sm:p-12">
              <h3 className="font-serif text-xl font-bold text-neutral-900 sm:text-2xl">
                Want a 100% custom piece painted for your wall?
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-600">
                Upload your room photo and inspiration images. Our master artists will hand-paint an exclusive canvas to your exact dimensions.
              </p>
              <div className="mt-6">
                <Link
                  href="/custom-artwork"
                  className="inline-block rounded-full bg-[#9a5d19] px-7 py-3 text-sm font-semibold text-white shadow transition hover:bg-[#834e15]"
                >
                  Commission Custom Artwork →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
