import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-[#e9dfd2]">
      <Image
        src="/images/hero.png"
        alt="Mountain artwork displayed in a warm modern interior"
        width={1376}
        height={768}
        priority
        sizes="100vw"
        className="block h-auto w-full"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#eee5da]/72 via-[#eee5da]/22 to-transparent" />

      <div className="absolute inset-0 flex items-center">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-12">
          <div className="max-w-[520px]">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-[#a96218] sm:text-xs">
              Original Artwork · Made to Be Remembered
            </p>

            <h1 className="max-w-[520px] text-[44px] font-semibold leading-[0.96] tracking-[-0.045em] text-[#171411] sm:text-[54px] lg:text-[60px]">
              Bring <span className="text-[#a96218]">Art</span> Into
              <br />
              Your Life
            </h1>

            <p className="mt-5 max-w-[500px] text-[15px] leading-7 text-[#2e2924]/78 sm:text-[17px] sm:leading-8">
              Discover original hand-painted canvases and premium prints that
              make your space feel like yours.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="rounded-full bg-[#a96218] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#8f5315]"
              >
                Shop Artwork <span aria-hidden="true">→</span>
              </Link>

              <Link
                href="/hand-painted"
                className="rounded-full border border-black/15 bg-white/35 px-6 py-3.5 text-sm font-semibold text-[#171411] backdrop-blur-[2px] transition hover:bg-white/55"
              >
                Explore Originals
              </Link>
            </div>

            <div className="mt-8 grid max-w-[470px] grid-cols-3 border-t border-black/10 pt-4">
              <div className="pr-4">
                <div className="text-[13px] font-semibold text-[#171411]">
                  Original
                </div>
                <div className="mt-1 text-[11px] leading-4 text-[#2e2924]/65">
                  Hand-painted art
                </div>
              </div>

              <div className="border-l border-black/10 px-4">
                <div className="text-[13px] font-semibold text-[#171411]">
                  Secure
                </div>
                <div className="mt-1 text-[11px] leading-4 text-[#2e2924]/65">
                  Payments
                </div>
              </div>

              <div className="border-l border-black/10 pl-4">
                <div className="text-[13px] font-semibold text-[#171411]">
                  Careful
                </div>
                <div className="mt-1 text-[11px] leading-4 text-[#2e2924]/65">
                  Packaging
                </div>
              </div>
            </div>

            <div className="mt-6 max-w-[360px] font-serif text-lg italic leading-relaxed text-[#a96218] sm:text-xl">
              “Art turns houses into homes.”
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
