import { getProducts } from "@/lib/queries";
import { ArtFinderQuiz } from "@/components/art-finder/ArtFinderQuiz";

export const metadata = {
  title: "Art Finder & Room Style Quiz | ArtCanvas",
  description:
    "Discover the perfect canvas artwork tailored to your room type, color aesthetic, and style with our interactive studio curator.",
};

export default async function ArtFinderPage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-[#fffdf9] pb-16">
      <ArtFinderQuiz initialProducts={products} />
    </main>
  );
}
