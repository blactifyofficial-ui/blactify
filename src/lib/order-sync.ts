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
            for (const item of items) {
                const { data: success, error: stockError } = await supabase.rpc('decrement_stock_secure', {
                    product_id: item.id,
                    quantity_to_remove: item.quantity
                });

                if (stockError || !success) {
                    console.error(`Failed to decrement stock for product ${item.id}:`, stockError || "Insufficient stock");
                    throw new Error(stockError?.message || `Insufficient stock for ${item.name}`);
                }
            }
        } catch (err) {
            console.error("Error in atomic stock decrement:", err);
            throw err; // Re-throw to handle in main try-catch
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
        return { success: false, error: err.message || "An unexpected error occurred during checkout" };
    }
}
