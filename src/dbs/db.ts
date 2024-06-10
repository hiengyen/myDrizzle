//Connect to Neon serverless DB
// import { drizzle } from 'drizzle-orm/neon-http'
// import { neon } from '@neondatabase/serverless'
// import { config } from 'dotenv'
// import * as schema from './schema'
// config({ path: '.env' })
//
// const sql = neon(process.env.DATABASE_URL!)
// export const db = drizzle(sql, { schema })
//
//Connect to local DB

import { config } from 'dotenv'
config({ path: '.env' })
import * as schema from './schema'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

//create collection to neon serverless
const pool = new Pool({
  connectionString: process.env.LOCAL_DB_URL!,
})

export const db = drizzle(pool, { schema })
