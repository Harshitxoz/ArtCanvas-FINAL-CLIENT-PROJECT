import Link from "next/link";
import type { Route } from "next";
import { Sparkles, ArrowRight, Eye, Palette } from "lucide-react";

export function ArtFinderBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#201a16] via-[#2a221c] to-[#17130f] p-8 sm:p-12 lg:p-16 text-white shadow-xl">
        {/* Background glow aesthetics */}
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#9a5d19]/25 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-amber-200 backdrop-blur-sm">
            <Sparkles size={14} />
            <span>Interactive Studio Tool</span>
          </div>

          <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-white">
            Not sure which artwork fits your room?
          </h2>

          <p className="mt-4 text-sm sm:text-base leading-relaxed text-white/70">
            Take our 60-second style quiz. Pick your room, preferred color palette, and medium—our art studio algorithm will curate original paintings and prints matched to your interior.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={"/art-finder" as Route}
              className="inline-flex items-center gap-2 rounded-full bg-[#9a5d19] px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#834e15]"
            >
              <span>Take the Art Finder Quiz</span>
              <ArrowRight size={16} />
            </Link>

            <div className="flex items-center gap-4 text-xs text-white/60">
              <span className="flex items-center gap-1.5">
                <Eye size={14} className="text-[#9a5d19]" />
                Virtual wall preview
              </span>
              <span className="flex items-center gap-1.5">
                <Palette size={14} className="text-[#9a5d19]" />
                Palette curation
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
