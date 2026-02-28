import { supabase } from "@/lib/supabase";
import { unstable_cache } from "next/cache";
import ShopClient from "./ShopClient";
import type { Product } from "@/types/database";

export const revalidate = 120;

export const metadata = {
    title: "Store - Blactify",
    description: "Discover curated premium apparel and accessories.",
};

const getCategories = unstable_cache(
    async () => {
        try {
            const { data, error } = await supabase
                .from("categories")
                .select("name, products(id)");
            if (error) throw error;
            if (data) {
                const categoriesWithCounts = data.map((c: { name: string, products: { id: string }[] | null }) => ({
                    name: c.name,
                    count: Array.isArray(c.products) ? c.products.length : c.products ? 1 : 0
                }));

                // Sort by count descending
                categoriesWithCounts.sort((a, b) => b.count - a.count);
                return ["All", ...categoriesWithCounts.map((c) => c.name)];
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
        return ["All"];
    },
    ["shop-categories"],
    { revalidate: 120, tags: ["shop-categories"] }
);

const getProducts = unstable_cache(
    async () => {
        try {
            const { data, error } = await supabase
                .from("products")
                .select(`
                    *,
                    categories(name),
                    product_images(url),
                    product_variants(stock)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []) as Product[];
        } catch (error) {
            console.error("Error fetching products:", error);
            return [];
        }
    },
    ["shop-products"],
    { revalidate: 120, tags: ["shop-products"] }
);


import { Suspense } from "react";
import Image from "next/image";

function ShopSkeleton() {
    return (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="relative w-32 h-32 mb-6">
                <Image
                    src="/logo-v1.png"
                    alt="Blactify"
                    fill
                    sizes="128px"
                    className="object-contain animate-pulse"
                    priority
                />
            </div>
            <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400 animate-pulse">
                    Blactify
                </span>
                <div className="h-[1px] w-12 bg-zinc-100 animate-pulse" />
                <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-zinc-300">
                    Curating Essentials
                </span>
            </div>
        </div>
    );
}

async function ShopContent() {
    const [categories, products] = await Promise.all([
        getCategories(),
        getProducts()
    ]);

    return <ShopClient initialProducts={products} initialCategories={categories} />;
}

export default async function ShopPage() {
    return (
        <Suspense fallback={<ShopSkeleton />}>
            <ShopContent />
        </Suspense>
    );
}
