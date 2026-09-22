"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Maximize2, Palette, Frame, Eye, Check } from "lucide-react";
import type { Product } from "@/types";

interface RoomVisualizerModalProps {
  product: Product;
  selectedSize?: string;
  initialFrame?: "framed" | "unframed";
  isOpen: boolean;
  onClose: () => void;
}

const WALL_COLORS = [
  { name: "Crisp Linen", hex: "#f4f1ea", textDark: true },
  { name: "Warm Oat", hex: "#dfd5c6", textDark: true },
  { name: "Sage Olive", hex: "#7a8775", textDark: false },
  { name: "Charcoal Slate", hex: "#2f353b", textDark: false },
  { name: "Deep Navy", hex: "#1e293b", textDark: false },
  { name: "Terracotta", hex: "#9e533d", textDark: false },
];

const ROOMS = [
  {
    id: "living-room",
    name: "Living Room",
    floorColor: "#c2a382",
    furniture: "sofa",
  },
  {
    id: "bedroom",
    name: "Bedroom Suite",
    floorColor: "#a3896b",
    furniture: "bed",
  },
  {
    id: "gallery",
    name: "Art Gallery",
    floorColor: "#4a3c31",
    furniture: "bench",
  },
];

const FRAME_OPTIONS = [
  {
    id: "unframed",
    name: "Canvas Wrap",
    borderClass: "border-0 shadow-2xl ring-1 ring-black/20",
    frameColor: "transparent",
  },
  {
    id: "matte-black",
    name: "Matte Black",
    borderClass: "border-[14px] border-[#18181b] shadow-2xl",
    frameColor: "#18181b",
  },
  {
    id: "natural-oak",
    name: "Natural Oak",
    borderClass: "border-[14px] border-[#a2784b] shadow-2xl",
    frameColor: "#a2784b",
  },
  {
    id: "gilt-gold",
    name: "Antique Gold",
    borderClass: "border-[14px] border-[#c59d48] shadow-2xl",
    frameColor: "#c59d48",
  },
  {
    id: "satin-white",
    name: "Satin White",
    borderClass: "border-[14px] border-[#fafafa] shadow-2xl",
    frameColor: "#ffffff",
  },
];

const SIZES = [
  { label: "12\" × 18\"", scale: "w-44 sm:w-52 md:w-60" },
  { label: "18\" × 24\"", scale: "w-56 sm:w-64 md:w-76" },
  { label: "24\" × 36\"", scale: "w-68 sm:w-80 md:w-96" },
  { label: "36\" × 48\"", scale: "w-80 sm:w-96 md:w-[420px]" },
];

