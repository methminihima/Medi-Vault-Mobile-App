/*
  Reset a user's password in the database.

  Usage:
    node reset-user-password.js --username admin --password "NewPass123" --yes
    node reset-user-password.js --email admin@medivault.com --password "NewPass123" --yes

  Notes:
    - Requires backend .env DB_* variables (same as the server).
    - Without --yes, it will only print the matched user and exit.
*/

const bcrypt = require('bcrypt');
const { query, pool } = require('./config/database');

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) return null;
  return value;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function main() {
  const username = getArgValue('--username');
  const email = getArgValue('--email');
  const password = getArgValue('--password');
  const yes = hasFlag('--yes');

  if ((!username && !email) || !password) {
    console.error('Missing required args.');
    console.error('Examples:');
    console.error('  node reset-user-password.js --username admin --password "NewPass123" --yes');
    console.error('  node reset-user-password.js --email admin@medivault.com --password "NewPass123" --yes');
    process.exitCode = 1;
    return;
  }

  if (String(password).length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exitCode = 1;
    return;
  }

  const identifier = username ? { field: 'username', value: username } : { field: 'email', value: email };

  const userResult = await query(
    `SELECT id, username, email, role, is_active, deactivated_at FROM users WHERE LOWER(${identifier.field}) = LOWER($1)`,
    [identifier.value]
  );

  if (userResult.rows.length === 0) {
    console.error(`No user found for ${identifier.field}=${identifier.value}`);
    process.exitCode = 1;
    return;
  }

  if (userResult.rows.length > 1) {
    console.error(`Multiple users matched ${identifier.field}=${identifier.value}. Aborting.`);
    console.error(JSON.stringify(userResult.rows, null, 2));
    process.exitCode = 1;
    return;
  }

  const user = userResult.rows[0];
  console.log('Matched user:');
  console.log(JSON.stringify(user, null, 2));

  if (!yes) {
    console.log('\nDry run only (no changes made). Re-run with --yes to apply the password reset.');
    return;
  }

  const hash = await bcrypt.hash(String(password), 10);

  const updateResult = await query('UPDATE users SET password = $1 WHERE id = $2', [hash, user.id]);

  if (updateResult.rowCount !== 1) {
    console.error('Unexpected update result:', updateResult.rowCount);
    process.exitCode = 1;
    return;
  }

  console.log(`\n✅ Password updated for ${user.username} (${user.email})`);
}

main()
  .catch((err) => {
    console.error('Password reset failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await pool.end();
    } catch {
      // ignore
    }
  });
