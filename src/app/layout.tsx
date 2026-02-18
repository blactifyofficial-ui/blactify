import { Inter, Outfit, Space_Grotesk } from "next/font/google";
import { AppLayout } from "@/components/layout/AppLayout";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "blactify | coming soon",
  description: "Beyond Premium. Beyond Minimalist. Blactify is coming soon.",
  icons: {
    icon: "/icon.png",
  },
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} ${spaceGrotesk.variable} font-sans antialiased text-black`}>
        <Toaster position="top-center" richColors />
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
