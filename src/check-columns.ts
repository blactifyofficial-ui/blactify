import { supabase } from "./lib/supabase";

async function test() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .limit(1);
  
  if (error) {
    console.error("DEBUG ERROR:", error);
  } else if (data && data.length > 0) {
    console.log("COLUMNS FOUND:", Object.keys(data[0]).join(", "));
  } else {
    console.log("No data found to check columns");
  }
}

test();
