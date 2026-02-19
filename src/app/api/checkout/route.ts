import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const CheckoutSchema = z.object({
    amount: z.number().positive("Amount must be positive"),
    currency: z.string().default("INR"),
    receipt: z.string().min(1, "Receipt is required"),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validated = CheckoutSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: validated.error.issues[0].message }, { status: 400 });
        }

        const { amount, currency, receipt } = validated.data;

        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // convert to paise
            currency,
            receipt,
        });

        return NextResponse.json(order);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
