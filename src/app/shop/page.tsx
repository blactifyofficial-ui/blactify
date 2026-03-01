import { Suspense } from "react";
import Image from "next/image";
import { getCategories, getProducts } from "./data";
import { ProductGrid } from "./ProductGrid";
import { LoadMore } from "./LoadMore";
import { ScrollToTop } from "@/components/ui/ScrollToTop";

import Filters from "./DynamicFilters";

export const revalidate = 60;

export const metadata = {
    title: "Store - Blactify",
    description: "Discover curated premium apparel and accessories.",
};

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

// Ensure the page takes valid searchParams type (Next.js App router specific, Promise in v15+)
export default async function ShopPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;

    const search = typeof params?.search === 'string' ? params.search : undefined;
    const category = typeof params?.category === 'string' ? params.category : undefined;
    const sortBy = typeof params?.sortBy === 'string' ? params.sortBy : undefined;

    const limit = 8;

    const [categories, result] = await Promise.all([
        getCategories(),
        getProducts({ limit, search, category, sortBy, offset: 0 })
    ]);

    return (
        <Suspense fallback={<ShopSkeleton />}>
            <main className="min-h-screen bg-white pb-20 pt-8 animate-in fade-in duration-700">
                <div className="px-6">
                    <Filters
                        categories={categories}
                        totalResults={result.total}
                        initialSearch={search}
                        initialCategory={category}
                        initialSortBy={sortBy}
                    />

                    <div className="relative min-h-[400px]">
                        {result.products.length > 0 ? (
                            <>
                                <ProductGrid products={result.products} />
                                <LoadMore
                                    initialHasMore={result.hasMore}
                                    limit={limit}
                                    search={search}
                                    category={category}
                                    sortBy={sortBy}
                                />
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <p className="text-zinc-500 font-sans italic">No items found matching your filter.</p>
                            </div>
                        )}
                    </div>
                </div>
                <ScrollToTop />
            </main>
        </Suspense>
    );
}
