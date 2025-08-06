import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const isDev =
  process.env.DEV_TURSO_DATABASE_URL &&
  !process.env.DATABASE_URL?.includes('registry-ntholi.turso.io');
const databaseUrl = isDev
  ? process.env.DEV_TURSO_DATABASE_URL
  : process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
const authToken = isDev
  ? process.env.DEV_TURSO_AUTH_TOKEN
  : process.env.TURSO_AUTH_TOKEN;

export default defineConfig({
  out: './drizzle',
  schema: ['./src/db/schema.ts'],
  dialect: 'turso',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DEV_TURSO_DATABASE_URL!,
    authToken: process.env.DEV_TURSO_AUTH_TOKEN,
  },
});
