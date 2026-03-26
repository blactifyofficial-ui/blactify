import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Space_Grotesk } from "next/font/google";
import { AppLayout } from "@/components/layout/AppLayout";
import "./globals.css";

export const preferredRegion = "sin1";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://blactify.com"),
  title: {
    default: "Blactify | Premium Timeless Essentials",
    template: "%s | Blactify",
  },
  description: "Discover Blactify's curated collection of premium, minimalist apparel and timeless essentials. Elevate your aesthetic with our modern e-commerce fashion platform.",
  keywords: [
    "Blactify",
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
    "Blactify fashion",
    "curated apparel",
  ],
  authors: [{ name: "Blactify Team" }],
  creator: "Blactify",
  publisher: "Blactify",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Blactify | Premium Timeless Essentials",
    description: "Discover Blactify's curated collection of premium, minimalist apparel and timeless essentials. Elevate your aesthetic.",
    url: "https://blactify.com",
    siteName: "Blactify",
    images: [
      {
        url: "/logo-v1.png",
        width: 1200,
        height: 630,
        alt: "Blactify Premium Apparel",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blactify | Premium Timeless Essentials",
    description: "Discover Blactify's curated collection of premium, minimalist apparel and timeless essentials.",
    images: ["/logo-v1.png"],
    creator: "@blactify",
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Blactify",
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
      <body className={`${inter.variable} ${outfit.variable} ${spaceGrotesk.variable} font-sans antialiased text-black`}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
