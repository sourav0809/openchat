import { db } from "../db/index";
import { User } from "../db/schema/user";
import { eq, SQL } from "drizzle-orm";

export class UserService {
  /**
   * Create a user and return the user
   * @param data - The data to create the user with
   * @returns The new user if created, otherwise the existing user
   */
  async createUser(data: {
    name: string;
    email: string;
    image?: string | null;
  }) {
    const existing = await db
      .select()
      .from(User)
      .where(eq(User.email, data.email));

    if (existing.length > 0) {
      throw new Error("User already exists");
    }

    const [newUser] = await db.insert(User).values(data).returning();
    return newUser;
  }

  /**
   * Create a user if it does not exist and return the user
   * @param data - The data to create the user with
   * @returns The new user if created, otherwise the existing user
   */
  async createUserIfNotExists(data: {
    name: string;
    email: string;
    image?: string | null;
  }) {
    const existing = await db
      .select()
      .from(User)
      .where(eq(User.email, data.email));

    if (existing.length > 0) {
      return existing[0];
    }

    const [newUser] = await db.insert(User).values(data).returning();
    return newUser;
  }

  /**
   * Fetch a single user using any condition
   * @param condition - The condition to fetch the user by
   * @returns The user if found, otherwise null
   */
  async getAUser(condition: SQL) {
    const result = await db.select().from(User).where(condition).limit(1);
    return result[0] ?? null;
  }
}

export const userService = new UserService();
