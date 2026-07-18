import { readFileSync } from 'fs';
import pg from 'pg';

const projectRef = process.env.SUPABASE_PROJECT_REF;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
if (!projectRef || !dbPassword) {
  console.error('Set SUPABASE_PROJECT_REF and SUPABASE_DB_PASSWORD (see .env.example) before running this script.');
  process.exit(1);
}

const sql = readFileSync('../migrate.sql', 'utf-8');

const regions = [
  'eu-west-1', 'eu-west-2', 'eu-west-3',
  'eu-central-1', 'eu-central-2',
  'us-east-1', 'us-east-2',
  'us-west-1', 'us-west-2',
  'ap-southeast-1', 'ap-southeast-2',
  'ap-northeast-1', 'ap-northeast-2',
  'sa-east-1',
];

for (const region of regions) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const client = new pg.Client({
    host,
    port: 6543,
    user: `postgres.${projectRef}`,
    password: dbPassword,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log(`Connected via ${host}:6543`);

    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
    let ok = 0, skip = 0, errs = 0;

    for (const stmt of statements) {
      try {
        await client.query(stmt + ';');
        console.log(`OK: ${stmt.slice(0, 70)}`);
        ok++;
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`SKIP: ${stmt.slice(0, 70)}`);
          skip++;
        } else {
          console.error(`ERR:  ${stmt.slice(0, 70)} - ${err.message}`);
          errs++;
        }
      }
    }

    console.log(`\nDone: ${ok} applied, ${skip} skipped, ${errs} errors`);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.log(`${host}:6543 - ${err.message}`);
    await client.end().catch(() => {});
  }
}

console.error('All regions failed');
process.exit(1);
