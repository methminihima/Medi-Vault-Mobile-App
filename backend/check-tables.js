const { query } = require('./config/database');

async function checkTables() {
  const tables = ['patients', 'doctors', 'pharmacists', 'lab_technicians'];
  
  for (const table of tables) {
    console.log(`\n==================== ${table.toUpperCase()} ====================`);
    const res = await query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = $1 
       ORDER BY ordinal_position`,
      [table]
    );
    
    res.rows.forEach(row => {
      console.log(`  ${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
  }
  
  process.exit(0);
}

checkTables().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
