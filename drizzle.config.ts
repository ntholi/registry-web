import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: ['./src/db/schema.ts'],
  dialect: process.env.DATABASE_URL?.includes('local') ? 'sqlite' : 'turso',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
