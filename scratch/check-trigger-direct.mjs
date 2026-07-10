import { Client } from 'pg';

// Direct connection string
const connectionString = 'postgresql://postgres:%40B3n.Jakusa@db.yghndmkuogaepegibxhd.supabase.co:5432/postgres';

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
