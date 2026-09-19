import Image from "next/image";
import Link from "next/link";

export function Hero({ headline, subheadline, heroImageUrl }: { headline?: string; subheadline?: string; heroImageUrl?: string }) {
  const title = headline?.trim() ? headline.trim() : "Bring Art Into Your Life";
  const subtitle = subheadline?.trim() ? subheadline.trim() : "Discover original hand-painted canvases and premium prints that make your space feel like yours.";
  const src = heroImageUrl?.trim() ? heroImageUrl.trim() : "/images/hero.png";
  return (
    <section className="w-full overflow-hidden bg-[#e9dfd2]">
      {/* Mobile (<768px): hero image as background with content overlaid on top */}
      <div className="relative md:hidden">
        {/* Hero image container */}
        <div className="relative aspect-[4/3] min-h-[620px] w-full overflow-hidden">
          <Image
            src={src}
            alt="Mountain artwork displayed in a warm modern interior"
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "center 30%" }}
          />
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#171411]/70 via-[#171411]/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171411]/40 via-transparent to-transparent" />
        </div>

        {/* Overlay content on top of image */}
        <div className="absolute inset-0 flex flex-col justify-end px-4 pb-6 sm:px-6 sm:pb-8">
          <div className="max-w-xl">
            <p className="text-[10px] font-bold uppercase leading-4 tracking-[0.18em] text-[#d4a574] sm:text-[11px] sm:tracking-[0.2em]">
              Original Artwork · Made to Be Remembered
            </p>
            <h1 className="mt-3 break-words text-[clamp(1.5rem,7.2vw,1.9rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-white drop-shadow-md">
              {title}
            </h1>
            <p className="mt-3.5 text-[15px] leading-7 text-white/90 drop-shadow-sm sm:text-base">
              {subtitle}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/shop" className="flex w-full items-center justify-center gap-2 rounded-full bg-[#a96218] px-5 py-3.5 text-center text-sm font-semibold text-white shadow-lg transition hover:bg-[#8f5315] active:scale-[0.98]">
                Shop Artwork <span aria-hidden="true">→</span>
              </Link>
              <Link href="/hand-painted" className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-white/40 bg-white/15 px-5 py-3.5 text-center text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25 active:scale-[0.98]">
                Explore Originals
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-0 rounded-b-2xl border border-white/10 bg-black/20 p-3 backdrop-blur-sm">
              <div className="min-w-0 pr-1">
                <div className="text-[12px] font-semibold text-white">Original</div>
                <div className="mt-0.5 text-[10px] leading-4 text-white/70">Hand-painted art</div>
              </div>
              <div className="min-w-0 border-l border-white/20 px-1">
                <div className="text-[12px] font-semibold text-white">Secure</div>
                <div className="mt-0.5 text-[10px] leading-4 text-white/70">Payments</div>
              </div>
              <div className="min-w-0 border-l border-white/20 pl-1">
                <div className="text-[12px] font-semibold text-white">Careful</div>
                <div className="mt-0.5 text-[10px] leading-4 text-white/70">Packaging</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tablet (md) and desktop (lg and above): split hero — keep existing design */}
      <div className="relative hidden md:block">
        <Image
          src={src}
          alt="Mountain artwork displayed in a warm modern interior"
          width={1376}
          height={768}
          priority
          sizes="100vw"
          className="block h-auto w-full object-cover md:h-[460px] lg:h-auto"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#eee5da]/72 via-[#eee5da]/22 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-7xl px-10 lg:px-12">
            <div className="max-w-[520px]">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#a96218] lg:mb-4 lg:text-xs">
                Original Artwork · Made to Be Remembered
              </p>
              <h1 className="max-w-[520px] text-[32px] font-semibold leading-[1.04] tracking-[-0.03em] text-[#171411] lg:text-[56px] lg:leading-[0.96] lg:tracking-[-0.045em]">
                {title}
              </h1>
              <p className="mt-4 max-w-[500px] text-[15px] leading-7 text-[#2e2924]/78 lg:mt-5 lg:text-[17px] lg:leading-8">
                {subtitle}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 lg:mt-7">
                <Link href="/shop" className="rounded-full bg-[#a96218] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#8f5315] lg:px-6 lg:py-3.5">
                  Shop Artwork <span aria-hidden="true">→</span>
                </Link>
                <Link href="/hand-painted" className="rounded-full border border-black/15 bg-white/35 px-5 py-3 text-sm font-semibold text-[#171411] backdrop-blur-[2px] transition hover:bg-white/55 lg:px-6 lg:py-3.5">
                  Explore Originals
                </Link>
              </div>
              <div className="mt-6 grid max-w-[470px] grid-cols-3 border-t border-black/10 pt-4 lg:mt-8">
                <div className="pr-4">
                  <div className="text-[13px] font-semibold text-[#171411]">Original</div>
                  <div className="mt-1 text-[11px] leading-4 text-[#2e2924]/65">Hand-painted art</div>
                </div>
                <div className="border-l border-black/10 px-4">
                  <div className="text-[13px] font-semibold text-[#171411]">Secure</div>
                  <div className="mt-1 text-[11px] leading-4 text-[#2e2924]/65">Payments</div>
                </div>
                <div className="border-l border-black/10 pl-4">
                  <div className="text-[13px] font-semibold text-[#171411]">Careful</div>
                  <div className="mt-1 text-[11px] leading-4 text-[#2e2924]/65">Packaging</div>
                </div>
              </div>
              <div className="mt-5 max-w-[360px] font-serif text-[17px] italic leading-relaxed text-[#a96218] lg:mt-6 lg:text-xl">
                “Art turns houses into homes.”
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
