"use client";

import { useAuth } from "@/store/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { Shield, Command, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ALLOWED_EMAIL = "bro.nithin07@gmail.com";

export default function DeveloperLoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    useEffect(() => {
        if (!loading && user && user.email === ALLOWED_EMAIL) {
            router.push("/developer");
        }
    }, [user, loading, router]);

    const handleLogin = async () => {
        try {
            setIsAuthenticating(true);
            setError(null);
            const result = await signInWithPopup(auth, googleProvider);
            
            if (result.user.email !== ALLOWED_EMAIL) {
                setError("Access Denied: Unauthorized Developer Account");
                await auth.signOut();
            } else {
                router.push("/developer");
            }
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error.message || "Failed to establish secure connection.");
        } finally {
            setIsAuthenticating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
            </div>

            <div className="w-full max-w-lg relative z-10">
                <div className="bg-[#0A0A0A] border border-white/5 p-10 md:p-14 rounded-[2rem] shadow-2xl backdrop-blur-xl relative overflow-hidden">
                    {/* Top Accent */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                    
                    <div className="mb-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6 group transition-all duration-500 hover:scale-110">
                            <Command size={28} className="text-emerald-500 transition-transform group-hover:rotate-12" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-heading text-white mb-3 tracking-tighter uppercase leading-none">
                            Mission Control
                        </h1>
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <div className="h-[1px] w-6 bg-emerald-500/30"></div>
                            <p className="text-emerald-500/60 text-[10px] font-black uppercase tracking-[0.4em]">Developer Portal Access</p>
                            <div className="h-[1px] w-6 bg-emerald-500/30"></div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[11px] font-bold uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2 duration-300">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        <button
                            onClick={handleLogin}
                            disabled={isAuthenticating}
                            className={cn(
                                "w-full h-16 bg-white text-black rounded-2xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] group relative overflow-hidden",
                                isAuthenticating && "opacity-80 pointer-events-none"
                            )}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            {isAuthenticating ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Shield size={20} className="group-hover:scale-110 transition-transform" />
                                    <span className="font-black uppercase tracking-[0.15em] text-[11px]">Authorize System Access</span>
                                    <ArrowRight size={16} className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-12 flex flex-col items-center gap-6">
                        <div className="flex items-center gap-3 py-2 px-4 rounded-full bg-white/5 border border-white/5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Global Systems Nominal</span>
                        </div>
                        <p className="text-[9px] text-white/20 font-bold uppercase tracking-[0.25em] text-center max-w-[280px] leading-loose">
                            Secure development environment. <br /> Unauthorized access will be traced and logged.
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button 
                        onClick={() => router.push("/")}
                        className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] hover:text-white/60 transition-colors"
                    >
                        Return to Sector Alpha
                    </button>
                </div>
            </div>
        </div>
    );
}
