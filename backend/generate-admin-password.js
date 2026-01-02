// Generate password hash for admin user
const bcrypt = require('bcrypt');

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  
  console.log('\n========================================');
  console.log('  Admin User Password Hash Generated');
  console.log('========================================\n');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\n========================================');
  console.log('  Copy this SQL to pgAdmin:');
  console.log('========================================\n');
  console.log(`INSERT INTO users (full_name, email, phone, username, password_hash, role, status)
VALUES ('System Administrator', 'admin@medivault.com', '+94771234567', 'admin', 
        '${hash}', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;`);
  console.log('\n========================================\n');
});
