import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// On Vercel, env vars come from the project settings — skip local .env file.
if (process.env.VERCEL) {
  console.log("[env] Using Vercel environment variables");
} else {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(__dirname, "../.env");
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.warn(`[env] Could not load ${envPath}`);
  } else {
    console.log(`[env] Loaded ${envPath}`);
  }
}
