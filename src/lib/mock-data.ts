import productsData from "../../products.json";
import { Product } from "@/components/ui/ProductCard";

export const ALL_PRODUCTS: Product[] = (productsData as any[]).map((p) => ({
    id: String(p.id),
    name: p.title as string,
    price: Math.round(parseFloat(p.price as string) * 80),
    imageUrl: (p.images as string[])[0] || "/hero-placeholder.jpg",
    category: p.category as string,
    tag: (p.title as string).toLowerCase().includes("nitro") ? "Nitro" : undefined
}));

export const MOCK_PRODUCTS: Product[] = ALL_PRODUCTS.slice(0, 10);

export const getProductById = (id: string) => ALL_PRODUCTS.find(p => p.id === id);
