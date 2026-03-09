import { getStoreSettings } from "@/app/actions/settings";
export const preferredRegion = "sin1";
export const dynamic = "force-dynamic";
import CheckoutClient from "./CheckoutClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Checkout | Blactify",
    description: "Complete your purchase securely on Blactify.",
};

export default async function CheckoutPage() {
    const settings = await getStoreSettings();

    return <CheckoutClient initialSettings={settings} />;
}
