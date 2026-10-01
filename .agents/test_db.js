const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:password@localhost:5432/hackathon_db'
});

async function main() {
  try {
    await client.connect();
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log('PostgreSQL Connection Successful!');
    console.log('Available Tables:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('PostgreSQL Connection Error Stack:', err);
  } finally {
    await client.end();
  }
}

main();
