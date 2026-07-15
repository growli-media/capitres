import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("[migrate] Missing Supabase env vars, skipping");
  process.exit(0);
}

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

console.log("[migrate] Checking database...");

const { error } = await supabase
  .from("product_variants")
  .select("id")
  .limit(1);

if (error) {
  console.error("[migrate] product_variants missing:");
  console.error(error.message);
  process.exit(1);
}

console.log("[migrate] Database OK");
