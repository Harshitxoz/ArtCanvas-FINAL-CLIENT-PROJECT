import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AppToaster } from "@/components/layout/Toaster";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: { default: "ArtCanvas — Original Art & Printed Canvas", template: "%s | ArtCanvas" },
  description: "Shop original hand-painted artwork and premium printed canvas wall art.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();
  return <html lang="en"><body><Navbar announcement={settings.announcement} freeShippingThreshold={settings.freeShippingThreshold} storeName={settings.storeName} tagline={settings.tagline}/><main className="min-h-[70vh]">{children}</main><Footer storeName={settings.storeName} tagline={settings.tagline} email={settings.email} phone={settings.phone} whatsapp={settings.whatsapp} instagram={settings.instagram} address={settings.address}/><AppToaster/></body></html>;
}
