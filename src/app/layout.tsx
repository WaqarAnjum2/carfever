import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ScrollToTop } from "@/components/scroll-to-top";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://carfever.pk";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  name: "Car Fever",
  url: siteUrl,
  description: "Pakistan's premium car marketplace for buying and selling new & used vehicles.",
  areaServed: "PK",
  priceRange: "₨₨₨",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+92-300-0000000",
    contactType: "customer service",
  },
  sameAs: [
    "https://facebook.com/carfever",
    "https://instagram.com/carfever",
  ],
};

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0055FE",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Car Fever — Premium Verified Car Marketplace in UK",
    template: "%s | Car Fever",
  },
  description:
    "Discover, buy, and sell premium vehicles on the UK's most trusted car marketplace. New & used cars, expert inspections, dealer comparisons, and certified UK model cards.",
  icons: {
    icon: [
      { url: "/carfever-logo.webp", type: "image/webp" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/carfever-logo.webp",
    apple: "/carfever-logo.webp",
  },
  keywords: [
    "car marketplace UK",
    "buy cars UK",
    "sell cars UK",
    "used cars UK",
    "new cars UK",
    "Car Fever",
    "car inspections",
    "car dealers UK",
    "UK car prices",
  ],
  authors: [{ name: "Car Fever" }],
  creator: "Car Fever",
  publisher: "Car Fever",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Car Fever",
    title: "Car Fever — Premium Verified Car Marketplace in UK",
    description:
      "Discover, buy, and sell premium vehicles on the UK's most trusted car marketplace.",
    url: siteUrl,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Car Fever" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Car Fever — Premium Verified Car Marketplace",
    description:
      "Discover, buy, and sell premium vehicles on the UK's most trusted car marketplace.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Car Fever",
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: false,
  },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans overscroll-none">
        <Script id="schema-jsonld" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(jsonLd)}
        </Script>
        {/* Google Analytics 4 — only loads when NEXT_PUBLIC_GA_ID is set in .env.local */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}
        {children}
        <ScrollToTop />
      </body>
    </html>
  );
}
