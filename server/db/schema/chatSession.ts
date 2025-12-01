import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { User } from "./user";

export const ChatSession = pgTable("ChatSessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => User.id),
  title: text("title"),
  description: text("description"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
