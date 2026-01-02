-- Step 1: Create database (run this as postgres superuser)
-- Right-click on "PostgreSQL 17" -> Query Tool and run:

-- Create database
CREATE DATABASE medivault;

-- Create user with password
CREATE USER medivault WITH PASSWORD '12345';

-- Grant privileges to user
GRANT ALL PRIVILEGES ON DATABASE medivault TO medivault;

-- Connect to medivault database now (change connection to medivault database)
-- In pgAdmin: Right-click on 'medivault' database -> Query Tool

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO medivault;

-- Make medivault the owner of public schema
ALTER SCHEMA public OWNER TO medivault;

-- Grant default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO medivault;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO medivault;

-- Verify
SELECT current_database(), current_user;
