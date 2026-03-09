import { NextResponse } from "next/server";
export const preferredRegion = "sin1";
import Razorpay from "razorpay";
import { z } from "zod";
import { verifyAuth } from "@/lib/auth-server";

const razorpay = new Razorpay({
    key_id: (process.env.RAZORPAY_KEY_ID || "dummy_key_id").trim(),
    key_secret: (process.env.RAZORPAY_KEY_SECRET || "dummy_key_secret").trim(),
});

const CheckoutSchema = z.object({
    amount: z.number().positive("Amount must be positive"),
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

        const { amount, currency, receipt, email, userId } = validated.data;

        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // convert to paise
            currency,
            receipt,
            notes: {
                userId: userId || authResult.uid,
                email: email || authResult.email || "",
                source: "blactify_web_checkout"
            }
        });

        return NextResponse.json(order);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
