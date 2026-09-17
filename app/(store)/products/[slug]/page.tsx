import { getProductBySlug } from "@/lib/queries";
import { getDb } from "@/lib/db";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ProductInfo } from "@/components/products/ProductInfo";
import { ProductPurchase } from "@/components/products/ProductPurchase";
import { ProductDetails } from "@/components/products/ProductDetails";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { notFound } from "next/navigation";

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=await getProductBySlug(slug);return p?{title:p.title,description:p.description,openGraph:{images:p.images}}:{title:"Artwork"}}

async function ratingSummary(productId: string): Promise<{ rating: number; count: number }> {
  try {
    const db = await getDb();
    const docs = await db.collection("reviews").find({ approved: true, productId }).project({ rating: 1 }).toArray();
    if (!docs.length) return { rating: 0, count: 0 };
    let sum = 0;
    for (const d of docs) sum += typeof d.rating === "number" ? d.rating : Number(d.rating) || 0;
    return { rating: sum / docs.length, count: docs.length };
  } catch {
    return { rating: 0, count: 0 };
  }
}

export default async function ProductPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const product=await getProductBySlug(slug);if(!product)notFound();const reviewKey=product._id&&product._id!=="undefined"?product._id:`slug:${product.slug}`;const summary=await ratingSummary(reviewKey);return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8"><div className="grid gap-10 lg:grid-cols-2"><ProductGallery product={product}/><div><ProductInfo product={product} rating={summary.rating} reviewCount={summary.count}/><ProductPurchase product={product}/></div></div><ProductDetails product={product}/><RelatedProducts product={product}/><ReviewsSection productId={reviewKey} productTitle={product.title}/></section>}
