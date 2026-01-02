-- Setup script for MediVault database
-- Run this in pgAdmin Query Tool on the 'medivault' database

-- Drop existing table if you want a fresh start (OPTIONAL - COMMENT OUT IF YOU WANT TO KEEP DATA)
-- DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'doctor', 'patient', 'pharmacist', 'lab_technician')),
    nic VARCHAR(50),
    address TEXT,
    date_of_birth DATE,
    specialization VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
-- Username: admin
-- Password: admin123
INSERT INTO users (full_name, email, phone, username, password_hash, role, status)
VALUES 
    ('System Administrator', 'admin@medivault.com', '+94771234567', 'admin', 
     '$2b$10$WUl24OPhX2QsOM/tv8DmX.20Ug.R.45z0AG4AiKJG.YZAfu2OWHRm', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- Verify data
SELECT id, full_name, email, username, role, status, created_at 
FROM users 
ORDER BY id;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Admin credentials:';
    RAISE NOTICE '  Username: admin';
    RAISE NOTICE '  Password: admin123';
END $$;
