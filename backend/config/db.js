const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const poolQuery = pool.query.bind(pool);

async function query(text, params) {
  const start = Date.now();
  const result = await poolQuery(text, params);

  if (process.env.NODE_ENV === 'development') {
    const duration = Date.now() - start;
    console.log('SQL query:', { text, duration, params });
  }

  return result;
}

async function withTransaction(callback) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

pool
  .query('SELECT NOW()')
  .then((result) => {
    console.log(`✅ Database connected: ${result.rows[0].now}`);
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

module.exports = pool;
module.exports.query = query;
module.exports.withTransaction = withTransaction;
module.exports.default = pool;
