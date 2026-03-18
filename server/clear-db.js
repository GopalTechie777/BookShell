require('dotenv').config();
const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { categories, books, chapters, admins } = require('./src/db/schema');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema: { categories, books, chapters, admins } });

async function clear() {
  await db.delete(chapters);
  await db.delete(books);
  console.log('Cleared DB');
  process.exit(0);
}

clear();