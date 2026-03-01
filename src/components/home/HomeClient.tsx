"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Hero } from "@/components/ui/Hero";
import { ProductCard, type Product } from "@/components/ui/ProductCard";
import Link from "next/link";
import Image from "next/image";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary-url";

interface CategoryWithImage {
    name: string;
    image: string;
}

interface HomeClientProps {
    initialProducts: Product[];
    initialCategories: CategoryWithImage[];
}

export default function HomeClient({ initialProducts, initialCategories }: HomeClientProps) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
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
                images={products.map(p => p.product_images?.[0]?.url || p.main_image || "/placeholder-product.jpg")}
            />

            {/* Shop by Category — between Hero and Best Sellers */}
            {initialCategories.length > 0 && (
                <section className="px-6 py-12 bg-white">
                    <div className="mb-8">
                        <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-black">
                            Shop by Category
                        </h2>
                    </div>

                    <div className="relative group/nav">

                        <div
                            className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2 snap-x snap-mandatory px-1"
                        >
                            {initialCategories.map((cat) => (
                                <Link
                                    key={cat.name}
                                    href={`/shop?category=${encodeURIComponent(cat.name)}`}
                                    className="group flex flex-col gap-4 flex-shrink-0 w-[220px] md:w-[260px] snap-start"
                                >
                                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                                        <Image
                                            src={optimizeCloudinaryUrl(cat.image, 500)}
                                            alt={cat.name}
                                            fill
                                            sizes="(max-width: 768px) 220px, 260px"
                                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                        />
                                        <div className="absolute top-0 left-0 w-0 h-[2px] bg-black transition-all duration-700 group-hover:w-full" />
                                    </div>
                                    <div className="px-1">
                                        <span className="text-black text-xs md:text-sm font-bold uppercase tracking-[0.2em]">
                                            {cat.name}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Best Sellers */}
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
                            <ProductCard key={product.id} product={product} hidePrice />
                        ))
                    )}
                </div>
            </section>
        </main>
    );
}
