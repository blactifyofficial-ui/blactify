import { Hero } from "@/components/ui/Hero";
import { ProductCard } from "@/components/ui/ProductCard";
import { MOCK_PRODUCTS } from "@/lib/mock-data";

export default function Home() {
  const heroProduct = MOCK_PRODUCTS[0];

  return (
    <main className="flex flex-col">
      <Hero
        title="Essentials"
        subtitle={heroProduct?.name.toUpperCase() || "'REAL' OUT NOW"}
        imageUrl={heroProduct?.imageUrl || "/hero-placeholder.jpg"}
        ctaText="Shop Now"
        ctaLink="/shop"
      />

      <section className="px-6 py-12">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-empire text-3xl leading-none">Shop All</h2>
          <a href="/shop" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black">
            View All
          </a>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10">
          {MOCK_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}

