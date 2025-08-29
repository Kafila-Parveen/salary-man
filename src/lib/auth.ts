"use server";

import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function getOrCreateUserId() {
  const user = await currentUser();
  if (!user) return null;
  
  const clerkId = user.id;
  const email = user.emailAddresses?.[0]?.emailAddress || null;
  const name = user.firstName || user.username || "User";
  if (!email) return null;

  // First try to find existing user by clerk_id
  const existingByClerkId = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerk_id, clerkId))
    .limit(1);
    
  if (existingByClerkId.length > 0) return existingByClerkId[0].id;

  // If not found by clerk_id, try by email
  const existingByEmail = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // If user exists with this email but different clerk_id, update it
  if (existingByEmail.length > 0) {
    await db
      .update(users)
      .set({ clerk_id: clerkId })
      .where(eq(users.email, email));
    return existingByEmail[0].id;
  }

  // If no user found, create a new one
  try {
    const userId = crypto.randomUUID(); // Generate a unique ID
    const inserted = await db
      .insert(users)
      .values({ 
        id: userId,
        clerk_id: clerkId,
        email, 
        name,
        // createdAt is automatically handled by defaultNow() in the schema
      })
      .returning({ id: users.id });
      
    if (!inserted || !inserted[0]) {
      console.error('No user was inserted:', { inserted, userId, clerkId, email, name });
      throw new Error('Failed to create user');
    }
    return inserted[0].id;
  } catch (error) {
    // If we get a unique constraint error on email, it means another request created the user
    if (error instanceof Error && 'code' in error && error.code === '23505') {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return existing[0]?.id ?? null;
    }
    console.error('Error creating/getting user:', error);
    return null;
  }
}
