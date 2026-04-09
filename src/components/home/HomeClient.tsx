"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";


import type { Product } from "@/components/ui/ProductCard";

interface CategoryWithImage {
    name: string;
    image: string;
}

interface HomeClientProps {
    initialProducts: Product[]; // Properly typed even if unused
    initialCategories: CategoryWithImage[];
}

export default function HomeClient({ initialCategories }: HomeClientProps) {
    const router = useRouter();


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



    return (
        <main 
            className="flex flex-col min-h-screen"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Discover By Category - Direct Landing */}
            {initialCategories.length > 0 && (
                <section className="px-6 pt-24 pb-4 md:pt-32 md:pb-8 bg-white/40 backdrop-blur-md">
                    <div className="mx-auto max-w-7xl w-full">
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
            {/* Promotional Image Section */}
            <section className="px-6 py-12 md:py-20 bg-white">
                <div className="mx-auto max-w-4xl">
                    <Link href="/shop" className="block relative aspect-[3/4] md:aspect-[4/5] w-full group overflow-hidden cursor-pointer">
                        <Image
                            src="/2.jpeg"
                            alt="Blactify Collection"
                            fill
                            className="object-contain transition-transform duration-1000 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 80vw"
                        />
                    </Link>
                </div>
            </section>
        </main>
    );
}
