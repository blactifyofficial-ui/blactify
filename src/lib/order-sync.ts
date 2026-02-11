import { supabase } from "./supabase";

export async function saveOrder(orderData: {
    razorpay_order_id: string;
    razorpay_payment_id?: string;
    user_id: string;
    amount: number;
    currency: string;
    items: unknown[];
    status: string;
}) {
    try {
        const { error } = await supabase
            .from("orders")
            .insert({
                id: orderData.razorpay_order_id,
                payment_id: orderData.razorpay_payment_id,
                user_id: orderData.user_id,
                amount: orderData.amount,
                currency: orderData.currency,
                items: orderData.items as unknown, // Supabase needs json
                status: orderData.status,
                created_at: new Date().toISOString(),
            });

        if (error) {
            console.group("🔴 Supabase Order Save Error Detail");
            console.error("Message:", error.message);
            console.error("Details:", error.details);
            console.error("Code:", error.code);
            console.error("Hint:", error.hint);
            console.error("Full Object:", JSON.stringify(error, null, 2));
            console.groupEnd();
            return { success: false, error };
        }
        return { success: true };
    } catch (err) {
        console.error("🔴 Unexpected error in saveOrder:", err);
        return { success: false, error: err };
    }
}
