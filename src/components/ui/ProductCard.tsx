"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { Plus } from "lucide-react";

export interface Product {
    id: string;
    name: string;
    price: number;
    discountPrice?: number;
    imageUrl: string;
    category: string;
    tag?: string;
}

interface ProductCardProps {
    product: Product;
    className?: string;
    onClick?: () => void;
}

export function ProductCard({ product, className, onClick }: ProductCardProps) {
    const { addItem } = useCartStore();

    return (
        <div className={cn("group flex flex-col gap-3", className)}>
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-100">
                <Link href={`/product/${product.id}`} className="block h-full w-full" onClick={onClick}>
                    <Image
                        src={product.imageUrl}
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
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        addItem(product);
                    }}
                    className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 active:scale-90"
                >
                    <Plus size={20} />
                </button>
            </div>
            <div className="flex flex-col gap-1">
                <Link href={`/product/${product.id}`} onClick={onClick}>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-300 mb-1 block">
                        {product.category}
                    </span>
                    <h3 className="text-sm font-normal text-zinc-500 lowercase leading-tight">
                        {product.name}
                    </h3>
                </Link>
                <div className="flex items-center gap-2">
                    {product.discountPrice ? (
                        <>
                            <span className="text-sm font-bold text-black">
                                ₹{product.discountPrice.toFixed(2)}
                            </span>
                            <span className="text-sm text-zinc-400 line-through">
                                ₹{product.price.toFixed(2)}
                            </span>
                        </>
                    ) : (
                        <span className="text-sm font-bold text-black">
                            ₹{product.price.toFixed(2)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
