"use client";

import { useAuth } from "@/store/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { LogIn } from "lucide-react";
import Image from "next/image";

function AdminLoginContent() {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get("redirect");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && user) {
            if (redirectPath) {
                router.push(redirectPath);
            } else if (isAdmin) {
                router.push("/admin");
            }
        }
    }, [user, isAdmin, loading, router, redirectPath]);

    const handleLogin = async () => {
        try {
            setError(null);
            const result = await signInWithPopup(auth, googleProvider);

            // Log the login attempt
            const token = await result.user.getIdToken();
            await fetch("/api/admin/log-login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: result.user.email,
                    success: true
                })
            });

            // AuthContext will handle the redirect if is_admin is true
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error.message || "Failed to sign in. Please try again.");

            // Log the failed login
            try {
                await fetch("/api/admin/log-login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: auth.currentUser?.email || "unknown",
                        success: false,
                        error: error.message
                    })
                });
            } catch { /* ignore */ }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6 font-sans">
            <div className="w-full max-w-md bg-white p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-zinc-100 text-center relative overflow-hidden">
                {/* Visual Flair */}
                <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>

                <div className="mb-10 flex flex-col items-center">
                    <Image
                        src="/logo-v1.png"
                        alt="Blactify"
                        width={180}
                        height={45}
                        className="h-8 md:h-10 w-auto object-contain mb-4"
                        priority
                    />
                    <div className="flex items-center justify-center gap-2">
                        <div className="h-px w-4 bg-zinc-200"></div>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Admin Access</p>
                        <div className="h-px w-4 bg-zinc-200"></div>
                    </div>
                </div>

                {user && !isAdmin && !redirectPath ? (
                    <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-red-100 animate-in fade-in zoom-in-95 duration-300">
                        Access Denied. Unauthorized Personnel.
                    </div>
                ) : null}

                {error && (
                    <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-red-100 animate-in fade-in zoom-in-95 duration-300">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleLogin}
                    className="w-full bg-black text-white py-5 rounded-2xl flex items-center justify-center gap-4 hover:bg-zinc-900 transition-all font-black uppercase tracking-widest text-[11px] shadow-xl shadow-black/10 active:scale-[0.98] group"
                >
                    <LogIn size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                    Sign in as Administrator
                </button>

                <div className="mt-12 flex flex-col items-center gap-4">
                    <div className="w-8 h-8 rounded-full border border-zinc-100 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 animate-pulse"></div>
                    </div>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">
                        Secure Environment <br /> Authorized Personnel Only
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function AdminLoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 font-sans">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <AdminLoginContent />
        </Suspense>
    );
}
