import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'
config({ path: '.env' })
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/dbs/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Print all statements
  verbose: true,
  // Always ask for confirmation
  strict: true,
  // migrations: {
  //   table: 'migrations_custom', // default `__drizzle_migrations`,
  //   schema: 'public', // used in PostgreSQL only and default to `drizzle`
  // },
})
