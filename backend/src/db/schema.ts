import { integer, pgTable, varchar, geometry } from "drizzle-orm/pg-core";

export const userTable = pgTable("users", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", {length: 255}).notNull(),
    password: varchar("password", {length: 255}).notNull()
});

export const userSettingsTable = pgTable("user_settings", {
    userId: integer("id").primaryKey().notNull().references(() => userTable.id),
    //idk
});

export const discoveredCoordinatesTable = pgTable("discovered_coordinates", {
    userId: integer("user_id").notNull().references(() => userTable.id),
    coordinates: geometry("coordinates", {type: "point", mode: "xy", srid: 4326}).notNull()
});