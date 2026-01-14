const { pool } = require('../config/database');

(async () => {
  const cols = await pool.query(
    "select column_name,data_type from information_schema.columns where table_schema='public' and table_name='patients' order by ordinal_position"
  );
  console.log('patients columns:', JSON.stringify(cols.rows, null, 2));

  const sample = await pool.query('select * from patients limit 5');
  console.log('patients sample:', JSON.stringify(sample.rows, null, 2));

  await pool.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
