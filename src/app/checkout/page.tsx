import { getStoreSettings } from "@/app/actions/settings";
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
