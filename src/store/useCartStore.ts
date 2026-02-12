import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/components/ui/ProductCard";
import { toast } from "sonner";

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
    getSubtotal: () => number;
    getTotalPrice: () => number;
    discountCode: string | null;
    applyDiscount: (code: string) => void;
    removeDiscount: () => void;
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
                    if (existingItem.quantity >= 5) {
                        toast.error("Maximum limit of 5 items per product reached");
                        return;
                    }
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
                toast.success(`${product.name} added to bag`);
            },
            removeItem: (cartId) => {
                const item = get().items.find((i) => (i.cartId || i.id) === cartId);
                set({
                    items: get().items.filter((item) => (item.cartId || item.id) !== cartId),
                });
                if (item) toast.success(`${item.name} removed from bag`);
            },
            updateQuantity: (cartId, quantity) => {
                if (quantity > 5) {
                    toast.error("Maximum limit of 5 items per product reached");
                    return;
                }
                set({
                    items: get().items.map((item) =>
                        (item.cartId || item.id) === cartId ? { ...item, quantity } : item
                    ),
                });
            },
            clearCart: () => {
                set({ items: [] });
                toast.success("Bag cleared");
            },
            getTotalItems: () =>
                get().items.reduce((acc, item) => acc + item.quantity, 0),
            getSubtotal: () =>
                get().items.reduce((acc, item) => acc + (item.price_offer || item.price_base) * item.quantity, 0),
            getTotalPrice: () => {
                const subtotal = get().getSubtotal();
                const discountCode = get().discountCode;
                if (discountCode === "WELCOME10") {
                    return subtotal * 0.9;
                }
                return subtotal;
            },
            discountCode: null,
            applyDiscount: (code) => {
                set({ discountCode: code });
                toast.success(`Coupon code ${code} applied`);
            },
            removeDiscount: () => {
                const code = get().discountCode;
                set({ discountCode: null });
                if (code) toast.success(`Coupon code ${code} removed`);
            },
        }),
        {
            name: "blactify-cart-storage",
        }
    )
);
