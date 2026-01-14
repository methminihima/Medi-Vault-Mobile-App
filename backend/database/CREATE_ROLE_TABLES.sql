-- Setup script to create role-specific tables
-- Run this after creating the main users table

\c medivault;

-- Create the update_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blood_group VARCHAR(10),
    allergies TEXT,
    medical_history TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    insurance_provider VARCHAR(255),
    insurance_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    qualification TEXT,
    experience_years INTEGER,
    consultation_fee DECIMAL(10, 2),
    available_days TEXT,
    available_hours TEXT,
    department VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pharmacists Table  
CREATE TABLE IF NOT EXISTS pharmacists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    pharmacy_name VARCHAR(255),
    pharmacy_address TEXT,
    shift_timing VARCHAR(50),
    specialization VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab Technicians Table
CREATE TABLE IF NOT EXISTS lab_technicians (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    specialization VARCHAR(255),
    lab_department VARCHAR(255),
    certification TEXT,
    shift_timing VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_license ON doctors(license_number);
CREATE INDEX IF NOT EXISTS idx_pharmacists_user_id ON pharmacists(user_id);
CREATE INDEX IF NOT EXISTS idx_pharmacists_license ON pharmacists(license_number);
CREATE INDEX IF NOT EXISTS idx_lab_technicians_user_id ON lab_technicians(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_technicians_license ON lab_technicians(license_number);

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
DROP TRIGGER IF EXISTS update_pharmacists_updated_at ON pharmacists;
DROP TRIGGER IF EXISTS update_lab_technicians_updated_at ON lab_technicians;

-- Create triggers to update updated_at timestamp
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pharmacists_updated_at BEFORE UPDATE ON pharmacists
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_technicians_updated_at BEFORE UPDATE ON lab_technicians
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE patients TO postgres;
GRANT ALL PRIVILEGES ON TABLE doctors TO postgres;
GRANT ALL PRIVILEGES ON TABLE pharmacists TO postgres;
GRANT ALL PRIVILEGES ON TABLE lab_technicians TO postgres;

GRANT USAGE, SELECT ON SEQUENCE patients_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE doctors_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE pharmacists_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE lab_technicians_id_seq TO postgres;

-- Success message
SELECT 'Role-specific tables created successfully!' AS status;
