"use client";

import { useAuth } from "@/store/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminLoading } from "@/components/admin/AdminUI";

const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/admin/login");
            } else if (!isAdmin) {
                router.push("/");
            } else {
                // Admin session timeout check
                const sessionStart = localStorage.getItem("admin_session_start");
                const now = Date.now();

                if (!sessionStart) {
                    // First time admin is authorized, set session start
                    localStorage.setItem("admin_session_start", now.toString());
                } else {
                    const elapsedTime = now - parseInt(sessionStart);
                    if (elapsedTime > SESSION_TIMEOUT_MS) {
                        console.warn("Admin session expired (24h limit reached). Logging out.");
                        localStorage.removeItem("admin_session_start");
                        import("@/lib/firebase").then(({ auth }) => {
                            import("firebase/auth").then(({ signOut }) => {
                                signOut(auth);
                            });
                        });
                        router.push("/admin/login");
                    }
                }
            }
        }
    }, [user, isAdmin, loading, router]);

    if (loading || !user || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white p-10">
                <AdminLoading message="Authenticating Secure Protocol..." />
            </div>
        );
    }

    return <>{children}</>;
}
