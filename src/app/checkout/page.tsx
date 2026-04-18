import { getStoreSettings } from "@/app/actions/settings";
export const preferredRegion = "sin1";
export const dynamic = "force-dynamic";
import CheckoutClient from "./CheckoutClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Checkout | Blactify Studio",
    description: "Complete your purchase securely on Blactify Studio.",
};

export default async function CheckoutPage() {
    const settings = await getStoreSettings();

    return <CheckoutClient initialSettings={settings} />;
}
