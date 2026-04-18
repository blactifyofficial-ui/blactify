import { Metadata } from "next";
export const preferredRegion = "sin1";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata: Metadata = {
    title: "Blactify Admin | Management Portal",
    description: "Premium access portal for Blactify administration and inventory management.",
    robots: {
        index: false,
        follow: false,
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Blactify Admin",
    },
    icons: {
        apple: "/icon.png",
    },
    manifest: "/admin-manifest.json",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
