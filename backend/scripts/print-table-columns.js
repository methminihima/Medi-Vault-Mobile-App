const { pool } = require('../config/database');

async function main() {
  const table = process.argv[2];
  if (!table) {
    console.error('Usage: node scripts/print-table-columns.js <table_name>');
    process.exit(1);
  }

  const sql = `
    select column_name, data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = $1
    order by ordinal_position
  `;

  const res = await pool.query(sql, [table]);
  console.table(res.rows);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
