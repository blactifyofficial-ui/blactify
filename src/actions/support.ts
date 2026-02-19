"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { Resend } from "resend";
import { SELLER_CONFIG } from "@/lib/config";
import { SupportTicketSchema } from "@/lib/schemas";
import { z } from "zod";

export async function createTicket(formData: z.infer<typeof SupportTicketSchema>) {
    try {
        const validatedData = SupportTicketSchema.safeParse(formData);
        if (!validatedData.success) {
            return {
                success: false,
                error: validatedData.error.issues[0].message
            };
        }
        const data = validatedData.data;

        const { error } = await supabaseAdmin
            .from("support_tickets")
            .insert([
                {
                    user_id: data.userId,
                    order_id: data.orderId || null,
                    category: data.category,
                    phone: data.phone,
                    message: data.message,
                    status: "open",
                }
            ]);

        if (error) {
            return {
                success: false,
                error: "We encountered an issue while saving your ticket. Please check your connection and try again."
            };
        }

        // Send email to Admin
        if (SELLER_CONFIG.resendApiKey) {
            try {
                const resend = new Resend(SELLER_CONFIG.resendApiKey);

                // Get user info for email
                const { data: userData } = await supabaseAdmin
                    .from("profiles")
                    .select("full_name, email")
                    .eq("id", data.userId)
                    .single();

                const adminEmailHtml = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #000; text-transform: uppercase; letter-spacing: 2px;">New Support Ticket</h2>
                        <p>A new support ticket has been raised by <strong>${userData?.full_name || "a user"}</strong> (${userData?.email || "N/A"}).</p>
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>Category:</strong> ${data.category.replace('_', ' ')}</p>
                            ${data.orderId ? `<p><strong>Order ID:</strong> #${data.orderId}</p>` : ""}
                            <p><strong>Phone:</strong> ${data.phone}</p>
                            <p><strong>Message:</strong></p>
                            <p>${data.message.replace(/\n/g, '<br>')}</p>
                        </div>
                        <p>Log in to the admin panel to respond.</p>
                    </div>
                `;

                await resend.emails.send({
                    from: SELLER_CONFIG.fromEmail,
                    to: [SELLER_CONFIG.email],
                    subject: `New Support Ticket: ${data.category.replace('_', ' ')}`,
                    html: adminEmailHtml,
                });
            } catch {
                // Email failure is non-critical
            }
        }

        return { success: true };
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
        return {
            success: false,
            error: {
                message: "An unexpected error occurred. Please contact support if the amount was deducted.",
                technical: errorMessage
            }
        };
    }
}

export async function respondToTicket(ticketId: string, response: string, userEmail: string, orderId?: string) {
    try {
        if (!ticketId || !response || !userEmail) throw new Error("Missing required fields");
        if (response.length < 5) throw new Error("Response is too short");

        // 1. Update ticket in database
        const { error: updateError } = await supabaseAdmin
            .from("support_tickets")
            .update({
                admin_response: response,
                status: "responded",
                responded_at: new Date().toISOString(),
            })
            .eq("id", ticketId);

        if (updateError) throw updateError;

        // 2. Send email via Resend
        if (SELLER_CONFIG.resendApiKey) {
            const resend = new Resend(SELLER_CONFIG.resendApiKey);

            const emailHtml = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #000; text-transform: uppercase; letter-spacing: 2px;">Support Update</h2>
                    <p>Hello,</p>
                    <p>We have a response to your support ticket${orderId ? ` regarding order <strong>#${orderId}</strong>` : ""}:</p>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        ${response.replace(/\n/g, '<br>')}
                    </div>
                    <p>If you have any further questions, feel free to reply to this email.</p>
                    <p>Best regards,<br>The Blactify Team</p>
                </div>
            `;

            await resend.emails.send({
                from: SELLER_CONFIG.fromEmail,
                to: [userEmail],
                subject: `Re: Your Support Ticket Update`,
                html: emailHtml,
            });
        }

        return { success: true };
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
        return { success: false, error: errorMessage };
    }
}

export async function getTickets() {
    try {
        const { data, error } = await supabaseAdmin
            .from("support_tickets")
            .select("*, profiles(email, full_name)")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { success: true, tickets: data };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Fetch Failed" };
    }
}

export async function getTicketById(id: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from("support_tickets")
            .select("*, profiles(email, full_name), orders(*)")
            .eq("id", id)
            .single();

        if (error) throw error;
        return { success: true, ticket: data };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Fetch Failed" };
    }
}
