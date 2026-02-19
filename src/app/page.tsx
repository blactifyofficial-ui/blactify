import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import HomeClient from "@/components/home/HomeClient";

export const metadata: Metadata = {
  title: "Blactify | Meets Timeless Essentials",
  description: "Modern e-commerce platform for high-aesthetic meets timeless essentials. Discover curated premium apparel and accessories.",
};

async function getInitialProducts() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, product_images(*), product_variants(*)")
      .limit(8)
      .order("created_at", { ascending: false });

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export default async function Page() {
  const products = await getInitialProducts();

  return <HomeClient initialProducts={products} />;
}
