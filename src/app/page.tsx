import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import HomeClient from "@/components/home/HomeClient";

export const revalidate = 120;
export const metadata: Metadata = {
  title: "Blactify | Meets Timeless Essentials",
  description: "Modern e-commerce platform for high-aesthetic meets timeless essentials. Discover curated premium apparel and accessories.",
};

import { unstable_cache } from "next/cache";

const getInitialProducts = unstable_cache(
  async () => {
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
  },
  ["home-products"],
  { revalidate: 120, tags: ["home-products"] }
);

import { Suspense } from "react";

function HomeSkeleton() {
  return (
    <main className="flex flex-col animate-pulse">
      <div className="h-[80vh] w-full bg-zinc-200" />
      <section className="px-6 py-12">
        <div className="mb-12 flex items-end justify-between">
          <div className="h-8 w-48 bg-zinc-200 rounded-lg" />
          <div className="h-4 w-16 bg-zinc-200 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-4">
              <div className="aspect-[3/4] bg-zinc-200 rounded-3xl" />
              <div className="h-3 w-16 bg-zinc-200 rounded" />
              <div className="h-4 w-3/4 bg-zinc-200 rounded" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
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
      <Suspense fallback={<HomeSkeleton />}>
        <HomeClient initialProducts={products} />
      </Suspense>
    </>
  );
}
