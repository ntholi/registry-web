import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: ['./src/db/schema.ts'],
  dialect: process.env.LOCAL_DATABASE_URL ? 'sqlite' : 'turso',
  casing: 'snake_case',
  dbCredentials: process.env.LOCAL_DATABASE_URL
    ? {
        url: process.env.LOCAL_DATABASE_URL!,
      }
    : {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      },
});
