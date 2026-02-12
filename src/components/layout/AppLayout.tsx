"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { Footer } from "@/components/layout/Footer";
import { WelcomeOffer } from "@/components/ui/WelcomeOffer";
import { AuthProvider } from "@/store/AuthContext";
import { CartDrawer } from "@/components/ui/CartDrawer";
import { AuthModal } from "@/components/ui/AuthModal";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    useEffect(() => {
        const handleOpenAuth = () => setIsAuthOpen(true);
        window.addEventListener('open-auth-modal', handleOpenAuth);
        return () => window.removeEventListener('open-auth-modal', handleOpenAuth);
    }, []);

    return (
        <AuthProvider>
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
                {!isAdmin && <WelcomeOffer />}
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
