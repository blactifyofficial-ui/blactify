"use client";

import { useAuth } from "@/store/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { LogIn } from "lucide-react";

export default function AdminLoginPage() {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && user && isAdmin) {
            router.push("/admin");
        }
    }, [user, isAdmin, loading, router]);

    const handleLogin = async () => {
        try {
            setError(null);
            await signInWithPopup(auth, googleProvider);
            // AuthContext will handle the redirect if is_admin is true
        } catch (err) {
            console.error("Login Error:", err);
            setError("Failed to sign in. Please try again.");
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
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
            <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-sm border border-zinc-100 text-center">
                <h1 className="text-3xl font-empire tracking-tighter mb-2">BLACTIFY</h1>
                <p className="text-zinc-500 text-sm mb-8 font-medium uppercase tracking-widest italic">Admin Access</p>

                {user && !isAdmin ? (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                        Access Denied. You do not have administrator privileges.
                    </div>
                ) : null}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleLogin}
                    className="w-full bg-black text-white py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all font-medium active:scale-95"
                >
                    <LogIn size={20} />
                    Sign in as Administrator
                </button>

                <p className="mt-8 text-[10px] text-zinc-400 font-medium uppercase tracking-widest italic">
                    Authorized Personnel Only
                </p>
            </div>
        </div>
    );
}
