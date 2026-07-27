import { unstable_cache } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";

export interface PublicSiteSettings {
  site_name: string;
  site_tagline: string;
  contact_email: string;
  contact_phone: string;
  business_address: string;
  working_hours: string;
  about_heading: string;
  about_description: string;
  about_mission: string;
  about_vision: string;
  about_stat_cars: string;
  about_stat_dealers: string;
  about_stat_inspections: string;
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_youtube: string;
}

export const DEFAULT_SITE_SETTINGS: PublicSiteSettings = {
  site_name: "CarFever",
  site_tagline: "UK's Premier Verified Automotive Marketplace",
  contact_email: "info@carfever.uk",
  contact_phone: "07507696334",
  business_address: "Bristol, United Kingdom",
  working_hours: "Mon - Sat: 9:00 AM - 7:00 PM GMT",
  about_heading: "Driving Automotive Excellence & Unmatched Trust Across the UK",
  about_description:
    "CarFever is the UK's premier automotive marketplace, built to connect buyers and certified dealers with verified listings, 200+ point expert vehicle inspections, and complete pricing transparency.",
  about_mission:
    "To eliminate vehicle fraud and hidden defects by establishing an uncompromising standard for vehicle verification, seller trust, and seamless digital car buying.",
  about_vision:
    "To build the UK's most trusted automotive ecosystem where every car is certified, every listing is authentic, and every driver finds their dream vehicle with complete peace of mind.",
  about_stat_cars: "12,500+",
  about_stat_dealers: "650+",
  about_stat_inspections: "25,000+",
  social_facebook: "https://facebook.com/carfever.uk",
  social_instagram: "https://instagram.com/carfever.uk",
  social_twitter: "https://x.com/carfever_uk",
  social_youtube: "https://youtube.com/@carfeveruk",
};

/**
 * Fetches site settings from DB with 24-hour cache and 'site-settings' cache tag.
 * Revalidated automatically when admin updates site settings.
 */
export const getPublicSiteSettings = unstable_cache(
  async (): Promise<PublicSiteSettings> => {
    try {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase.from("site_settings").select("key, value");

      if (error || !data) {
        console.warn("getPublicSiteSettings fetch warning:", error?.message);
        return DEFAULT_SITE_SETTINGS;
      }

      const settingsMap: Record<string, string> = {};
      data.forEach((row: any) => {
        if (row.key && row.value !== null && row.value !== undefined) {
          settingsMap[row.key] = String(row.value);
        }
      });

      let email = settingsMap.contact_email || DEFAULT_SITE_SETTINGS.contact_email;
      let phone = settingsMap.contact_phone || DEFAULT_SITE_SETTINGS.contact_phone;
      let address = settingsMap.business_address || DEFAULT_SITE_SETTINGS.business_address;

      if (email.includes(".pk") || email.includes("co.uk")) email = DEFAULT_SITE_SETTINGS.contact_email;
      if (phone.includes("+92") || phone.includes("1234567")) phone = DEFAULT_SITE_SETTINGS.contact_phone;
      if (address.includes("Plaza") || address.includes("Gulberg") || address.includes("Lahore"))
        address = DEFAULT_SITE_SETTINGS.business_address;

      return {
        site_name: settingsMap.site_name || DEFAULT_SITE_SETTINGS.site_name,
        site_tagline: settingsMap.site_tagline || DEFAULT_SITE_SETTINGS.site_tagline,
        contact_email: email,
        contact_phone: phone,
        business_address: address,
        working_hours: settingsMap.working_hours || DEFAULT_SITE_SETTINGS.working_hours,
        about_heading: settingsMap.about_heading || DEFAULT_SITE_SETTINGS.about_heading,
        about_description: settingsMap.about_description || DEFAULT_SITE_SETTINGS.about_description,
        about_mission: settingsMap.about_mission || DEFAULT_SITE_SETTINGS.about_mission,
        about_vision: settingsMap.about_vision || DEFAULT_SITE_SETTINGS.about_vision,
        about_stat_cars: settingsMap.about_stat_cars || DEFAULT_SITE_SETTINGS.about_stat_cars,
        about_stat_dealers: settingsMap.about_stat_dealers || DEFAULT_SITE_SETTINGS.about_stat_dealers,
        about_stat_inspections:
          settingsMap.about_stat_inspections || DEFAULT_SITE_SETTINGS.about_stat_inspections,
        social_facebook: settingsMap.social_facebook || DEFAULT_SITE_SETTINGS.social_facebook,
        social_instagram: settingsMap.social_instagram || DEFAULT_SITE_SETTINGS.social_instagram,
        social_twitter: settingsMap.social_twitter || DEFAULT_SITE_SETTINGS.social_twitter,
        social_youtube: settingsMap.social_youtube || DEFAULT_SITE_SETTINGS.social_youtube,
      };
    } catch (err) {
      console.error("getPublicSiteSettings exception:", err);
      return DEFAULT_SITE_SETTINGS;
    }
  },
  ["public-site-settings"],
  {
    revalidate: 86400, // 24 hours
    tags: ["site-settings"],
  }
);
