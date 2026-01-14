const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

function maskRfid(value) {
  if (!value) return null;
  const s = String(value);
  if (s.length <= 4) return s;
  return `${'*'.repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
}

/**
 * @route   GET /api/patients/registry
 * @desc    Patient registry (joined users + patients)
 * @access  Private (Admin) - auth middleware not yet enforced in this backend
 */
router.get('/registry', async (req, res) => {
  try {
    const { q, status } = req.query;

    const params = [];
    let whereSql = `WHERE u.role = 'patient'`;

    if (typeof status === 'string' && status !== 'all') {
      if (status === 'active') {
        whereSql += ' AND u.is_active = true';
      } else if (status === 'inactive') {
        whereSql += ' AND u.is_active = false';
      }
    }

    if (typeof q === 'string' && q.trim()) {
      const term = `%${q.trim()}%`;
      params.push(term);
      const p = `$${params.length}`;
      whereSql += `
        AND (
          (COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) ILIKE ${p}
          OR u.email ILIKE ${p}
          OR u.username ILIKE ${p}
          OR COALESCE(pat.nic, '') ILIKE ${p}
          OR COALESCE(pat.health_id, '') ILIKE ${p}
          OR COALESCE(pat.contact_info, '') ILIKE ${p}
          OR COALESCE(pat.rfid, '') ILIKE ${p}
        )
      `;
    }

    const statsResult = await query(
      `SELECT 
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE u.is_active = true)::int AS active,
         COUNT(*) FILTER (WHERE u.is_active = false)::int AS inactive
       FROM users u
       ${whereSql}`,
      params
    );

    const dataResult = await query(
      `SELECT 
         pat.id AS patient_id,
         u.id AS user_id,
         u.first_name,
         u.last_name,
         u.email,
         u.username,
         u.is_active,
         u.deactivated_at,
         u.created_at,
         u.updated_at,
         pat.nic,
         pat.health_id,
         pat.rfid,
         pat.date_of_birth,
         pat.gender,
         pat.contact_info,
         pat.address,
         pat.blood_type,
         pat.allergies
       FROM users u
       LEFT JOIN patients pat ON pat.user_id = u.id
       ${whereSql}
       ORDER BY u.created_at DESC` ,
      params
    );

    res.json({
      success: true,
      stats: statsResult.rows?.[0] || { total: 0, active: 0, inactive: 0 },
      data: (dataResult.rows || []).map((row) => ({
        patientId: row.patient_id,
        userId: row.user_id,
        fullName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        username: row.username,
        isActive: row.is_active,
        deactivatedAt: row.deactivated_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        nic: row.nic,
        healthId: row.health_id,
        rfid: row.rfid,
        rfidMasked: maskRfid(row.rfid),
        dateOfBirth: row.date_of_birth,
        gender: row.gender,
        contactInfo: row.contact_info,
        address: row.address,
        bloodType: row.blood_type,
        allergies: row.allergies,
      })),
    });
  } catch (error) {
    console.error('Error fetching patient registry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient registry',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/patients/lookup
 * @desc    Lookup a single patient by Patient ID (health_id), NIC, and/or RFID
 * @access  Private (Doctor) - auth middleware not yet enforced in this backend
 */
router.get('/lookup', async (req, res) => {
  try {
    const patientIdRaw = typeof req.query.patientId === 'string' ? req.query.patientId : null;
    const healthIdRaw = typeof req.query.healthId === 'string' ? req.query.healthId : null;
    const nicRaw = typeof req.query.nic === 'string' ? req.query.nic : null;
    const rfidRaw = typeof req.query.rfid === 'string' ? req.query.rfid : null;

    const patientId = (patientIdRaw || healthIdRaw || '').trim();
    const nic = (nicRaw || '').trim();
    const rfid = (rfidRaw || '').trim();

    if (!patientId && !nic && !rfid) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one of: patientId (health_id), nic, rfid',
      });
    }

    const params = [];
    let whereSql = `WHERE u.role = 'patient'`;

    if (patientId) {
      params.push(patientId);
      const p = `$${params.length}`;
      whereSql += ` AND (pat.health_id = ${p} OR pat.id = ${p})`;
    }

    if (nic) {
      params.push(nic);
      const p = `$${params.length}`;
      whereSql += ` AND pat.nic = ${p}`;
    }

    if (rfid) {
      params.push(rfid);
      const p = `$${params.length}`;
      whereSql += ` AND pat.rfid = ${p}`;
    }

    const r = await query(
      `SELECT 
         pat.id AS patient_id,
         u.id AS user_id,
         u.first_name,
         u.last_name,
         u.email,
         u.username,
         u.is_active,
         u.created_at,
         pat.nic,
         pat.health_id,
         pat.rfid,
         pat.date_of_birth,
         pat.gender,
         pat.contact_info,
         pat.address,
         pat.blood_type,
         pat.allergies
       FROM users u
       JOIN patients pat ON pat.user_id = u.id
       ${whereSql}
       ORDER BY u.created_at DESC
       LIMIT 1`,
      params
    );

    if (!r.rows || r.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    const row = r.rows[0];
    return res.json({
      success: true,
      data: {
        patientId: row.patient_id,
        userId: row.user_id,
        fullName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        username: row.username,
        isActive: row.is_active,
        createdAt: row.created_at,
        nic: row.nic,
        healthId: row.health_id,
        rfid: row.rfid,
        rfidMasked: maskRfid(row.rfid),
        dateOfBirth: row.date_of_birth,
        gender: row.gender,
        contactInfo: row.contact_info,
        address: row.address,
        bloodType: row.blood_type,
        allergies: row.allergies,
      },
    });
  } catch (error) {
    console.error('Error looking up patient:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to lookup patient',
      error: error.message,
    });
  }
});

module.exports = router;
