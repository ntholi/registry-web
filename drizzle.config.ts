import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

const databaseEnv = process.env.DATABASE_ENV || 'local';
const databaseUrl =
  databaseEnv === 'remote'
    ? process.env.DATABASE_REMOTE_URL!
    : process.env.DATABASE_LOCAL_URL!;

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: {
    url: databaseUrl,
  },
});
