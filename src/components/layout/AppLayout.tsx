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
import { SearchOverlay } from "@/components/ui/SearchOverlay";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const pathname = usePathname();
    const isHomePage = pathname === "/";

    useEffect(() => {
        const handleOpenAuth = () => setIsAuthOpen(true);
        const handleOpenSearch = () => setIsSearchOpen(true);
        window.addEventListener('open-auth-modal', handleOpenAuth);
        window.addEventListener('open-search-overlay', handleOpenSearch);
        return () => {
            window.removeEventListener('open-auth-modal', handleOpenAuth);
            window.removeEventListener('open-search-overlay', handleOpenSearch);
        };
    }, []);

    return (
        <AuthProvider>
            <div className="relative min-h-screen bg-white text-black antialiased">
                {!isHomePage && <TopNavbar />}
                <main>{children}</main>
                {!isHomePage && <Footer />}
                {!isHomePage && (
                    <BottomNavbar
                        onCartClick={() => setIsCartOpen(true)}
                        onProfileClick={() => setIsAuthOpen(true)}
                    />
                )}
                {!isHomePage && <WelcomeOffer />}
                <CartDrawer
                    isOpen={isCartOpen}
                    onClose={() => setIsCartOpen(false)}
                    onAuthRequired={() => {
                        setIsCartOpen(false);
                        setIsAuthOpen(true);
                    }}
                />
                <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
                <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            </div>
        </AuthProvider>
    );
}
