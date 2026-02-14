"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { Plus } from "lucide-react";

export interface Product {
    id: string;
    name: string;
    handle: string;
    price_base: number;
    price_offer?: number;
    main_image: string;
    image1?: string;
    image2?: string;
    image3?: string;
    category_id?: string;
    categories?: {
        name: string;
    };
    category?: string; // Fallback
    tag?: string;
    size_variants?: string[];
    description?: string;
    stock: number;
    created_at?: string;
}

interface ProductCardProps {
    product: Product;
    className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
    const { addItem } = useCartStore();

    // Use price_offer as the primary price if available
    const displayPrice = product.price_offer || product.price_base;
    const hasDiscount = product.price_offer && product.price_offer < product.price_base;

    return (
        <div className={cn("group flex flex-col gap-3", className)}>
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-100">
                <Link href={`/product/${product.id}`} className="block h-full w-full">
                    <Image
                        src={product.main_image || ""}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </Link>
                {product.tag && (
                    <div className="absolute left-3 top-3 bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                        {product.tag}
                    </div>
                )}
                {product.stock <= 0 && (
                    <div className="absolute right-3 top-3 bg-white/90 backdrop-blur-sm px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-black shadow-sm z-10 pointer-events-none rounded-sm border border-zinc-100">
                        Out of Stock
                    </div>
                )}
                {product.stock > 0 && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            addItem(product);
                        }}
                        className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 active:scale-90 z-20"
                    >
                        <Plus size={20} />
                    </button>
                )}
            </div>
            <div className="flex flex-col gap-1">
                <Link href={`/product/${product.id}`}>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-300 mb-1 block">
                        {product.categories?.name || product.category || "General"}
                    </span>
                    <h3 className="text-[12px] md:text-[13px] font-normal text-zinc-500 lowercase leading-tight">
                        {product.name}
                    </h3>
                </Link>
                <div className="flex items-center gap-2">
                    {hasDiscount ? (
                        <>
                            <span className="text-[12px] md:text-[13px] font-medium text-black">
                                ₹{displayPrice.toFixed(2)}
                            </span>
                            <span className="text-[12px] md:text-[13px] text-zinc-400 line-through">
                                ₹{product.price_base.toFixed(2)}
                            </span>
                        </>
                    ) : (
                        <span className="text-[12px] md:text-[13px] font-medium text-black">
                            ₹{displayPrice.toFixed(2)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
