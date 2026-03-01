import { supabase } from "@/lib/supabase";
import { unstable_cache } from "next/cache";
import type { Product, ProductVariant } from "@/types/database";

export const getCategories = unstable_cache(
    async () => {
        try {
            const { data, error } = await supabase
                .from("categories")
                .select("name, products(id)");
            if (error) throw error;
            if (data) {
                const categoriesWithCounts = data.map((c: { name: string; products: unknown }) => ({
                    name: c.name,
                    count: Array.isArray(c.products) ? c.products.length : c.products ? 1 : 0
                }));

                categoriesWithCounts.sort((a, b) => b.count - a.count);
                return ["All", ...categoriesWithCounts.map((c) => c.name)];
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
        return ["All"];
    },
    ["shop-categories"],
    { revalidate: 60, tags: ["shop-categories"] }
);

export const getAllCachedProducts = unstable_cache(
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
    { revalidate: 60, tags: ["shop-products"] }
);

interface GetProductsOptions {
    limit?: number;
    offset?: number;
    category?: string;
    search?: string;
    sortBy?: string;
}

export async function getProducts(options?: GetProductsOptions) {
    const allProducts = await getAllCachedProducts();
    let filteredProducts = [...allProducts];

    const search = options?.search?.toLowerCase();
    if (search) {
        filteredProducts = filteredProducts.filter((p) =>
            p.name.toLowerCase().includes(search)
        );
    }

    const category = options?.category;
    if (category && category !== "All") {
        filteredProducts = filteredProducts.filter((p) => {
            const catField = p.categories as { name: string } | { name: string }[] | null;
            if (!catField) return false;
            if (Array.isArray(catField)) {
                return catField.some(c => c.name === category);
            }
            if (typeof catField === 'object' && catField.name) {
                return catField.name === category;
            }
            return false;
        });
    }

    const sortBy = options?.sortBy || "mixed";
    if (sortBy === "mixed") {
        filteredProducts.sort((a, b) => {
            const hashA = a.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const hashB = b.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return (hashA % 13) - (hashB % 13) || a.id.localeCompare(b.id);
        });
    } else if (sortBy === "price-low") {
        filteredProducts.sort((a, b) => a.price_base - b.price_base);
    } else if (sortBy === "price-high") {
        filteredProducts.sort((a, b) => b.price_base - a.price_base);
    } else if (sortBy === "newest") {
        filteredProducts.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    // Sort out-of-stock items to the bottom
    filteredProducts.sort((a, b) => {
        const aOutOfStock = (a.product_variants?.every((v: ProductVariant) => v.stock <= 0) ?? (a.stock ?? 0) <= 0);
        const bOutOfStock = (b.product_variants?.every((v: ProductVariant) => v.stock <= 0) ?? (b.stock ?? 0) <= 0);

        if (aOutOfStock && !bOutOfStock) return 1;
        if (!aOutOfStock && bOutOfStock) return -1;
        return 0;
    });

    const offset = options?.offset || 0;
    const limit = options?.limit;

    const paginatedProducts = limit ? filteredProducts.slice(offset, offset + limit) : filteredProducts.slice(offset);

    return {
        products: paginatedProducts,
        total: filteredProducts.length,
        hasMore: limit ? offset + limit < filteredProducts.length : false
    };
}
