"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { Footer } from "@/components/layout/Footer";
import WelcomeBanner from "@/components/ui/WelcomeBanner";
import { AuthProvider } from "@/store/AuthContext";
import { CartDrawer } from "@/components/ui/CartDrawer";
import { AuthModal } from "@/components/ui/AuthModal";
import { Toaster } from "sonner";
import { Suspense } from "react";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [toastPosition, setToastPosition] = useState<"top-center" | "top-right" | "bottom-center">("top-center");
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isAdmin = pathname?.startsWith('/admin');

    // Handle opening cart via query param
    useEffect(() => {
        if (searchParams?.get('openCart') === 'true') {
            setIsCartOpen(true);
            // Clean up the URL
            const params = new URLSearchParams(searchParams.toString());
            params.delete('openCart');
            const newPath = pathname + (params.toString() ? `?${params.toString()}` : '');
            router.replace(newPath);
        }
    }, [searchParams, pathname, router]);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setToastPosition("top-center");
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
                position={isMobile ? "top-center" : "top-right"}
                offset={100}
                toastOptions={{
                    classNames: {
                        toast: cn(
                            "rounded-full border border-zinc-100 shadow-xl font-sans bg-white w-auto min-w-fit mx-auto",
                            isMobile ? "p-2 px-4 max-w-[200px]" : "p-2 px-4 max-w-[280px]"
                        ),
                        title: cn("font-bold", isMobile ? "text-xs" : "text-sm"),
                        description: cn("font-medium opacity-80", isMobile ? "text-[11px]" : "text-xs"),
                        content: "flex items-center gap-2",
                    },
                }}
            />
            <style>{`
                [data-sonner-toaster] {
                    top: 100px !important;
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

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={null}>
            <AppLayoutContent>{children}</AppLayoutContent>
        </Suspense>
    );
}
