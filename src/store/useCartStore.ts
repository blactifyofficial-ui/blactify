import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/components/ui/ProductCard";

interface CartItem extends Product {
    quantity: number;
    size?: string;
    cartId: string;
}

interface CartStore {
    items: CartItem[];
    addItem: (product: Product, size?: string) => void;
    removeItem: (cartId: string) => void;
    updateQuantity: (cartId: string, quantity: number) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product, size) => {
                const items = get().items;
                const cartId = size ? `${product.id}-${size}` : product.id;
                const existingItem = items.find((item) => (item.cartId || item.id) === cartId);

                if (existingItem) {
                    set({
                        items: items.map((item) =>
                            (item.cartId || item.id) === cartId
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        ),
                    });
                } else {
                    set({ items: [...items, { ...product, quantity: 1, size, cartId }] });
                }
            },
            removeItem: (cartId) => {
                set({
                    items: get().items.filter((item) => (item.cartId || item.id) !== cartId),
                });
            },
            updateQuantity: (cartId, quantity) => {
                set({
                    items: get().items.map((item) =>
                        (item.cartId || item.id) === cartId ? { ...item, quantity } : item
                    ),
                });
            },
            clearCart: () => set({ items: [] }),
            getTotalItems: () =>
                get().items.reduce((acc, item) => acc + item.quantity, 0),
            getTotalPrice: () =>
                get().items.reduce((acc, item) => acc + (item.price_offer || item.price_base) * item.quantity, 0),
        }),
        {
            name: "blactify-cart-storage",
        }
    )
);
