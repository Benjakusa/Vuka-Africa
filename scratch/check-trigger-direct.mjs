import { Client } from 'pg';

// Reads from DATABASE_URL — never hardcode credentials in scripts.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set. Load your .env before running this script.');
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to DB');

  const res = await client.query(`
    SELECT 
      trigger_name,
      event_manipulation,
      event_object_schema,
      event_object_table,
      action_statement
    FROM information_schema.triggers
    WHERE event_object_schema = 'auth' AND event_object_table = 'users';
  `);

  console.log('Triggers on auth.users:', res.rows);
  await client.end();
}

main().catch(console.error);
