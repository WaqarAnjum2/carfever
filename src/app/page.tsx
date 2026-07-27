import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import {
  FeaturedCars,
  RecentlyAddedCars,
} from "@/components/featured-cars";
import { mapDbCarToHomeCard } from "@/lib/home-cars";
import { BrowseByBrand } from "@/components/browse-brands";
import { WhyChooseUs } from "@/components/why-choose-us";
import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/footer";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Car Fever — Premium Car Marketplace in Pakistan",
  description:
    "Discover, buy, and sell premium vehicles on Pakistan's most trusted car marketplace. Browse thousands of new & used cars, schedule expert inspections, and connect with verified dealers.",
  openGraph: {
    title: "Car Fever — Premium Car Marketplace in Pakistan",
    description:
      "Discover, buy, and sell premium vehicles on Pakistan's most trusted car marketplace.",
  },
};

export default async function HomePage() {
  const supabase = createServiceRoleClient();

  let [{ data: featuredCars }, { data: recentCars }] = await Promise.all([
    supabase
      .from("cars")
      .select("*")
      .eq("status", "approved")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("cars")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  // Fallback: if no featured cars, show latest approved cars
  if (!featuredCars || featuredCars.length === 0) {
    const { data: fallback } = await supabase
      .from("cars")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(6);
    featuredCars = fallback;
  }

  const featured = (featuredCars ?? []).map(mapDbCarToHomeCard);
  const recent = (recentCars ?? []).map(mapDbCarToHomeCard);

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturedCars cars={featured} />
        <RecentlyAddedCars cars={recent} />
        <BrowseByBrand />
        <WhyChooseUs />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
