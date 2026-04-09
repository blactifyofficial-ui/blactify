"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { NotificationStatusCard } from "@/components/admin/NotificationStatusCard";
import { Drop } from "@/lib/drops-local";
import { useAdminStats } from "@/hooks/useAdminStats";
import { AdminLoading, AdminPageHeader } from "@/components/admin/AdminUI";
import { auth } from "@/lib/firebase";
import { getStoreSettings, togglePurchaseStatus } from "@/app/actions/settings";

// New Component Imports
import { StatsGrid } from "@/components/admin/dashboard/StatsGrid";
import { StoreControls } from "@/components/admin/dashboard/StoreControls";
import { UpcomingDrops } from "@/components/admin/dashboard/UpcomingDrops";
import { RecentActivity } from "@/components/admin/dashboard/RecentActivity";
import { TopProducts } from "@/components/admin/dashboard/TopProducts";

import { DisablePurchaseModal } from "@/components/admin/dashboard/DisablePurchaseModal";

export default function AdminDashboardPage() {
    const { stats, loading } = useAdminStats();
    const [purchasesEnabled, setPurchasesEnabled] = useState(true);
    const [showDisableModal, setShowDisableModal] = useState(false);
    const [confirmationText, setConfirmationText] = useState("");
    const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
    const [upcomingDrops, setUpcomingDrops] = useState<Drop[]>([]);

    const fetchDrops = async () => {
        try {
            const res = await fetch("/api/admin/drops");
            const data: Drop[] = await res.json();
            const now = new Date();
            
            // Show all upcoming drops
            const futureDrops = data
                .filter(d => new Date(d.publishDate).getTime() > now.getTime())
                .sort((a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime());
            
            setUpcomingDrops(futureDrops);
        } catch (error) {
            console.error("Failed to fetch drops for dashboard", error);
        }
    };

    useEffect(() => {
        getStoreSettings().then(settings => {
            if (settings) {
                setPurchasesEnabled(settings.purchases_enabled ?? true);
            }
        });
        fetchDrops();
    }, []);

    const handleTogglePurchases = async () => {
        if (purchasesEnabled) {
            setShowDisableModal(true);
        } else {
            setIsUpdatingSettings(true);
            try {
                const token = await auth.currentUser?.getIdToken();
                const result = await togglePurchaseStatus(true, token);
                if (result.success) {
                    setPurchasesEnabled(true);
                    toast.success("Store purchases enabled successfully");
                }
            } finally {
                setIsUpdatingSettings(false);
            }
        }
    };


    const confirmDisable = async () => {
        if (confirmationText !== "STOP BUYING") return;
        setIsUpdatingSettings(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const result = await togglePurchaseStatus(false, token);
            if (result.success) {
                setPurchasesEnabled(false);
                setShowDisableModal(false);
                setConfirmationText("");
                toast.success("Store purchases disabled successfully");
            }
        } finally {
            setIsUpdatingSettings(false);
        }
    };

    if (loading) return <AdminLoading message="Getting things ready..." />;

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 relative">
            <AdminPageHeader
                title="Dashboard"
                subtitle="Store overview and performance"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
                <UpcomingDrops drops={upcomingDrops} fetchDrops={fetchDrops} />
                <NotificationStatusCard />
                
                <StoreControls 
                    purchasesEnabled={purchasesEnabled}
                    onTogglePurchases={handleTogglePurchases}
                    isUpdatingPurchases={isUpdatingSettings}
                />
            </div>

            <StatsGrid stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                <div className="lg:col-span-3">
                    <RecentActivity orders={stats.recentOrders} />
                </div>
                <div className="lg:col-span-2">
                    <TopProducts products={stats.topProducts} />
                </div>

            </div>

            <DisablePurchaseModal
                isOpen={showDisableModal}
                onClose={() => {
                    setShowDisableModal(false);
                    setConfirmationText("");
                }}
                confirmationText={confirmationText}
                setConfirmationText={setConfirmationText}
                onConfirm={confirmDisable}
                isUpdating={isUpdatingSettings}
            />
        </div>
    );
}
