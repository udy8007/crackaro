import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error(
    "Missing DATABASE_URL or POSTGRES_URL_NON_POOLING in server/.env"
  );
  process.exit(1);
}

const sqlFiles = ["schema.sql", "admin.sql"].map((name) =>
  path.resolve(__dirname, "../sql", name)
);

const cleanUrl = connectionString
  .replace(/[?&]sslmode=[^&]*/g, "")
  .replace(/\?&/, "?")
  .replace(/\?$/, "");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const client = new pg.Client({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
for (const sqlPath of sqlFiles) {
  const sql = fs.readFileSync(sqlPath, "utf8");
  console.log(`Applying ${path.basename(sqlPath)}...`);
  await client.query(sql);
}
const tables = await client.query(
  `select table_name from information_schema.tables
   where table_schema = 'public'
     and table_name in ('orders', 'enquiries', 'admin_otps', 'admin_sessions')
   order by table_name`
);
console.log(
  "Tables ready:",
  tables.rows.map((r) => r.table_name).join(", ")
);
await client.end();
