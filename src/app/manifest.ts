import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Car Fever — Premium Car Marketplace",
    short_name: "Car Fever",
    description:
      "UK's most trusted automotive marketplace. Find your dream car with verified listings and professional inspections.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#ef4444",
    orientation: "portrait-primary",
    categories: ["automotive", "shopping"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
