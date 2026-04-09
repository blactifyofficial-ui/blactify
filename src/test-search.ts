import { supabase } from "./lib/supabase";

async function test() {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, product_images(url), categories(name)")
    .limit(1);
  
  if (error) {
    console.error("DEBUG ERROR:", error);
  } else {
    console.log("DEBUG DATA:", JSON.stringify(data, null, 2));
  }
}

test();
