import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { ChatSession } from "./chatSession";

export const Message = pgTable("Messages", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  chatSessionId: uuid("chatSessionId")
    .notNull()
    .references(() => ChatSession.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
