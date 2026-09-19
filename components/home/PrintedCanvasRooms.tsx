import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

type Room = {
  title: string;
  blurb: string;
  image: string;
  alt: string;
  label: string;
};

// NOTE: Room images are dedicated local assets (verified in public/images,
// .png not .jpg). Room filtering is NOT supported by the product schema
// (no `room` field; ShopFilters/ProductFilters have no room option), so every
// card scrolls to the collection instead of faking a ?room= filter.
const ROOMS: Room[] = [
  {
    title: "Living Room",
    blurb: "Create a focal point everyone notices.",
    image: "/images/living-room.png",
    alt: "Warm living room interior with a large framed canvas print above the sofa",
    label: "View Living Room prints in the collection",
  },
  {
    title: "Bedroom",
    blurb: "Bring calm colour and character to your walls.",
    image: "/images/bedroom.png",
    alt: "Calm bedroom interior styled with canvas artwork in soft tones",
    label: "View Bedroom prints in the collection",
  },
  {
    title: "Home Office",
    blurb: "Make your everyday space feel more inspiring.",
    image: "/images/home-office.png",
    alt: "Home office interior with inspiring canvas artwork on the wall",
    label: "View Home Office prints in the collection",
  },
  {
    title: "Gallery Wall",
    blurb: "Build a collection that feels uniquely yours.",
    image: "/images/gallery-wall.png",
    alt: "Gallery wall arrangement of multiple framed canvas prints",
    label: "View Gallery Wall prints in the collection",
  },
];

const COLLECTION_HREF = "/printed-canvas#printed-canvas-collection";

export function PrintedCanvasRooms() {
  return (
    <section
      aria-labelledby="shop-by-space"
      className="mx-auto max-w-7xl overflow-x-clip px-4 pt-12 sm:px-6 sm:pt-14 lg:px-8"
    >
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#9a5d19]">
        Shop by space
      </p>
      <h2
        id="shop-by-space"
        className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-5xl"
      >
        Find Art for Your Space
      </h2>
      <p className="mt-3 max-w-2xl leading-7 text-black/60">
        Explore canvas prints styled for the rooms where life happens.
      </p>

      <div
        className="mt-8 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 lg:gap-5"
        role="region"
        aria-label="Art styled by room — swipe for more"
      >
        {ROOMS.map((room) => (
          <a
            key={room.title}
            href={COLLECTION_HREF}
            aria-label={room.label}
            className="group relative block min-h-[280px] w-[78%] shrink-0 snap-center overflow-hidden rounded-[20px] bg-[#17130f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9a5d19] sm:w-auto sm:min-w-0 lg:min-h-[320px]"
          >
            <Image
              src={room.image}
              alt={room.alt}
              fill
              sizes="(max-width: 640px) 78vw, (max-width: 1024px) 45vw, 22vw"
              className="object-cover opacity-90 transition duration-700 motion-safe:group-hover:scale-105"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
              <div>
                <p className="font-serif text-2xl text-white">{room.title}</p>
                <p className="mt-1 text-sm leading-6 text-white/75">
                  {room.blurb}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition motion-safe:group-hover:bg-white motion-safe:group-hover:text-[#17130f]"
              >
                <ArrowUpRight size={18} />
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
