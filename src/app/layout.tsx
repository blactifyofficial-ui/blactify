import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import localFont from "next/font/local";
import AppLayout from "@/components/layout/AppLayout";
import "./globals.css";
import Script from "next/script";

export const preferredRegion = "sin1";
// ... (rest of metadata and viewport unchanged)



const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const yapari = localFont({
  src: "../../public/fonts/YapariTrial-BoldExtended.ttf",
  variable: "--font-yapari",
  display: "swap",
});



export const metadata: Metadata = {
  metadataBase: new URL("https://blactify.com"),
  title: {
    default: "Blactify Studio | Premium Timeless Essentials",
    template: "%s | Blactify Studio",
  },
  description: "Discover Blactify Studio's curated collection of premium, minimalist apparel and timeless essentials. Elevate your aesthetic with our modern e-commerce fashion platform.",
  keywords: [
    "Blactify Studio",
    "premium apparel",
    "timeless essentials",
    "minimalist fashion",
    "modern clothing",
    "luxury essentials",
    "aesthetic clothing",
    "streetwear",
    "e-commerce fashion",
    "high-quality basics",
    "mens fashion",
    "womens fashion",
    "online clothing store",
    "Blactify Studio fashion",
    "curated apparel",
  ],
  authors: [{ name: "Blactify Studio Team" }],
  creator: "Blactify Studio",
  publisher: "Blactify Studio",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Blactify Studio | Premium Timeless Essentials",
    description: "Discover Blactify Studio's curated collection of premium, minimalist apparel and timeless essentials. Elevate your aesthetic.",
    url: "https://blactify.com",
    siteName: "Blactify Studio",
    images: [
      {
        url: "/logo-v1.png",
        width: 1200,
        height: 630,
        alt: "Blactify Studio Premium Apparel",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blactify Studio | Premium Timeless Essentials",
    description: "Discover Blactify Studio's curated collection of premium, minimalist apparel and timeless essentials.",
    images: ["/logo-v1.png"],
    creator: "@blactifystudio",
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
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon.ico",
        apple: "/icon.png",
    },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://cdn.shopify.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.shopify.com" />

      </head>
      <body className={`${outfit.variable} ${yapari.variable} font-sans antialiased text-black`}>
        <Script id="sw-deregister" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              const isInternal = 
                window.location.hostname.startsWith('admin.') || 
                window.location.hostname.startsWith('dev.') ||
                window.location.pathname.startsWith('/admin') ||
                window.location.pathname.startsWith('/developer');

              if (!isInternal) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            }
          `}
        </Script>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
