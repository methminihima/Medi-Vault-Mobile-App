-- Fix permissions for existing database
-- Run this as postgres superuser in pgAdmin Query Tool

-- Connect to medivault database first, then run:
GRANT ALL PRIVILEGES ON DATABASE medivault TO medivault;
GRANT ALL ON SCHEMA public TO medivault;
ALTER SCHEMA public OWNER TO medivault;

-- Grant privileges on all existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO medivault;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO medivault;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO medivault;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO medivault;

SELECT 'Permissions fixed!' as status;
