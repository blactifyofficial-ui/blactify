import { Metadata } from "next";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata: Metadata = {
    title: "Blactify Admin | Management Portal",
    description: "Premium access portal for Blactify administration and inventory management.",
    manifest: "/admin/manifest.webmanifest",
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
        apple: "/logo.png",
    }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
