import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Create Neon SQL client (HTTP driver, ideal for Vercel)
const sql = neon(process.env.DATABASE_URL!);

// Create Drizzle ORM instance with loaded schema
export const db = drizzle(sql, { schema });

// Optional: Export schema for convenience
export * from "./schema";
