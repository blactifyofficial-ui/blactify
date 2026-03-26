import { authAdmin } from "./firebase-admin";
import { supabaseAdmin } from "./supabase-admin";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export type AuthContext = {
    uid: string;
    email?: string;
    error?: NextResponse;
};

export async function getClientIP() {
    const headersList = await headers();
    const xForwardedFor = headersList.get("x-forwarded-for");
    if (xForwardedFor) {
        return xForwardedFor.split(",")[0].trim();
    }
    return headersList.get("x-real-ip") || "unknown";
}

export async function verifyAuth(request: Request): Promise<AuthContext> {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return {
            uid: "",
            error: NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 })
        };
    }

    const token = authHeader.split("Bearer ")[1];
    try {
        const decodedToken = await authAdmin.verifyIdToken(token);
        return { uid: decodedToken.uid, email: decodedToken.email };
    } catch {
        return {
            uid: "",
            error: NextResponse.json({ error: "Invalid token" }, { status: 401 })
        };
    }
}

export async function verifyAdminAuth(request: Request): Promise<AuthContext> {
    const authResult = await verifyAuth(request);
    if (authResult.error) return authResult;

    // Check if user is admin
    const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("is_admin")
        .eq("id", authResult.uid)
        .single();

    if (error || !data?.is_admin) {
        return {
            uid: authResult.uid,
            error: NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
        };
    }

    return { uid: authResult.uid, email: authResult.email };
}

// Helpers for Server Actions (doesn't return NextResponse)
export async function verifyActionAuth(providedToken?: string) {
    let token = providedToken;

    if (!token) {
        const headersList = await headers();
        const authHeader = headersList.get("Authorization");

        if (!authHeader?.startsWith("Bearer ")) {
            throw new Error("Unauthorized: Missing token");
        }

        token = authHeader.split("Bearer ")[1];
    }

    try {
        const decodedToken = await authAdmin.verifyIdToken(token);
        return { uid: decodedToken.uid, email: decodedToken.email };
    } catch {
        throw new Error("Unauthorized: Invalid token");
    }
}

export async function verifyActionAdminAuth(providedToken?: string) {
    const authResult = await verifyActionAuth(providedToken);

    const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("is_admin")
        .eq("id", authResult.uid)
        .single();

    if (error || !data?.is_admin) {
        throw new Error("Forbidden: Admin access required");
    }

    return { uid: authResult.uid, email: authResult.email };
}