export function RoomVisualizerModal({
  product,
  selectedSize,
  initialFrame = "unframed",
  isOpen,
  onClose,
}: RoomVisualizerModalProps) {
  const [selectedWall, setSelectedWall] = useState(WALL_COLORS[1]); // Warm Oat default
  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0]); // Living room
  const [selectedFrame, setSelectedFrame] = useState(
    initialFrame === "framed" ? FRAME_OPTIONS[1] : FRAME_OPTIONS[0]
  );
  const [sizeIndex, setSizeIndex] = useState(() => {
    if (!selectedSize) return 2;
    const idx = SIZES.findIndex((s) => s.label.toLowerCase() === selectedSize.toLowerCase());
    return idx >= 0 ? idx : 2;
  });

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const artworkImage = product.images?.[0] || "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="visualizer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 md:p-6 transition-opacity"
    >
      <div className="relative flex flex-col h-full max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-[#1c1917] shadow-2xl border border-white/10">
        {/* Top Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-neutral-900/90 px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9a5d19] text-white">
              <Eye size={16} />
            </div>
            <div>
              <h2 id="visualizer-title" className="text-sm sm:text-base font-semibold text-white">
                Wall Visualizer: <span className="font-normal text-white/70">{product.title}</span>
              </h2>
              <p className="text-[11px] text-white/50 hidden sm:block">
                Simulate dimensions, wall colors, and frame styles in true-to-scale interiors.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close visualizer"
            className="rounded-full bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Room Stage Canvas */}
        <div
          className="relative flex-1 min-h-[320px] w-full overflow-hidden flex flex-col justify-end transition-colors duration-500"
          style={{ backgroundColor: selectedWall.hex }}
        >
          {/* Ambient Lighting Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/10 pointer-events-none" />

          {/* Sconce / Ceiling Spotlight glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-100/25 blur-3xl pointer-events-none rounded-full" />

          {/* Wall Hang Section */}
          <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-12 pt-6">
            <div
              className={`relative transition-all duration-300 transform ${SIZES[sizeIndex].scale} max-h-[52vh] aspect-[3/4]`}
            >
              {/* Painting Drop Shadow */}
              <div
                className={`relative h-full w-full overflow-hidden transition-all duration-300 rounded-sm ${selectedFrame.borderClass}`}
                style={{
                  boxShadow:
                    "0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 10px 20px -5px rgba(0, 0, 0, 0.3)",
                }}
              >
                {artworkImage ? (
                  <Image
                    src={artworkImage}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 300px, 500px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-stone-200 text-stone-600 font-serif">
                    Artwork
                  </div>
                )}
                {/* Canvas Sheen / Glaze overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
              </div>

              {/* Dimension Label Tag */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/75 px-3 py-0.5 text-[11px] font-medium tracking-wide text-white shadow backdrop-blur-sm">
                Scale: {SIZES[sizeIndex].label} · {selectedFrame.name}
              </div>
            </div>
          </div>

          {/* Hardwood / Parquet Floor Base */}
          <div
            className="relative h-20 sm:h-24 md:h-28 w-full border-t border-black/30 shadow-inner flex items-end justify-center"
            style={{ backgroundColor: selectedRoom.floorColor }}
          >
            {/* Wooden Floor Planks subtle lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.08)_1px,transparent_1px)] bg-[size:50px_100%] opacity-40 pointer-events-none" />

            {/* Simulated Furniture Silhouettes */}
            {selectedRoom.furniture === "sofa" && (
              <div className="relative -mb-1 w-full max-w-xl sm:max-w-2xl px-6">
                {/* Sofa Backrest */}
                <div className="h-14 sm:h-16 w-full rounded-t-3xl bg-[#322c27] shadow-2xl border-t border-white/10 flex items-center justify-around px-8">
                  <div className="h-8 w-1/3 rounded-t-xl bg-[#2a2521] border-x border-white/5" />
                  <div className="h-8 w-1/3 rounded-t-xl bg-[#2a2521] border-x border-white/5" />
                </div>
              </div>
            )}

            {selectedRoom.furniture === "bed" && (
              <div className="relative -mb-1 w-full max-w-lg sm:max-w-xl px-4">
                {/* Modern Bed Headboard */}
                <div className="h-16 sm:h-18 w-full rounded-t-2xl bg-[#3b3a36] shadow-2xl border-t border-white/15 flex justify-center items-center">
                  <div className="h-8 w-4/5 rounded-t-lg bg-[#272624]" />
                </div>
              </div>
            )}

            {selectedRoom.furniture === "bench" && (
              <div className="relative -mb-1 w-full max-w-md px-6">
                {/* Museum Bench */}
                <div className="h-10 sm:h-12 w-full rounded-t-lg bg-[#26201b] shadow-2xl border-t border-white/10" />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Interactive Control Panel */}
        <div className="shrink-0 bg-[#171412] p-4 sm:p-5 border-t border-white/10 text-white space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {/* 1. Room Preset */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-1.5">
                Room Setting
              </label>
              <div className="flex gap-1.5">
                {ROOMS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRoom(r)}
                    className={`flex-1 rounded-xl py-2 px-2 text-xs font-medium transition ${
                      selectedRoom.id === r.id
                        ? "bg-[#9a5d19] text-white shadow-md font-semibold"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Wall Color */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-1.5 flex items-center gap-1.5">
                <Palette size={12} />
                Wall Paint: <span className="text-white font-normal">{selectedWall.name}</span>
              </label>
              <div className="flex items-center gap-2">
                {WALL_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedWall(c)}
                    title={c.name}
                    className={`h-7 w-7 rounded-full transition-transform border-2 flex items-center justify-center ${
                      selectedWall.name === c.name
                        ? "scale-110 border-white ring-2 ring-[#9a5d19]"
                        : "border-white/20 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {selectedWall.name === c.name && (
                      <Check
                        size={12}
                        className={c.textDark ? "text-black" : "text-white"}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Frame Finish */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-1.5 flex items-center gap-1.5">
                <Frame size={12} />
                Frame: <span className="text-white font-normal">{selectedFrame.name}</span>
              </label>
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
                {FRAME_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFrame(f)}
                    className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs transition ${
                      selectedFrame.id === f.id
                        ? "bg-[#9a5d19] text-white font-semibold"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Canvas Scale */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-1.5 flex items-center gap-1.5">
                <Maximize2 size={12} />
                Canvas Size
              </label>
              <div className="flex gap-1">
                {SIZES.map((s, idx) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setSizeIndex(idx)}
                    className={`flex-1 rounded-lg py-1.5 text-[11px] transition ${
                      sizeIndex === idx
                        ? "bg-[#9a5d19] text-white font-semibold"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {s.label.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
