import productsData from "../../products.json";
import { Product } from "@/components/ui/ProductCard";

interface RawProduct {
    id: number | string;
    title: string;
    price: string | number;
    images: string[];
    category: string;
}

export const ALL_PRODUCTS: Product[] = (productsData as unknown as RawProduct[]).map((p) => ({
    id: String(p.id),
    name: p.title,
    price: Math.round(parseFloat(String(p.price)) * 80),
    imageUrl: p.images[0] || "/hero-placeholder.jpg",
    category: p.category,
    tag: p.title.toLowerCase().includes("nitro") ? "Nitro" : undefined
}));

export const MOCK_PRODUCTS: Product[] = ALL_PRODUCTS.slice(0, 10);

export const getProductById = (id: string) => ALL_PRODUCTS.find(p => p.id === id);
