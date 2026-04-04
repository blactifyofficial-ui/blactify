import { NextResponse } from "next/server";
export const preferredRegion = "sin1";
import Razorpay from "razorpay";
import { z } from "zod";
import { verifyAuth } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const razorpay = new Razorpay({
    key_id: (process.env.RAZORPAY_KEY_ID || "dummy_key_id").trim(),
    key_secret: (process.env.RAZORPAY_KEY_SECRET || "dummy_key_secret").trim(),
});

// Robust schema for server-side validation
const CheckoutSchema = z.object({
    items: z.array(z.object({
        id: z.string(),
        quantity: z.number().int().positive(),
        price_base: z.number(),
        price_offer: z.number().optional().nullable()
    })).min(1, "Items are required"),
    discountCode: z.string().optional(),
    state: z.string().optional().default("Kerala"),
    currency: z.string().default("INR"),
    receipt: z.string().min(1, "Receipt is required"),
    email: z.string().email().optional(),
    userId: z.string().optional(),
});

export async function POST(req: Request) {
    const authResult = await verifyAuth(req);
    if (authResult.error) return authResult.error;

    try {
        const body = await req.json();
        const validated = CheckoutSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: validated.error.issues[0].message }, { status: 400 });
        }

        const { items, discountCode, state, currency, receipt, email, userId } = validated.data;

        // --- 🔒 SECURITY: SERVER-SIDE AMOUNT CALCULATION ---
        const productIds = items.map(i => i.id);
        const { data: products, error: dbError } = await supabaseAdmin
            .from("products")
            .select("id, price_base, price_offer")
            .in("id", productIds);

        if (dbError || !products) {
            return NextResponse.json({ error: "Failed to verify product prices" }, { status: 500 });
        }

        let calculatedSubtotal = 0;
        for (const item of items) {
            const product = products.find(p => p.id === item.id);
            if (!product) {
                return NextResponse.json({ error: `Product ${item.id} not found` }, { status: 404 });
            }
            
            // Use the offer price if available, otherwise base price (from DB, not client!)
            const unitPrice = product.price_offer || product.price_base;
            calculatedSubtotal += unitPrice * item.quantity;
        }

        // Apply discount (e.g., WELCOME10)
        let totalAmount = calculatedSubtotal;
        if (discountCode === "WELCOME10") {
            totalAmount = Math.round(calculatedSubtotal * 0.9);
        }

        // Calculate Shipping (Business Logic)
        // Free shipping above 2999, else 59 in Kerala, 79 outside.
        const shippingCharge = totalAmount >= 2999 ? 0 : (state === "Kerala" ? 59 : 79);
        totalAmount += shippingCharge;

        const order = await razorpay.orders.create({
            amount: Math.round(totalAmount * 100), // convert to paise
            currency,
            receipt,
            notes: {
                userId: userId || authResult.uid,
                email: email || authResult.email || "",
                itemsCount: String(items.length),
                source: "blactify_secure_checkout",
                initiated_at: new Date().toISOString()
            }
        });

        return NextResponse.json(order);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

