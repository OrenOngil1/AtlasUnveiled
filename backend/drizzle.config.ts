import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  dialect: "postgresql",
  schema: "./src/db/schema.ts",

  dbCredentials: {
    url: process.env.DATABASE_URL!
  },

  introspect: {
    casing: "camel"
  },

  migrations: {
    prefix: "timestamp"
  },

  schemaFilter: ['public'],
  
  tablesFilter: ['!spatial_ref_sys', '!geometry_columns', '!geography_columns'],
});