import { z } from "zod";

// --- AUTH SCHEMAS ---
export const EmailSchema = z.string().email("Invalid email address");
export const OTPSchema = z.string().length(6, "OTP must be exactly 6 characters").regex(/^[A-Z0-9]+$/, "Invalid OTP format");

// --- SUPPORT SCHEMAS ---
export const SupportTicketSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    orderId: z.string().optional().nullable(),
    category: z.enum(["order_related", "general", "return_request", "other"]),
    phone: z.string().min(10, "Valid phone number is required").max(15),
    message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

// --- ORDER SCHEMAS ---
export const OrderItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    size: z.string().optional(),
    quantity: z.number().int().positive(),
    price_base: z.number(),
    price_offer: z.number().optional().nullable(),
});

export const AddressSchema = z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postal_code: z.string().min(6),
    country: z.string().default("IN"),
});

export const CustomerDetailsSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
});

export const OrderSyncSchema = z.object({
    user_id: z.string(),
    items: z.array(OrderItemSchema),
    amount: z.number().positive(),
    currency: z.string().default("INR"),
    shipping_address: AddressSchema,
    customer_details: CustomerDetailsSchema,
    status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "failed"]),
    razorpay_order_id: z.string().optional(),
    razorpay_payment_id: z.string().optional(),
    payment_details: z.record(z.string(), z.unknown()).optional(),
});
