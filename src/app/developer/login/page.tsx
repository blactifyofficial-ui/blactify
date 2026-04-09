"use client";

import { useAuth } from "@/store/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { Command, ArrowRight, Shield } from "lucide-react";
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
                setError("Authorized account required.");
                await auth.signOut();
            } else {
                router.push("/developer");
            }
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error.message || "Uplink failure.");
        } finally {
            setIsAuthenticating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#000] text-white flex flex-col items-center justify-center p-8 transition-all">
            <div className="w-full max-w-[400px] flex flex-col items-center">
                {/* Logo Section */}
                <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <Command size={40} className="text-white mb-6 mx-auto" strokeWidth={1.5} />
                    <h1 className="text-3xl font-medium tracking-tight text-center mb-3">Developer Console</h1>
                    <p className="text-white/40 text-[13px] text-center font-medium">Authentication required to proceed</p>
                </div>

                {/* Main Card */}
                <div className="w-full bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 pb-10 shadow-[0_0_80px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    {error && (
                        <div className="mb-8 p-4 bg-red-500/5 border border-red-500/10 text-red-500/80 rounded-2xl text-[11px] font-medium text-center animate-in fade-in duration-300">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <button
                            onClick={handleLogin}
                            disabled={isAuthenticating}
                            className={cn(
                                "w-full h-14 bg-white text-black rounded-2xl flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.98] relative",
                                isAuthenticating && "opacity-50 pointer-events-none"
                            )}
                        >
                            {isAuthenticating ? (
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="font-semibold text-[14px] tracking-tight">Continue with Google</span>
                                    <ArrowRight size={16} className="text-black/40" />
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-10 flex flex-col items-center gap-4 border-t border-white/5 pt-8">
                        <div className="flex items-center gap-2">
                            <Shield size={12} className="text-white/20" />
                            <span className="text-[10px] text-white/30 font-medium uppercase tracking-[0.1em]">Secure Environment</span>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="mt-12 flex flex-col items-center gap-8 animate-in fade-in duration-1000 delay-500">
                    <button 
                        onClick={() => router.push("/")}
                        className="text-[12px] text-white/40 font-medium hover:text-white transition-colors"
                    >
                        Exit console
                    </button>
                    
                    <div className="h-4 w-[1px] bg-white/10" />
                    
                    <p className="text-[10px] text-white/20 font-medium tracking-tight text-center max-w-[280px]">
                        &copy; {new Date().getFullYear()} Blactify. Internal use only.
                    </p>
                </div>
            </div>
        </div>
    );
}
