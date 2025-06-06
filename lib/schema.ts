//  --- Add your pg table schemas here ----

import { pgTable, serial, text, integer, bigint } from "drizzle-orm/pg-core";

export const depositsTable = pgTable("deposits", {
  id: serial("id").primaryKey(),
  user: text("user").notNull(),
  amount: bigint("amount", { mode: "bigint" }).notNull(),
  cycleId: integer("cycle_id").notNull(),
  timestamp: bigint("timestamp", { mode: "bigint" }).notNull(),
});

export const withdrawalRequestsTable = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  user: text("user").notNull(),
  cycleId: integer("cycle_id").notNull(),
  timestamp: bigint("timestamp", { mode: "bigint" }).notNull(),
});

export const cyclesTable = pgTable("cycles", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").notNull(),
  startTime: bigint("start_time", { mode: "bigint" }).notNull(),
  status: text("status").notNull(), // e.g., "started", "ended"
});

export {};
