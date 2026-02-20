"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Hero } from "@/components/ui/Hero";
import { ProductCard, type Product } from "@/components/ui/ProductCard";
import Link from "next/link";

interface HomeClientProps {
    initialProducts: Product[];
}

export default function HomeClient({ initialProducts }: HomeClientProps) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Optionally refresh products on mount if needed, 
        // but initialProducts should be enough for SEO/Initial load
        if (initialProducts.length === 0) {
            setLoading(true);
            async function fetchProducts() {
                try {
                    const { data, error } = await supabase
                        .from("products")
                        .select("*, product_images(*), product_variants(*)")
                        .not("home_order", "is", null)
                        .limit(6)
                        .order("home_order", { ascending: true });

                    if (error) throw error;
                    setProducts(data || []);
                } catch {
                    // Silent fail
                } finally {
                    setLoading(false);
                }
            }
            fetchProducts();
        }
    }, [initialProducts]);

    return (
        <main className="flex flex-col">
            <Hero
                title={<>Meet Timeless <br className="hidden md:block" /> Essentials</>}
                images={products.map(p => p.product_images?.[0]?.url || p.main_image || "/placeholder-product.jpg")}
                ctaText="Shop Now"
                ctaLink="/shop"
            />

            <section className="px-6 py-12">
                <div className="mb-12 flex items-end justify-between">
                    <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-black">Best Sellers</h2>
                    <Link href="/shop" className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300 hover:text-black transition-colors">
                        View All
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:grid-cols-6">
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="flex flex-col gap-4">
                                <div className="aspect-[4/5] bg-zinc-100 rounded-3xl"></div>
                                <div className="h-4 bg-zinc-100 rounded-full w-3/4"></div>
                                <div className="h-3 bg-zinc-100 rounded-full w-1/2"></div>
                            </div>
                        ))
                    ) : (
                        products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    )}
                </div>
            </section>
        </main>
    );
}
