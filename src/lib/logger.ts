"use server";

import { supabaseAdmin } from "./supabase-admin";

export type ActionType =
    | "user_registration"
    | "product_add"
    | "product_edit"
    | "product_delete"
    | "category_add"
    | "category_edit"
    | "category_delete"
    | "admin_login"
    | "purchase_toggle"
    | "free_shipping_toggle"
    | "report_export";

export interface LogEntry {
    action_type: ActionType;
    details?: Record<string, unknown>;
    user_email?: string;
    severity?: "info" | "warning" | "error" | "critical";
}

/**
 * Logs an action to the developer_logs table.
 * Designed to be called within server-side environments.
 */
export async function logAction(entry: LogEntry) {
    try {
        const { error } = await supabaseAdmin
            .from("developer_logs")
            .insert([{
                action_type: entry.action_type,
                details: entry.details || {},
                user_email: entry.user_email,
                severity: entry.severity || "info"
            }]);

        if (error) {
            console.error("Failed to write to developer_logs:", error);
            return { success: false, error };
        }

        return { success: true };
    } catch (err) {
        console.error("Exception in logAction:", err);
        return { success: false, error: err };
    }
}

/**
 * ACID Compliant Multi-Action Logger
 * Allows wrapping a main operation and a log entry in a potential transaction/batching logic 
 * if the underlying DB infrastructure supported a unified transaction across tables via this client.
 * Currently, Supabase's REST API treats each request as a transaction.
 */
export async function logActionAtomic(entry: LogEntry) {
    // In Supabase, if we want cross-table atomicity, we'd typically use a DB function (RPC).
    // For simple logging, a separate insert is usually sufficient, but we'll keep this 
    // placeholder for more complex transactional needs.
    return logAction(entry);
}
