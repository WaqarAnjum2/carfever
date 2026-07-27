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
      { url: "/apple-icon.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/apple-icon.png",
    apple: "/apple-icon.png",
  },
  keywords: [
    "car marketplace UK",
    "buy cars UK",
    "sell cars UK",
    "used cars UK",
    "new cars UK",
    "Car Fever",
  ],
  authors: [{ name: "Car Fever Team" }],
  creator: "Car Fever",
  publisher: "Car Fever",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: siteUrl,
    siteName: "Car Fever UK",
    title: "Car Fever — Premium Verified Car Marketplace in UK",
    description:
      "Discover, buy, and sell premium vehicles on the UK's most trusted car marketplace. New & used cars, expert inspections, dealer comparisons, and certified UK model cards.",
    images: [
      {
        url: "/apple-icon.png",
        width: 512,
        height: 512,
        alt: "Car Fever UK Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Car Fever — Premium Verified Car Marketplace in UK",
    description:
      "Discover, buy, and sell premium vehicles on the UK's most trusted car marketplace.",
    images: ["/apple-icon.png"],
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
      <head>
        <link rel="icon" href="/apple-icon.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/apple-icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans overscroll-none">
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
