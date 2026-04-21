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

// --- STUDIO BOOKING SCHEMAS ---
export const StudioBookingSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string()
        .min(10, "Phone number must be at least 10 digits")
        .max(15, "Phone number is too long")
        .regex(/^[+]?[0-9\s-]+$/, "Invalid phone number format"),
    booking_date: z.string().min(1, "Booking date is required").refine((date) => {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
    }, { message: "Booking date cannot be in the past" }),
    start_time: z.string().min(1, "Starting time is required"),
    duration: z.string().min(1, "Duration is required"),
    photo_type: z.enum(["model_shoot", "product_shoot", "other"]),
    query: z.string().max(1000, "Message is too long (max 1000 characters)").optional().nullable(),
});

// --- ORDER SCHEMAS ---
export const OrderItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    size: z.string().optional(),
    quantity: z.number().int().positive(),
    price_base: z.number(),
    price_offer: z.number().optional().nullable(),
    main_image: z.string().optional().nullable(),
    product_images: z.array(z.object({ url: z.string() })).optional().nullable(),
});

export const AddressSchema = z.object({
    address: z.string().min(1),
    apartment: z.string().optional(),
    city: z.string().min(1),
    district: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(6),
    country: z.string().default("India"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
});

export const CustomerDetailsSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    secondary_phone: z.string().optional(),
});

export const OrderSyncSchema = z.object({
    user_id: z.string(),
    items: z.array(OrderItemSchema),
    amount: z.number().positive(),
    currency: z.string().default("INR"),
    shipping_address: AddressSchema,
    customer_details: CustomerDetailsSchema,
    status: z.enum(["pending", "unpaid", "paid", "processing", "shipped", "delivered", "failed"]),
    razorpay_order_id: z.string().optional(),
    razorpay_payment_id: z.string().optional(),
    payment_details: z.record(z.string(), z.unknown()).optional(),
    shipping_charge: z.number().optional().nullable(),
});
