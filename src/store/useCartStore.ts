import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/components/ui/ProductCard";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface CartItem extends Product {
    quantity: number;
    size?: string;
    cartId: string;
}

interface CartStore {
    items: CartItem[];
    addItem: (product: Product, size?: string) => Promise<void>;
    removeItem: (cartId: string) => void;
    updateQuantity: (cartId: string, quantity: number) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getSubtotal: () => number;
    getTotalPrice: () => number;
    getShippingCharge: () => number;
    discountCode: string | null;
    applyDiscount: (code: string) => void;
    removeDiscount: () => void;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: async (product, size) => {
                const items = get().items;
                const cartId = size ? `${product.id}-${size}` : product.id;

                // Fetch real-time stock before adding
                const { data: latestProduct } = await supabase
                    .from("products")
                    .select("stock")
                    .eq("id", product.id)
                    .single();

                const currentStock = latestProduct?.stock ?? product.stock;
                const existingItem = items.find((item) => (item.cartId || item.id) === cartId);

                if (existingItem) {
                    if (existingItem.quantity >= 5) {
                        toast.error("Maximum limit of 5 items per product reached");
                        return;
                    }
                    if (existingItem.quantity >= currentStock) {
                        toast.error(`Only ${currentStock} items available in stock`);
                        return;
                    }
                    set({
                        items: items.map((item) =>
                            (item.cartId || item.id) === cartId
                                ? { ...item, quantity: item.quantity + 1, stock: currentStock }
                                : item
                        ),
                    });
                } else {
                    if (currentStock <= 0) {
                        toast.error("Item is out of stock");
                        return;
                    }
                    set({ items: [...items, { ...product, quantity: 1, size, cartId, stock: currentStock }] });
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
                const item = get().items.find((i) => (i.cartId || i.id) === cartId);
                if (!item) return;

                if (quantity > item.stock) {
                    toast.error(`Only ${item.stock} items available in stock`);
                    return;
                }
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
                const shipping = get().getShippingCharge();
                const discountCode = get().discountCode;
                let total = subtotal;

                if (discountCode === "WELCOME10") {
                    total = subtotal * 0.9;
                }

                return total + shipping;
            },
            getShippingCharge: () => {
                const subtotal = get().getSubtotal();
                if (subtotal === 0) return 0;
                return subtotal < 2999 ? 59 : 0;
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
