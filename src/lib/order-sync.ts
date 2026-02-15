import { supabase } from "./supabase";

export async function saveOrder(orderData: {
    user_id: string;
    items: unknown;
    amount: number;
    currency: string;
    shipping_address: unknown;
    customer_details: unknown;
    status: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
}) {
    // Helper to decrement stock using secure RPC
    const decrementStockSecure = async (items: any[]) => {
        try {
            console.log("📦 Starting atomic stock decrement for:", items.map(i => ({ id: i.id, qty: i.quantity })));
            for (const item of items) {
                const { data: success, error: stockError } = await supabase.rpc('decrement_stock_secure', {
                    p_product_id: String(item.id),
                    p_quantity: item.quantity
                });

                console.log(`🔍 RPC Result for ${item.id}:`, { success, stockError });

                if (stockError || !success) {
                    const errorMsg = stockError?.message || `Insufficient stock for ${item.name || item.id}`;
                    console.error(`❌ Failed to decrement stock for product ${item.id}:`, {
                        error: stockError,
                        success,
                        item
                    });
                    throw new Error(errorMsg);
                }
            }
            console.log("✅ Stock decrement successful for all items");
        } catch (err) {
            console.error("🔴 Error in atomic stock decrement:", err);
            throw err;
        }
    };

    try {
        // 1. Try to decrement stock first as an atomic operation
        // This acts as a final check and reservation
        await decrementStockSecure(orderData.items as any[]);

        // 2. If stock decrement was successful, save the order
        const { error } = await supabase
            .from("orders")
            .insert([
                {
                    id: orderData.razorpay_order_id || `order_${Date.now()}`, // Using order_id as PK as per schema
                    payment_id: orderData.razorpay_payment_id,
                    user_id: orderData.user_id,
                    items: orderData.items,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    shipping_address: orderData.shipping_address,
                    customer_details: orderData.customer_details,
                    status: orderData.status,
                },
            ]);

        if (error) {
            console.group("🔴 Supabase Order Save Error Detail");
            console.error("Message:", error.message);
            console.error("Details:", error.details);
            console.groupEnd();
            return { success: false, error };
        }

        return { success: true };
    } catch (err: any) {
        console.error("🔴 Unexpected error in saveOrder:", err);

        let userMessage = "An unexpected error occurred during checkout. Please try again.";
        const techMessage = err.message || "";

        if (techMessage.includes("decrement_stock_secure") && techMessage.includes("schema cache")) {
            userMessage = "Checkout system maintenance. Please try again in a few minutes.";
        } else if (techMessage.includes("Insufficient stock") || techMessage.includes("stock")) {
            userMessage = techMessage; // Already user-friendly or contains product name
        } else if (techMessage.includes("not found")) {
            userMessage = "One or more items in your cart are no longer available.";
        } else if (techMessage.includes("Razorpay")) {
            userMessage = "Payment verification failed. Please check your bank and contact us if the amount was deducted.";
        }

        return { success: false, error: { message: userMessage, technical: techMessage } };
    }
}
