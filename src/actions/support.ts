"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { Resend } from "resend";
import { SELLER_CONFIG } from "@/lib/config";

export async function createTicket(formData: {
    userId: string;
    orderId?: string;
    category: string;
    phone: string;
    message: string;
}) {
    try {
        const { error } = await supabaseAdmin
            .from("support_tickets")
            .insert([
                {
                    user_id: formData.userId,
                    order_id: formData.orderId || null,
                    category: formData.category,
                    phone: formData.phone,
                    message: formData.message,
                    status: "open",
                }
            ]);

        if (error) throw error;

        // Send email to Admin
        if (SELLER_CONFIG.resendApiKey) {
            const resend = new Resend(SELLER_CONFIG.resendApiKey);

            // Get user info for email
            const { data: userData } = await supabaseAdmin
                .from("profiles")
                .select("full_name, email")
                .eq("id", formData.userId)
                .single();

            const adminEmailHtml = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #000; text-transform: uppercase; letter-spacing: 2px;">New Support Ticket</h2>
                    <p>A new support ticket has been raised by <strong>${userData?.full_name || "a user"}</strong> (${userData?.email || "N/A"}).</p>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Category:</strong> ${formData.category.replace('_', ' ')}</p>
                        ${formData.orderId ? `<p><strong>Order ID:</strong> #${formData.orderId}</p>` : ""}
                        <p><strong>Phone:</strong> ${formData.phone}</p>
                        <p><strong>Message:</strong></p>
                        <p>${formData.message.replace(/\n/g, '<br>')}</p>
                    </div>
                    <p>Log in to the admin panel to respond.</p>
                </div>
            `;

            await resend.emails.send({
                from: SELLER_CONFIG.fromEmail,
                to: [SELLER_CONFIG.email],
                subject: `New Support Ticket: ${formData.category.replace('_', ' ')}`,
                html: adminEmailHtml,
            });
        }

        return { success: true };
    } catch (err: any) {
        console.error("Error creating ticket:", err);
        return { success: false, error: err.message };
    }
}

export async function respondToTicket(ticketId: string, response: string, userEmail: string, orderId?: string) {
    try {
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
    } catch (err: any) {
        console.error("Error responding to ticket:", err);
        return { success: false, error: err.message };
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
    } catch (err: any) {
        return { success: false, error: err.message };
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
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
