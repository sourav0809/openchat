import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const User = pgTable("Users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  image: text("profilePictureUrl"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
