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
    handle: p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    price_base: Math.round(parseFloat(String(p.price)) * 1.2),
    price_offer: Math.round(parseFloat(String(p.price))),
    main_image: p.images[0] || "/hero-placeholder.jpg",
    category: p.category,
    tag: p.title.toLowerCase().includes("nitro") ? "Nitro" : undefined
}));

export const MOCK_PRODUCTS: Product[] = [
    {
        id: "1",
        name: "Godless_By Moebius",
        handle: "godless-by-moebius",
        price_base: 2220,
        price_offer: 1850,
        main_image: "https://cdn.shopify.com/s/files/1/0661/7423/files/godless-by-mobeius-25bcb002or-6414898.jpg?v=1757763173",
        category: "Baseball Caps",
        tag: "Summer Collection"
    },
    {
        id: "2",
        name: "Sangharsh_By Okami",
        handle: "sangharsh-by-okami",
        price_base: 2220,
        price_offer: 1850,
        main_image: "https://cdn.shopify.com/s/files/1/0661/7423/files/sangharsh-by-okami-25sas001blk-7217368.jpg?v=1757763171",
        category: "Snapback Caps",
        tag: "New Arrival"
    }
];

export const getProductById = (id: string) => {
    return ALL_PRODUCTS.find(p => p.id === id);
};
