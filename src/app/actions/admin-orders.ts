"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyActionAdminAuth } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function searchUsers(query: string, token?: string) {
    try {
        await verifyActionAdminAuth(token);
        if (!query || query.length < 2) return { success: true, users: [] };

        const { data, error } = await supabaseAdmin
            .from("profiles")
            .select("id, email, full_name")
            .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
            .limit(10);

        if (error) throw error;
        return { success: true, users: data || [] };
    } catch (err) {
        console.error("Search users failed:", err);
        return { success: false, users: [], error: "Search failed" };
    }
}

export async function searchProducts(query: string, token?: string) {
    try {
        await verifyActionAdminAuth(token);
        if (!query || query.length < 2) {
            // Fetch top products if no query
            const { data, error } = await supabaseAdmin
                .from("products")
                .select("id, name, price_base, price_offer, product_variants(id, size, stock), product_images(url, position)")
                .limit(10);
            if (error) throw error;
            return { success: true, products: data || [] };
        }

        const { data, error } = await supabaseAdmin
            .from("products")
            .select("id, name, price_base, price_offer, product_variants(id, size, stock), product_images(url, position)")
            .ilike("name", `%${query}%`)
            .limit(10);

        if (error) throw error;
        return { success: true, products: data || [] };
    } catch (err) {
        console.error("Search products failed:", err);
        return { success: false, products: [], error: "Search failed" };
    }
}

interface ManualOrderData {
    user_id?: string;
    customer_details: {
        name: string;
        email: string;
        phone: string;
    };
    shipping_address: {
        address: string;
        city: string;
        district: string;
        state: string;
        pincode: string;
    };
    items: Array<{
        product_id: string;
        variant_id: string;
        quantity: number;
        price: number;
        name: string;
        size: string;
        image?: string;
    }>;
    payment: {
        method: string;
        id?: string;
        status: string;
    };
}

export async function createManualOrder(data: ManualOrderData, token?: string) {
    try {
        await verifyActionAdminAuth(token);

        // Generate a custom Order ID for manual orders
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const manualOrderId = `MNO-${timestamp}${random}`;

        const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        // Add shipping if needed (defaulting to 0 for manual for now or logic from cart)
        const shippingCharge = subtotal >= 2999 ? 0 : (data.shipping_address.state === "Kerala" ? 59 : 79);
        const totalAmount = subtotal + shippingCharge;

        // 1. Call the atomic RPC for order creation and stock decrement
        const { data: result, error: rpcError } = await supabaseAdmin.rpc('create_order_v2', {
            p_order_id: manualOrderId,
            p_user_id: data.user_id || 'guest',
            p_amount: totalAmount,
            p_currency: 'INR',
            p_status: data.payment.status,
            p_shipping_address: data.shipping_address,
            p_customer_details: data.customer_details,
            p_payment_details: {
                method: data.payment.method,
                id: data.payment.id,
                manual: true,
                created_by: "admin"
            },
            p_items: data.items.map(item => ({
                id: item.product_id,
                size: item.size,
                quantity: item.quantity,
                price_base: item.price, // Map manual price to base/offer
                price_offer: null
            }))
        });

        if (rpcError || !result?.success) {
            throw new Error(rpcError?.message || result?.error || "Order creation failed at DB level");
        }

        revalidatePath("/admin/orders");
        return { success: true, orderId: manualOrderId };
    } catch (err: unknown) {
        console.error("Create manual order failed:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to create order";
        return { success: false, error: errorMessage };
    }
}
