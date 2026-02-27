"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { Plus } from "lucide-react";
import { useAuth } from "@/store/AuthContext";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Magnetic } from "@/components/ui/Magnetic";

import { Product } from "@/types/database";

export type { Product }; // Re-export for compatibility

interface ProductCardProps {
    product: Product;
    className?: string;
    onImageLoad?: () => void;
    hidePrice?: boolean;
}

export function ProductCard({ product, className, onImageLoad, hidePrice }: ProductCardProps) {
    const { addItem } = useCartStore();
    const { user } = useAuth();
    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        gsap.from(container.current, {
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
                trigger: container.current,
                start: "top bottom-=100px",
                toggleActions: "play none none none"
            }
        });
    }, { scope: container });

    // Use price_offer as the primary price if available
    const displayPrice = product.price_offer || product.price_base;
    const hasDiscount = product.price_offer && product.price_offer < product.price_base;

    return (
        <div ref={container} className={cn("group flex flex-col gap-3", className)}>
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-100">
                <Link href={`/product/${product.handle || product.id}`} className="relative block h-full w-full bg-zinc-50">
                    {(product.product_images?.[0]?.url || product.main_image) ? (
                        <Image
                            src={product.product_images?.[0]?.url || product.main_image || ""}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            priority={false}
                            onLoad={onImageLoad}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                            No Image
                        </div>
                    )}
                </Link>
                {product.tag && (
                    <div className="absolute left-3 top-3 bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                        {product.tag}
                    </div>
                )}
                {(product.product_variants?.every(v => v.stock <= 0) ?? (product.stock ?? 0) <= 0) && (
                    <div className="absolute right-3 top-3 bg-white/90 backdrop-blur-sm px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-black shadow-sm z-10 pointer-events-none rounded-sm border border-zinc-100">
                        Out of Stock
                    </div>
                )}
                {(product.product_variants?.some(v => v.stock > 0) ?? (product.stock ?? 0) > 0) && (
                    <div className="absolute bottom-3 right-3 z-20">
                        <Magnetic strength={0.3}>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (!user) {
                                        window.dispatchEvent(new CustomEvent("open-auth-modal"));
                                        return;
                                    }
                                    addItem(product);
                                }}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 active:scale-90"
                            >
                                <Plus size={20} />
                            </button>
                        </Magnetic>
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-1">
                <Link href={`/product/${product.handle || product.id}`}>
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-300 mb-1 block">
                        {product.categories?.name || product.category || "General"}
                    </span>
                    <h3 className="text-[11px] md:text-[12px] font-normal text-zinc-500 lowercase leading-tight">
                        {product.name}
                    </h3>
                </Link>
                {!hidePrice && (
                    <div className="flex items-center gap-2">
                        {hasDiscount ? (
                            <>
                                <span className="text-[11px] md:text-[12px] font-medium text-black">
                                    ₹{displayPrice.toFixed(2)}
                                </span>
                                <span className="text-[11px] md:text-[12px] text-zinc-400 line-through">
                                    ₹{product.price_base.toFixed(2)}
                                </span>
                            </>
                        ) : (
                            <span className="text-[11px] md:text-[12px] font-medium text-black">
                                ₹{displayPrice.toFixed(2)}
                            </span>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
