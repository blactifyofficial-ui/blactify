import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Space_Grotesk } from "next/font/google";
import { AppLayout } from "@/components/layout/AppLayout";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://blactify.com"),
  title: {
    default: "Blactify | Meets Timeless Essentials",
    template: "%s | Blactify",
  },
  description: "Modern e-commerce platform for high-aesthetic meets timeless essentials. Discover curated premium apparel and accessories.",
  keywords: ["fashion", "e-commerce", "minimalist", "essentials", "premium apparel", "Blactify"],
  authors: [{ name: "Blactify Team" }],
  creator: "Blactify",
  publisher: "Blactify",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Blactify | Meets Timeless Essentials",
    description: "Modern e-commerce platform for high-aesthetic meets timeless essentials.",
    url: "https://blactify.com",
    siteName: "Blactify",
    images: [
      {
        url: "/logo-v1.png",
        width: 1200,
        height: 630,
        alt: "Blactify Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blactify | Meets Timeless Essentials",
    description: "Modern e-commerce platform for high-aesthetic meets timeless essentials.",
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
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
