import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import HomeClient from "@/components/home/HomeClient";

export const metadata: Metadata = {
  title: "Blactify | Meets Timeless Essentials",
  description: "Modern e-commerce platform for high-aesthetic meets timeless essentials. Discover curated premium apparel and accessories.",
};

async function getInitialProducts() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, product_images(*), product_variants(*)")
      .not("home_order", "is", null)
      .order("home_order", { ascending: true })
      .limit(6);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export default async function Page() {
  const products = await getInitialProducts();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Blactify",
    "url": "https://blactify.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://blactify.com/shop?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Blactify",
    "url": "https://blactify.com",
    "logo": "https://blactify.com/logo-v1.png",
    "sameAs": [
      "https://twitter.com/blactify",
      "https://instagram.com/blactify"
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <HomeClient initialProducts={products} />
    </>
  );
}
