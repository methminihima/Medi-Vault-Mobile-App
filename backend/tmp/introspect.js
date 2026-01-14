const { pool } = require('../config/database');

(async () => {
  const sql = `
    select table_name, column_name, data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('users','doctors','appointments')
    order by table_name, ordinal_position;
  `;

  const res = await pool.query(sql);
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
