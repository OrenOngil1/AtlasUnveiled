import { integer, primaryKey, pgTable, geometry, text, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull().unique(),
    password: text("password").notNull()
});

export const discoveredCoordinatesTable = pgTable("discovered_coordinates", {
    userId: integer("user_id").notNull().references(() => usersTable.id),
    coordinates: geometry("coordinates", {type: "point", mode: "xy", srid: 4326}).notNull(),
    timestamp: timestamp("timestamp").notNull().defaultNow()
},
    (table) => [ primaryKey({ columns: [table.userId, table.coordinates] }) ]
);