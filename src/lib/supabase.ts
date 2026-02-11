import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (supabaseAnonKey === 'your-supabase-anon-key') {
    console.warn("Supabase Anon Key is still set to placeholder value in .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
