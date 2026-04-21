"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { StudioBookingSchema } from "@/lib/schemas";
import { z } from "zod";
import { sendMulticastAdminNotification } from "@/lib/notifications-server";
import { SELLER_CONFIG } from "@/lib/config";
import { verifyActionAdminAuth } from "@/lib/auth-server";

export async function createStudioBooking(formData: z.infer<typeof StudioBookingSchema>) {
    try {
        const validatedData = StudioBookingSchema.safeParse(formData);
        if (!validatedData.success) {
            return {
                success: false,
                error: validatedData.error.issues[0].message
            };
        }

        const data = validatedData.data;

        // Insert into database
        const { data: booking, error } = await supabaseAdmin
            .from("studio_bookings")
            .insert([
                {
                    name: data.name,
                    phone: data.phone,
                    booking_date: data.booking_date,
                    start_time: data.start_time,
                    duration: data.duration,
                    photo_type: data.photo_type,
                    query: data.query,
                    status: "pending"
                }
            ])
            .select()
            .single();

        if (error) {
            console.error("Booking Logic Error:", error);
            return {
                success: false,
                error: "Failed to save booking. Please try again later."
            };
        }

        // 🚨 SEND NOTIFICATIONS TO ADMIN
        
        // 1. FCM Push Notification
        try {
            await sendMulticastAdminNotification(
                "External Shoot Request",
                `${data.name} requested a ${data.photo_type.replace('_', ' ')} shoot for ${data.booking_date} at ${data.start_time} (${data.duration}).${data.query ? ` Message: ${data.query.substring(0, 50)}...` : ""}`,
                { type: "studio_booking", bookingId: booking.id }
            );
        } catch (fcmErr) {
            console.error("FCM Studio Notification Failure:", fcmErr);
        }

        // 2. Telegram Alert
        if (SELLER_CONFIG.telegramToken && SELLER_CONFIG.telegramChatId) {
            try {
                const message = `
📸 *New Studio Booking*
-----------------------
👤 *Name:* ${data.name}
📞 *Phone:* ${data.phone}
📅 *Date:* ${data.booking_date}
⏰ *Time:* ${data.start_time} (${data.duration})
📂 *Type:* ${data.photo_type.replace('_', ' ')}
${data.query ? `💬 *Query:* ${data.query}` : ''}

🔗 [Manage Bookings](https://blactify.com/admin/studio)
                `.trim();

                const telegramUrl = `https://api.telegram.org/bot${SELLER_CONFIG.telegramToken}/sendMessage`;
                await fetch(telegramUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: SELLER_CONFIG.telegramChatId,
                        text: message,
                        parse_mode: 'Markdown',
                    }),
                });
            } catch (teleErr) {
                console.error("Telegram Studio Notification Failure:", teleErr);
            }
        }

        return { success: true };
    } catch (err: unknown) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "An unexpected error occurred."
        };
    }
}

export async function confirmStudioBooking(bookingId: string, token?: string) {
    try {
        await verifyActionAdminAuth(token);

        // Update status in DB
        const { data: booking, error } = await supabaseAdmin
            .from("studio_bookings")
            .update({ status: "confirmed" })
            .eq("id", bookingId)
            .select()
            .single();

        if (error) throw error;

        // Generate WhatsApp Redirect URL
        // Format: Your booking for [Type] on [Date] is confirmed!
        const message = encodeURIComponent(`Hello ${booking.name}, your Studio Booking for a ${booking.photo_type.replace('_', ' ')} shoot on ${booking.booking_date} has been CONFIRMED. See you soon! - Blactify`);
        const whatsappUrl = `https://wa.me/${booking.phone.replace(/\+/g, '')}?text=${message}`;

        return { 
            success: true, 
            whatsappUrl 
        };
    } catch (err: unknown) {
        return { 
            success: false, 
            error: err instanceof Error ? err.message : "Failed to confirm booking" 
        };
    }
}

export async function getStudioBookings(token?: string) {
    try {
        await verifyActionAdminAuth(token);
        const { data, error } = await supabaseAdmin
            .from("studio_bookings")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { success: true, bookings: data };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Fetch Failed" };
    }
}
export async function createManualStudioBooking(formData: z.infer<typeof StudioBookingSchema> & { status: 'pending' | 'confirmed' }, token?: string) {
    try {
        await verifyActionAdminAuth(token);

        const validatedData = StudioBookingSchema.safeParse(formData);
        if (!validatedData.success) {
            return {
                success: false,
                error: validatedData.error.issues[0].message
            };
        }

        const data = validatedData.data;

        // Insert into database
        const { data: booking, error } = await supabaseAdmin
            .from("studio_bookings")
            .insert([
                {
                    name: data.name,
                    phone: data.phone,
                    booking_date: data.booking_date,
                    start_time: data.start_time,
                    duration: data.duration,
                    photo_type: data.photo_type,
                    query: data.query,
                    status: formData.status
                }
            ])
            .select()
            .single();

        if (error) {
            console.error("Manual Booking Error:", error);
            return {
                success: false,
                error: "Failed to save manual booking."
            };
        }

        return { success: true, booking };
    } catch (err: unknown) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "An unexpected error occurred."
        };
    }
}
