import { Metadata } from "next";
import { DeveloperShell } from "./DeveloperShell";
import { AuthProvider } from "@/store/AuthContext";

export const preferredRegion = "sin1";

export const metadata: Metadata = {
    title: "Blactify Developer | Mission Control",
    description: "Real-time monitoring and administrative portal for Blactify developers.",
    robots: {
        index: false,
        follow: false,
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Blactify Dev",
    },
    icons: {
        apple: "/icon.png",
    },
    manifest: "/developer-manifest.json",
};

export default function DeveloperLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <DeveloperShell>{children}</DeveloperShell>
        </AuthProvider>
    );
}
