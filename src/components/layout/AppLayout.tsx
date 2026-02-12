"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { Footer } from "@/components/layout/Footer";
import WelcomeBanner from "@/components/ui/WelcomeBanner";
import { AuthProvider } from "@/store/AuthContext";
import { CartDrawer } from "@/components/ui/CartDrawer";
import { AuthModal } from "@/components/ui/AuthModal";
import { Toaster } from "sonner";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [toastPosition, setToastPosition] = useState<"top-center" | "top-right">("top-center");
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    useEffect(() => {
        const handleResize = () => {
            setToastPosition(window.innerWidth < 768 ? "top-right" : "top-center");
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const handleOpenAuth = () => setIsAuthOpen(true);
        window.addEventListener('open-auth-modal', handleOpenAuth);
        return () => window.removeEventListener('open-auth-modal', handleOpenAuth);
    }, []);

    return (
        <AuthProvider>
            <Toaster
                position={toastPosition}
                offset={80}
                toastOptions={{
                    classNames: {
                        toast: "rounded-full border border-zinc-100 shadow-xl p-2 px-4 font-sans bg-white w-auto min-w-fit max-w-[280px]",
                        title: "font-bold text-sm",
                        description: "text-xs font-medium opacity-80",
                        content: "flex items-center gap-3",
                    },
                }}
            />
            <style>{`
                [data-sonner-toaster] {
                    top: 80px !important;
                }
                @media (max-width: 767px) {
                    [data-sonner-toaster] {
                        right: 0 !important;
                        left: auto !important;
                        width: auto !important;
                    }
                    [data-sonner-toast] {
                        margin-right: 16px !important;
                        margin-left: auto !important;
                        width: fit-content !important;
                        min-width: 320px !important;
                        max-width: 90vw !important;
                    }
                }
            `}</style>
            <div className="relative min-h-screen bg-white text-black antialiased">
                {!isAdmin && <TopNavbar />}
                <main>{children}</main>
                {!isAdmin && <Footer />}
                {!isAdmin && (
                    <BottomNavbar
                        onCartClick={() => setIsCartOpen(true)}
                        onProfileClick={() => setIsAuthOpen(true)}
                    />
                )}
                {!isAdmin && <WelcomeBanner />}
                <CartDrawer
                    isOpen={isCartOpen}
                    onClose={() => setIsCartOpen(false)}
                    onAuthRequired={() => {
                        setIsCartOpen(false);
                        setIsAuthOpen(true);
                    }}
                />
                <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
            </div>
        </AuthProvider>
    );
}
