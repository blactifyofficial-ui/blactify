"use client";

import React, { Suspense, useEffect, useState } from "react";
import TopNavbar from "./TopNavbar";
import Sidebar from "./Sidebar";
import { Footer } from "./Footer";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AuthProvider } from "@/store/AuthContext";
import { Toaster } from "sonner";
import { SearchDrawer } from "../ui/SearchDrawer";
import { CartDrawer } from "../ui/CartDrawer";
import { AuthModal } from "../ui/AuthModal";
import { cn } from "@/lib/utils";
import MaintenanceGuard from "./MaintenanceGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isSubdomain, setIsSubdomain] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check for mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const host = window.location.hostname;
            setIsSubdomain(host.startsWith('admin.') || host.startsWith('dev.'));
        }
    }, []);

    const isAdmin = pathname?.startsWith('/admin');
    const isDeveloper = pathname?.startsWith('/developer');
    const isRestricted = isAdmin || isDeveloper || isSubdomain;

    // Handle opening cart via query param
    useEffect(() => {
        if (searchParams.get("cart") === "true") {
            setIsCartOpen(true);
            // Clean up the URL
            const params = new URLSearchParams(searchParams);
            params.delete("cart");
            const newPath = pathname + (params.toString() ? `?${params.toString()}` : "");
            router.replace(newPath);
        }
    }, [searchParams, pathname, router]);

    // Handle authentication required event from cart
    useEffect(() => {
        const handleAuthRequired = () => {
            setIsCartOpen(false);
            setIsAuthOpen(true);
        };

        window.addEventListener('auth-required', handleAuthRequired);
        return () => window.removeEventListener('auth-required', handleAuthRequired);
    }, []);

    return (
        <AuthProvider>
            <Suspense fallback={null}>
                <style jsx global>{`
                    @font-face {
                        font-family: 'Yapari';
                        src: url('/fonts/Yapari-Variable.ttf') format('truetype');
                        font-weight: 100 900;
                        font-style: normal;
                        font-display: swap;
                    }
                    .font-yapari {
                        font-family: 'Yapari', sans-serif;
                    }
                    /* Base animations */
                    @keyframes slideUp {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    .animate-slide-up {
                        animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                `}</style>
                <div className="relative min-h-screen bg-black text-white antialiased">
                    {!isRestricted && (
                        <TopNavbar 
                            onMenuClick={() => setIsSidebarOpen(true)} 
                            onSearchClick={() => setIsSearchOpen(true)}
                            onCartClick={() => setIsCartOpen(true)}
                        />
                    )}
                    {!isRestricted && (
                        <Suspense fallback={null}>
                            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                        </Suspense>
                    )}

                    <MaintenanceGuard>
                        <main className={cn(!isRestricted && pathname !== "/" && "pt-16 md:pt-20 pb-8")}>
                            {children}
                        </main>
                        {!isRestricted && (
                            <Suspense fallback={null}>
                                <Footer />
                            </Suspense>
                        )}


                        <Suspense fallback={null}>
                            <CartDrawer
                                isOpen={isCartOpen}
                                onClose={() => setIsCartOpen(false)}
                                onAuthRequired={() => {
                                    setIsCartOpen(false);
                                    setIsAuthOpen(true);
                                }}
                            />
                        </Suspense>
                        <Suspense fallback={null}>
                            <SearchDrawer
                                isOpen={isSearchOpen}
                                onClose={() => setIsSearchOpen(false)}
                            />
                        </Suspense>
                        <Suspense fallback={null}>
                            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
                        </Suspense>
                    </MaintenanceGuard>
                </div>
            </Suspense>
            <Toaster 
                position="top-center" 
                expand={false} 
                richColors 
                closeButton
                theme="dark"
                toastOptions={{
                    style: {
                        background: '#111',
                        border: '1px solid #222',
                        color: '#fff',
                        fontFamily: 'inherit',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderRadius: '0px'
                    },
                }}
            />
        </AuthProvider>
    );
}
