"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Hero } from "@/components/ui/Hero";
import { ProductCard, type Product } from "@/components/ui/ProductCard";
import Link from "next/link";
import Image from "next/image";


interface CategoryWithImage {
    name: string;
    image: string;
}

interface HomeClientProps {
    initialProducts: Product[];
    initialCategories: CategoryWithImage[];
}

export default function HomeClient({ initialProducts, initialCategories }: HomeClientProps) {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [loading, setLoading] = useState(false);


    // Swipe detection states
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;

        if (isLeftSwipe) {
            router.push("/shop");
        }
        
        setTouchStart(null);
        setTouchEnd(null);
    };

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
        <main 
            className="flex flex-col min-h-screen"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <Hero
                images={products.map(p => p.product_images?.[0]?.url || p.main_image || "/placeholder-product.jpg")}
            />

            {/* Discover By Category - Above Best Sellers */}
            {initialCategories.length > 0 && (
                <section className="px-6 py-12 md:py-24 pb-32 border-t border-zinc-100 bg-white/40 backdrop-blur-md">
                    <div className="mx-auto max-w-7xl">
                        <div className="text-center mb-16">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2">Discovery</h2>
                        </div>

                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-16 md:gap-x-12 lg:gap-x-16">
                            {initialCategories.map((cat) => (
                                <Link
                                    key={cat.name}
                                    href={`/shop?category=${encodeURIComponent(cat.name)}`}
                                    className="discovery-item group flex flex-col items-center text-center gap-4 transition-transform duration-500 hover:-translate-y-1 w-[28%] md:w-[20%] lg:w-[10%]"
                                >
                                    <div className="relative w-full aspect-square flex items-center justify-center p-4">
                                        <Image
                                            src={cat.image}
                                            alt={cat.name}
                                            fill
                                            sizes="(max-width: 768px) 33vw, 150px"
                                            className="object-contain transition-transform duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) group-hover:scale-110"
                                        />
                                    </div>
                                    <span className="text-[11px] font-bold text-black uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden text-ellipsis w-full">
                                        {cat.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Best Sellers */}
            <section className="px-6 py-20 bg-white">
                <div className="mb-12 flex items-end justify-between">
                    <h2 className="text-3xl font-medium tracking-tight text-black">Best Sellers</h2>
                    <Link href="/shop" className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300 hover:text-black transition-colors">
                        View All
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 lg:grid-cols-6">
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="flex flex-col gap-4">
                                <div className="aspect-[4/5] bg-zinc-100 rounded-3xl animate-pulse"></div>
                                <div className="h-4 bg-zinc-100 rounded-full w-3/4 animate-pulse"></div>
                                <div className="h-3 bg-zinc-100 rounded-full w-1/2 animate-pulse"></div>
                            </div>
                        ))
                    ) : (
                        products.map((product, index) => (
                            <ProductCard 
                                key={product.id} 
                                product={product} 
                                hidePrice 
                                priority={index < 2} 
                            />
                        ))
                    )}
                </div>
            </section>
        </main>
    );
}
