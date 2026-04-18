import { Metadata } from "next";
import { AdminNotificationsClient } from "@/components/admin/AdminNotificationsClient";

export const metadata: Metadata = {
    title: "Notifications | Admin Portal",
    description: "Manage system alerts and communications",
};

export default function AdminNotificationsPage() {
    return (
        <div className="container-fluid px-0">
            <AdminNotificationsClient />
        </div>
    );
}
