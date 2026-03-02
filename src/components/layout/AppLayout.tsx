"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import WelcomeBanner from "@/components/ui/WelcomeBanner";
import WelcomeAnimation from "@/components/ui/WelcomeAnimation";
import { AuthProvider } from "@/store/AuthContext";
import { FloatingCart } from "@/components/ui/FloatingCart";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import dynamic from "next/dynamic";
import { Toaster } from "sonner";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

const AuthModal = dynamic(() => import("@/components/ui/AuthModal").then(mod => mod.AuthModal), {
    ssr: false,
});

const CartDrawer = dynamic(() => import("@/components/ui/CartDrawer").then(mod => mod.CartDrawer), {
    ssr: false,
});

function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isAdmin = pathname?.startsWith('/admin');
    const isDeveloper = pathname?.startsWith('/developer');
    const isRestricted = isAdmin || isDeveloper;

    // Handle opening cart via query param
    useEffect(() => {
        if (searchParams?.get('openCart') === 'true') {
            const timer = setTimeout(() => {
                setIsCartOpen(true);
                // Clean up the URL
                const params = new URLSearchParams(searchParams.toString());
                params.delete('openCart');
                const newPath = pathname + (params.toString() ? `?${params.toString()}` : '');
                router.replace(newPath);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [searchParams, pathname, router]);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
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
        <ErrorBoundary>
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
                    {!isRestricted && <TopNavbar onMenuClick={() => setIsSidebarOpen(true)} />}
                    {!isRestricted && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}

                    <main className={cn(!isRestricted && pathname !== "/" && "pt-12 md:pt-14 pb-8")}>
                        {children}
                    </main>
                    {!isRestricted && <Footer />}
                    {!isRestricted && <WelcomeBanner />}
                    {!isRestricted && <WelcomeAnimation />}
                    {!isRestricted && (
                        <>
                            <FloatingCart onClick={() => setIsCartOpen(true)} />
                        </>
                    )}
                    <ScrollToTop />
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
        </ErrorBoundary>
    );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={null}>
            <AppLayoutContent>{children}</AppLayoutContent>
        </Suspense>
    );
}
