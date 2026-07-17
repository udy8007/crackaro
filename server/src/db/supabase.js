import "../loadEnv.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "[db] Missing SUPABASE_URL or SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY"
  );
} else {
  console.log("[db] Supabase client ready");
}

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;
