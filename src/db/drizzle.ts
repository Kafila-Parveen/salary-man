// This file should only be imported in server components or API routes

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

// This function ensures we're not creating multiple connections in development
let dbInstance: ReturnType<typeof drizzle>

// Helper to ensure this is only used on the server
function assertServerSide() {
  if (typeof window !== 'undefined') {
    throw new Error('Database operations can only be performed on the server side')
  }
}

export function getDb() {
  assertServerSide()
  
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please check your .env file and make sure it includes DATABASE_URL.'
    )
  }

  if (!dbInstance) {
    try {
      const sql = neon(databaseUrl)
      dbInstance = drizzle(sql, { 
        schema,
        logger: process.env.NODE_ENV === 'development'
      })
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Database connection established successfully')
      }
    } catch (error) {
      console.error('Failed to connect to the database:', error)
      throw new Error('Failed to initialize database connection')
    }
  }

  return dbInstance
}

// Export a singleton instance
export const db = getDb()