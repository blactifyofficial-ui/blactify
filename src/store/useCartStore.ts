import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types/database";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getStoreSettings } from "@/app/actions/settings";

interface CartItem extends Product {
    quantity: number;
    size?: string;
    cartId: string;
}

interface CartStore {
    items: CartItem[];
    addItem: (product: Product, size?: string) => Promise<boolean>;
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
                const settings = await getStoreSettings();
                if (settings && !settings.purchases_enabled) {
                    toast.error("Store is temporarily paused");
                    return false;
                }

                const items = get().items;
                const cartId = size ? `${product.id}-${size}` : product.id;

                let currentStock = 0;

                if (size) {
                    // Fetch variant-specific stock
                    const { data: variantData } = await supabase
                        .from("product_variants")
                        .select("stock")
                        .eq("product_id", product.id)
                        .eq("size", size)
                        .maybeSingle(); // Use maybeSingle to avoid error if no variant exists yet

                    if (variantData) {
                        currentStock = variantData.stock;
                    } else {
                        // If variant doesn't exist in DB yet, check if size is in product's size_variants
                        // and fallback to product's main stock (for legacy/transition)
                        const { data: mainProduct } = await supabase
                            .from("products")
                            .select("size_variants")
                            .eq("id", product.id)
                            .single();

                        const hasSize = mainProduct?.size_variants?.includes(size);
                        // If size is in size_variants but NO variant exists in product_variants table,
                        // it means normalization is incomplete for this product. 
                        // Returning 0 is safe as it will show "out of stock" rather than crashing.
                        currentStock = 0;
                    }
                } else {
                    // Fetch total product stock (sum of variants)
                    const { data: latestProduct } = await supabase
                        .from("products")
                        .select("product_variants(stock)")
                        .eq("id", product.id)
                        .single();

                    if (latestProduct?.product_variants && latestProduct.product_variants.length > 0) {
                        currentStock = latestProduct.product_variants.reduce((acc: number, v: any) => acc + v.stock, 0);
                    } else {
                        currentStock = 0;
                    }
                }

                const existingItem = items.find((item) => item.cartId === cartId);

                if (existingItem) {
                    if (existingItem.quantity >= 5) {
                        toast.error("Maximum limit of 5 items per product reached");
                        return false;
                    }
                    if (existingItem.quantity >= currentStock) {
                        toast.error(`Only ${currentStock} items available in stock`);
                        return false;
                    }
                    set({
                        items: items.map((item) =>
                            item.cartId === cartId
                                ? { ...item, quantity: item.quantity + 1, stock: currentStock }
                                : item
                        ),
                    });
                } else {
                    if (currentStock <= 0) {
                        toast.error("Item is out of stock");
                        return false;
                    }
                    set({ items: [...items, { ...product, quantity: 1, size, cartId, stock: currentStock }] });
                }
                toast.success(`${product.name} added to bag`);
                return true;
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

                if (quantity > (item.stock ?? 0)) {
                    toast.error(`Only ${item.stock ?? 0} items available in stock`);
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
