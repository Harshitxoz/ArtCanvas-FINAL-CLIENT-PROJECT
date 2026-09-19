import { getStoreProducts } from "@/lib/queries";
import { WishlistClient } from "@/components/wishlist/WishlistClient";

export const metadata = {
  title: "My Wishlist | ArtCanvas",
  description: "View and manage your saved artwork and canvas prints.",
};

export default async function WishlistPage() {
  const products = await getStoreProducts({});
  return <WishlistClient products={products} />;
}
