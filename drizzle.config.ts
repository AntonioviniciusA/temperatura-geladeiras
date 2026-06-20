import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'turso',
  schema: './lib/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url:
      process.env.TURSO_CONNECTION_URL ??
      process.env.TURSO_DATABASE_URL ??
      process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN ?? process.env.AUTH_TOKEN!,
  },
});
