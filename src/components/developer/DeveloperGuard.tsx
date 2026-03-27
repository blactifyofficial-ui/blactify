"use client";

import { useAuth } from "@/store/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldAlert, Command } from "lucide-react";

const ALLOWED_EMAIL = process.env.NEXT_PUBLIC_ALLOWED_DEV_EMAIL || "bro.nithin07@gmail.com";

export function DeveloperGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/developer/login");
            } else if (user.email !== ALLOWED_EMAIL) {
                // Keep them on the shell but the shell handles the "Access Restricted" view
                // Actually, the shell handles the email check too, but Guard should be the first line.
            }
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] p-10 font-sans">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-emerald-500/10 blur-[60px] rounded-full scale-150 animate-pulse" />
                    <Command size={48} className="text-emerald-500 relative animate-bounce" />
                </div>
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-500/80">Initializing Mission Control</span>
                    </div>
                    <div className="w-48 h-[1px] bg-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                    </div>
                </div>
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                    .animate-shimmer {
                        animation: shimmer 2s infinite;
                    }
                ` }} />
            </div>
        );
    }

    if (user && user.email !== ALLOWED_EMAIL) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#050505] font-sans">
                <div className="mb-12 relative">
                    <div className="absolute inset-0 bg-red-500/10 blur-[80px] rounded-full scale-150" />
                    <ShieldAlert size={80} strokeWidth={1.5} className="text-red-500 relative animate-in zoom-in duration-500" />
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter uppercase leading-none">
                    Sector Restricted
                </h1>
                <p className="text-white/40 mb-10 max-w-md mx-auto text-xs md:text-sm font-bold uppercase tracking-[0.2em] leading-relaxed">
                    Unauthorized access to development systems <br className="hidden md:block" />
                    has been logged and reported.
                </p>
                <div className="flex flex-col md:flex-row gap-4">
                    <button 
                        onClick={() => router.push("/")} 
                        className="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-zinc-200 active:scale-95 shadow-xl shadow-white/5"
                    >
                        Abort Access
                    </button>
                    <button 
                        onClick={() => {
                            import("@/lib/firebase").then(({ auth }) => {
                                import("firebase/auth").then(({ signOut }) => {
                                    signOut(auth).then(() => router.push("/developer/login"));
                                });
                            });
                        }} 
                        className="px-10 py-5 bg-white/5 text-white border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-white/10 active:scale-95"
                    >
                        Switch Identity
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}
