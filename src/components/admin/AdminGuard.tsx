"use client";

import { useAuth } from "@/store/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/admin/login");
            } else if (!isAdmin) {
                router.push("/");
            }
        }
    }, [user, isAdmin, loading, router]);

    if (loading || !user || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return <>{children}</>;
}
