"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Hero } from "@/components/ui/Hero";
import { ProductCard, type Product } from "@/components/ui/ProductCard";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
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
    const categoryScrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

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

    // Scroll arrows for category strip
    const updateScrollButtons = useCallback(() => {
        const el = categoryScrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 5);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    }, []);

    useEffect(() => {
        const el = categoryScrollRef.current;
        if (!el) return;
        updateScrollButtons();
        el.addEventListener("scroll", updateScrollButtons);
        return () => el.removeEventListener("scroll", updateScrollButtons);
    }, [initialCategories, updateScrollButtons]);

    const scrollCategories = (dir: "left" | "right") => {
        const el = categoryScrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === "left" ? -260 : 260, behavior: "smooth" });
    };

    return (
        <main className="flex flex-col">
            <Hero
                images={products.map(p => p.product_images?.[0]?.url || p.main_image || "/placeholder-product.jpg")}
            />

            {/* Shop by Category — between Hero and Best Sellers */}
            {initialCategories.length > 0 && (
                <section className="px-6 py-12 bg-white">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-black">
                            Shop by Category
                        </h2>
                        <div className="hidden md:flex items-center gap-2">
                            <button
                                onClick={() => scrollCategories("left")}
                                disabled={!canScrollLeft}
                                className={cn(
                                    "p-2 rounded-full border border-zinc-200 transition-all duration-300",
                                    canScrollLeft ? "text-zinc-600 hover:text-black hover:border-zinc-400" : "text-zinc-200 cursor-default"
                                )}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => scrollCategories("right")}
                                disabled={!canScrollRight}
                                className={cn(
                                    "p-2 rounded-full border border-zinc-200 transition-all duration-300",
                                    canScrollRight ? "text-zinc-600 hover:text-black hover:border-zinc-400" : "text-zinc-200 cursor-default"
                                )}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div
                        ref={categoryScrollRef}
                        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2 snap-x snap-mandatory"
                    >
                        {initialCategories.map((cat) => (
                            <Link
                                key={cat.name}
                                href={`/shop?category=${encodeURIComponent(cat.name)}`}
                                className="group relative flex-shrink-0 w-[220px] md:w-[260px] aspect-[3/4] rounded-2xl overflow-hidden snap-start"
                            >
                                <Image
                                    src={optimizeCloudinaryUrl(cat.image, 500)}
                                    alt={cat.name}
                                    fill
                                    sizes="(max-width: 768px) 220px, 260px"
                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-colors duration-500 group-hover:from-black/90" />
                                <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between">
                                    <span className="text-white text-xs md:text-sm font-bold uppercase tracking-[0.2em]">
                                        {cat.name}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-white/40 transition-all duration-500 group-hover:text-white group-hover:translate-x-1" />
                                </div>
                                <div className="absolute top-0 left-0 w-0 h-[2px] bg-black transition-all duration-700 group-hover:w-full" />
                            </Link>
                        ))}
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
