import { integer, primaryKey, pgTable, geometry, text, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull().unique(),
    hashedPassword: text("hashed_password").notNull()
});

export const discoveredCoordinatesTable = pgTable("discovered_coordinates", {
    userId: integer("user_id").notNull().references(() => usersTable.id),
    coordinates: geometry("coordinates", {type: "point", mode: "xy", srid: 4326}).notNull(),
    timestamp: timestamp("timestamp", { mode: "date" }).notNull().defaultNow()
},
    (table) => [ primaryKey({ columns: [table.userId, table.coordinates] }) ]
);

export const refreshTokensTable = pgTable("refresh_tokens", {
    userId: integer("user_id").notNull().references(() => usersTable.id).primaryKey(),
    hashedToken: text("hashed_token").notNull(),
    expiredAt: timestamp("expired_at", { mode: "date" }).notNull() // milliseconds
});