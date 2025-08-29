import { defineConfig } from "drizzle-kit"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("❌ DATABASE_URL is not defined in environment variables.")
}

export default defineConfig({
    schema: "./src/db/schema.ts",
      out: "./src/db/migrations",
      dialect: "postgresql",
        strict: true,
         verbose: true,
          dbCredentials: {
             url: databaseUrl,
  },
})