const { pool } = require('../config/database');

(async () => {
  const sql = `
    SELECT
      con.conname as constraint_name,
      rel.relname as table_name,
      att.attname as column_name,
      rel2.relname as referenced_table,
      att2.attname as referenced_column
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
    JOIN pg_class rel2 ON rel2.oid = con.confrelid
    JOIN pg_attribute att2 ON att2.attrelid = rel2.oid AND att2.attnum = ANY(con.confkey)
    WHERE con.contype = 'f'
      AND rel.relname = 'appointments'
    ORDER BY con.conname;
  `;

  const res = await pool.query(sql);
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
