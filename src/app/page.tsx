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
        <div className="mb-12 flex items-end justify-between">
          <h2 className="text-3xl font-medium tracking-tight text-black">Best Sellers</h2>
          <a href="/shop" className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300 hover:text-black transition-colors">
            View All
          </a>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:grid-cols-6">
          {MOCK_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}

