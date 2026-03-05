"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { headers } from "next/headers";
import { authAdmin } from "@/lib/firebase-admin";

const ALLOWED_EMAIL = "bro.nithin07@gmail.com";

async function verifyDeveloper(token?: string) {
    if (!token) {
        const headersList = await headers();
        const authHeader = headersList.get("Authorization");

        if (!authHeader?.startsWith("Bearer ")) {
            throw new Error("Unauthorized");
        }

        token = authHeader.split("Bearer ")[1];
    }

    try {
        const decodedToken = await authAdmin.verifyIdToken(token);
        if (decodedToken.email !== ALLOWED_EMAIL) {
            throw new Error("Forbidden");
        }
        return { uid: decodedToken.uid };
    } catch {
        throw new Error("Unauthorized");
    }
}

export async function getDeveloperLogs(token?: string) {
    try {
        await verifyDeveloper(token);
        const { data, error } = await supabaseAdmin
            .from("developer_logs")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { success: true, logs: data || [] };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Fetch Failed" };
    }
}
