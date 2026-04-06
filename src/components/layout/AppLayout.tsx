"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { AuthProvider } from "@/store/AuthContext";
import dynamic from "next/dynamic";
import { Toaster } from "sonner";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { MaintenanceGuard } from "@/components/layout/MaintenanceGuard";

const AuthModal = dynamic(() => import("@/components/ui/AuthModal").then(mod => mod.AuthModal), {
    ssr: false,
});

const CartDrawer = dynamic(() => import("@/components/ui/CartDrawer").then(mod => mod.CartDrawer), {
    ssr: false,
});

const Sidebar = dynamic(() => import("@/components/layout/Sidebar").then(mod => mod.Sidebar), {
    ssr: false,
});

const Footer = dynamic(() => import("@/components/layout/Footer").then(mod => mod.Footer), {
    ssr: false,
});

const WelcomeBanner = dynamic(() => import("@/components/ui/WelcomeBanner"), {
    ssr: false,
});

const WelcomeAnimation = dynamic(() => import("@/components/ui/WelcomeAnimation"), {
    ssr: false,
});

const FloatingCart = dynamic(() => import("@/components/ui/FloatingCart").then(mod => mod.FloatingCart), {
    ssr: false,
});

const ScrollToTop = dynamic(() => import("@/components/ui/ScrollToTop").then(mod => mod.ScrollToTop), {
    ssr: false,
});

function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isSubdomain, setIsSubdomain] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Register GSAP plugins only once on the client
    useEffect(() => {
        if (typeof window !== "undefined") {
            const initGSAP = async () => {
                const { gsap } = await import("gsap");
                const { ScrollTrigger } = await import("gsap/ScrollTrigger");
                gsap.registerPlugin(ScrollTrigger);
            };
            initGSAP();
        }
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
                    {!isRestricted && (
                        <Suspense fallback={null}>
                            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                        </Suspense>
                    )}

                    <MaintenanceGuard>
                        <main className={cn(!isRestricted && pathname !== "/" && "pt-12 md:pt-14 pb-8")}>
                            {children}
                        </main>
                        {!isRestricted && (
                            <Suspense fallback={null}>
                                <Footer />
                            </Suspense>
                        )}
                        {!isRestricted && (
                            <Suspense fallback={null}>
                                <WelcomeBanner />
                            </Suspense>
                        )}
                        {!isRestricted && (
                            <Suspense fallback={null}>
                                <WelcomeAnimation />
                            </Suspense>
                        )}
                        {!isRestricted && (
                            <Suspense fallback={null}>
                                <FloatingCart onClick={() => setIsCartOpen(true)} />
                            </Suspense>
                        )}
                        <Suspense fallback={null}>
                            <ScrollToTop />
                        </Suspense>
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
                            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
                        </Suspense>
                    </MaintenanceGuard>
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
