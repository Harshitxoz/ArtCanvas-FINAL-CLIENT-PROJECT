import { Hero } from "@/components/home/Hero";
import { ShopType } from "@/components/home/ShopType";
import { CategorySection } from "@/components/home/CategorySection";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { getSettings } from "@/lib/settings";

export default async function HomePage() {
  const settings = await getSettings();
  return <><Hero headline={settings.headline} subheadline={settings.subheadline} heroImageUrl={settings.heroImageUrl}/><ShopType/><CategorySection/><FeaturedCollection/><WhyChooseUs/></>;
}
