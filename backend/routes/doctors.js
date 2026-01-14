const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

/**
 * @route   GET /api/doctors/registry
 * @desc    Doctor registry (joined users + doctors)
 * @access  Private (Admin) - auth middleware not yet enforced in this backend
 */
router.get('/registry', async (req, res) => {
  try {
    const { q, status, specialization } = req.query;

    const params = [];
    let whereSql = "WHERE u.role = 'doctor'";

    if (typeof status === 'string' && status !== 'all') {
      if (status === 'active') {
        whereSql += ' AND u.is_active = true';
      } else if (status === 'inactive') {
        whereSql += ' AND u.is_active = false';
      }
    }

    if (typeof specialization === 'string' && specialization.trim() && specialization !== 'all') {
      params.push(specialization.trim());
      whereSql += ` AND COALESCE(doc.specialization, '') ILIKE $${params.length}`;
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
          OR COALESCE(doc.specialization, '') ILIKE ${p}
          OR COALESCE(doc.license_number, '') ILIKE ${p}
          OR COALESCE(doc.qualifications, '') ILIKE ${p}
          OR COALESCE(doc.available_days, '') ILIKE ${p}
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
         doc.id AS doctor_id,
         u.id AS user_id,
         u.first_name,
         u.last_name,
         u.email,
         u.username,
         u.is_active,
         u.deactivated_at,
         u.created_at,
         u.updated_at,
         doc.specialization,
         doc.license_number,
         doc.qualifications,
         doc.experience,
         doc.consultation_fee,
         doc.available_days,
         doc.created_at AS doctor_created_at,
         doc.updated_at AS doctor_updated_at
       FROM users u
       LEFT JOIN doctors doc ON doc.user_id = u.id
       ${whereSql}
       ORDER BY u.created_at DESC`,
      params
    );

    res.json({
      success: true,
      stats: statsResult.rows?.[0] || { total: 0, active: 0, inactive: 0 },
      data: (dataResult.rows || []).map((row) => ({
        doctorId: row.doctor_id,
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
        specialization: row.specialization,
        licenseNumber: row.license_number,
        qualifications: row.qualifications,
        experience: row.experience,
        consultationFee: row.consultation_fee,
        availableDays: row.available_days,
        doctorCreatedAt: row.doctor_created_at,
        doctorUpdatedAt: row.doctor_updated_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching doctor registry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor registry',
      error: error.message,
    });
  }
});

module.exports = router;
