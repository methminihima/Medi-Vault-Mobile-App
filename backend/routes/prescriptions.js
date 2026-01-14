const express = require('express');
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

async function resolveDoctorId(client, doctorIdOrUserId) {
  const hasDoctorsTable = await tableExists('doctors');
  if (!hasDoctorsTable) return doctorIdOrUserId;

  // Accept either doctors.id or users.id.
  const direct = await client.query('SELECT id FROM doctors WHERE id = $1 LIMIT 1', [doctorIdOrUserId]);
  if ((direct.rows || []).length) return String(direct.rows[0].id);

  // Map from users.id -> doctors.id (support either user_id or userId column)
  try {
    const mapped = await client.query('SELECT id FROM doctors WHERE user_id = $1 LIMIT 1', [doctorIdOrUserId]);
    if ((mapped.rows || []).length) return String(mapped.rows[0].id);
  } catch {
    // ignore
  }

  try {
    const mapped = await client.query('SELECT id FROM doctors WHERE "userId" = $1 LIMIT 1', [doctorIdOrUserId]);
    if ((mapped.rows || []).length) return String(mapped.rows[0].id);
  } catch {
    // ignore
  }

  return null;
}

async function resolvePatientId(client, patientIdOrUserId) {
  const hasPatientsTable = await tableExists('patients');
  if (!hasPatientsTable) return patientIdOrUserId;

  // Accept either patients.id or users.id.
  const direct = await client.query('SELECT id FROM patients WHERE id = $1 LIMIT 1', [patientIdOrUserId]);
  if ((direct.rows || []).length) return String(direct.rows[0].id);

  // Map from users.id -> patients.id (support either user_id or userId column)
  try {
    const mapped = await client.query('SELECT id FROM patients WHERE user_id = $1 LIMIT 1', [patientIdOrUserId]);
    if ((mapped.rows || []).length) return String(mapped.rows[0].id);
  } catch {
    // ignore
  }

  try {
    const mapped = await client.query('SELECT id FROM patients WHERE "userId" = $1 LIMIT 1', [patientIdOrUserId]);
    if ((mapped.rows || []).length) return String(mapped.rows[0].id);
  } catch {
    // ignore
  }

  return null;
}

function buildUserNameExpr() {
  // Schema-agnostic display name:
  // - Prefer full_name/fullName when present
  // - Else fall back to first+last name
  // Using to_jsonb(u)->>'col' avoids "column does not exist" errors.
  return `NULLIF(
    COALESCE(
      to_jsonb(u)->>'full_name',
      to_jsonb(u)->>'fullName',
      NULLIF(
        CONCAT_WS(
          ' ',
          COALESCE(to_jsonb(u)->>'first_name', to_jsonb(u)->>'firstName'),
          COALESCE(to_jsonb(u)->>'last_name', to_jsonb(u)->>'lastName')
        ),
        ''
      )
    ),
    ''
  )`;
}

async function tableExists(tableName) {
  const r = await pool.query(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1
     LIMIT 1`,
    [String(tableName)]
  );
  return (r.rows || []).length > 0;
}

async function getColumns(tableName) {
  const r = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [String(tableName)]
  );
  return new Set((r.rows || []).map((x) => String(x.column_name)));
}

function pickInsertable(columnsSet, candidates) {
  return candidates.filter((c) => columnsSet.has(c));
}

/**
 * POST /api/prescriptions
 * Body:
 * {
 *   patientId: string,
 *   doctorId: string,
 *   appointmentId?: string,
 *   diagnosis?: string,
 *   notes?: string,
 *   prescriptionDate?: string,
 *   expiryDate?: string,
 *   status?: string,
 *   items: [{
 *     medicineId?: string,
 *     medicineName: string,
 *     dosage: string,
 *     frequency: string,
 *     duration: string,
 *     quantity: number,
 *     instructions?: string
 *   }]
 * }
 */
router.post('/', async (req, res) => {
  const payload = req.body || {};
  const patientId = payload.patientId != null ? String(payload.patientId).trim() : '';
  const doctorId = payload.doctorId != null ? String(payload.doctorId).trim() : '';
  const appointmentId = payload.appointmentId != null ? String(payload.appointmentId).trim() : '';
  const diagnosis = payload.diagnosis != null ? String(payload.diagnosis) : '';
  const notes = payload.notes != null ? String(payload.notes) : '';
  const status = payload.status != null ? String(payload.status) : 'active';

  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!patientId || !doctorId) {
    return res.status(400).json({
      success: false,
      message: 'patientId and doctorId are required',
    });
  }

  if (!items.length) {
    return res.status(400).json({
      success: false,
      message: 'At least one prescription item is required',
    });
  }

  const hasItemsTable = await tableExists('prescription_items');
  if (!hasItemsTable) {
    return res.status(500).json({
      success: false,
      message: 'Database table prescription_items not found',
    });
  }

  const hasPrescriptionsTable = await tableExists('prescriptions');

  const nowIso = new Date().toISOString();
  const prescriptionId = uuidv4();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const resolvedDoctorId = await resolveDoctorId(client, doctorId);
    if (!resolvedDoctorId) {
      const err = new Error('Doctor record not found for doctorId');
      err.statusCode = 400;
      throw err;
    }

    const resolvedPatientId = await resolvePatientId(client, patientId);
    if (!resolvedPatientId) {
      const err = new Error('Patient record not found for patientId');
      err.statusCode = 400;
      throw err;
    }

    if (hasPrescriptionsTable) {
      const cols = await getColumns('prescriptions');

      // Try to insert whatever columns exist in this DB.
      const insertCandidates = [
        'id',
        'patient_id',
        'doctor_id',
        'appointment_id',
        'diagnosis',
        'notes',
        'instructions',
        'prescription_date',
        'expiry_date',
        'status',
        'created_at',
        'updated_at',
      ];

      const insertCols = pickInsertable(cols, insertCandidates);
      const values = [];

      const getValueForCol = (col) => {
        if (col === 'id') return prescriptionId;
        if (col === 'patient_id') return resolvedPatientId;
        if (col === 'doctor_id') return resolvedDoctorId;
        if (col === 'appointment_id') return appointmentId || null;
        if (col === 'diagnosis') return diagnosis || null;
        if (col === 'notes') return notes || null;
        if (col === 'instructions') return notes || null;
        if (col === 'prescription_date') return payload.prescriptionDate ? String(payload.prescriptionDate) : nowIso;
        if (col === 'expiry_date') return payload.expiryDate ? String(payload.expiryDate) : null;
        if (col === 'status') return status;
        if (col === 'created_at') return nowIso;
        if (col === 'updated_at') return nowIso;
        return null;
      };

      for (const c of insertCols) values.push(getValueForCol(c));

      if (insertCols.length) {
        const params = insertCols.map((_, i) => `$${i + 1}`).join(', ');
        const sql = `INSERT INTO prescriptions (${insertCols.join(', ')}) VALUES (${params})`;
        await client.query(sql, values);
      }
    }

    const itemColsSet = await getColumns('prescription_items');
    const itemInsertCandidates = [
      'id',
      'prescription_id',
      'medicine_id',
      'medicine_name',
      'dosage',
      'frequency',
      'duration',
      'quantity',
      'instructions',
      'created_at',
    ];
    const itemInsertCols = pickInsertable(itemColsSet, itemInsertCandidates);

    for (const item of items) {
      const itemId = uuidv4();
      const medicineName = item?.medicineName != null ? String(item.medicineName).trim() : '';
      const medicineId = item?.medicineId != null ? String(item.medicineId).trim() : '';
      const dosage = item?.dosage != null ? String(item.dosage).trim() : '';
      const frequency = item?.frequency != null ? String(item.frequency).trim() : '';
      const duration = item?.duration != null ? String(item.duration).trim() : '';
      const quantity = Number(item?.quantity ?? 0);
      const instructions = item?.instructions != null ? String(item.instructions) : '';

      if (!medicineName || !dosage || !frequency || !duration) {
        throw new Error('Each item requires medicineName, dosage, frequency, and duration');
      }

      const getItemValue = (col) => {
        if (col === 'id') return itemId;
        if (col === 'prescription_id') return prescriptionId;
        if (col === 'medicine_id') return medicineId || null;
        if (col === 'medicine_name') return medicineName;
        if (col === 'dosage') return dosage;
        if (col === 'frequency') return frequency;
        if (col === 'duration') return duration;
        if (col === 'quantity') return Number.isFinite(quantity) ? quantity : null;
        if (col === 'instructions') return instructions || null;
        if (col === 'created_at') return nowIso;
        return null;
      };

      const vals = itemInsertCols.map((c) => getItemValue(c));
      const params = itemInsertCols.map((_, i) => `$${i + 1}`).join(', ');
      const sql = `INSERT INTO prescription_items (${itemInsertCols.join(', ')}) VALUES (${params})`;
      await client.query(sql, vals);
    }

    await client.query('COMMIT');
    return res.json({
      success: true,
      data: {
        id: prescriptionId,
      },
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error creating prescription:', e);
    const statusCode = typeof e?.statusCode === 'number' ? e.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      message: 'Failed to create prescription',
      error: e.message,
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/prescriptions
 * Basic list endpoint (items included). Optional filters: patientId, doctorId
 */
router.get('/', async (req, res) => {
  try {
    const hasItemsTable = await tableExists('prescription_items');
    if (!hasItemsTable) {
      return res.status(500).json({ success: false, message: 'prescription_items table not found' });
    }

    const hasPrescriptionsTable = await tableExists('prescriptions');
    const patientIdRaw = typeof req.query.patientId === 'string' ? req.query.patientId.trim() : '';
    const doctorIdRaw = typeof req.query.doctorId === 'string' ? req.query.doctorId.trim() : '';

    if (!hasPrescriptionsTable) {
      // Fallback: group from items only
      const params = [];
      let where = '';
      if (patientId || doctorId) {
        // Can't filter without header table
        where = '';
      }

      const r = await pool.query(
        `SELECT prescription_id,
                MIN(created_at) AS created_at
         FROM prescription_items
         ${where}
         GROUP BY prescription_id
         ORDER BY MIN(created_at) DESC
         LIMIT 200`,
        params
      );

      const ids = (r.rows || []).map((x) => x.prescription_id);
      if (!ids.length) return res.json({ success: true, data: [] });

      const itemsR = await pool.query(
        `SELECT *
         FROM prescription_items
         WHERE prescription_id = ANY($1::text[])
         ORDER BY created_at ASC`,
        [ids]
      );

      const grouped = new Map();
      for (const row of itemsR.rows || []) {
        const pid = String(row.prescription_id);
        const list = grouped.get(pid) || [];
        list.push(row);
        grouped.set(pid, list);
      }

      return res.json({
        success: true,
        data: ids.map((id) => ({ id, items: grouped.get(id) || [] })),
      });
    }

    const client = await pool.connect();
    let patientId = patientIdRaw;
    let doctorId = doctorIdRaw;

    try {
      if (patientIdRaw) {
        const resolved = await resolvePatientId(client, patientIdRaw);
        if (!resolved) {
          return res.status(400).json({ success: false, message: 'Patient record not found for patientId' });
        }
        patientId = resolved;
      }

      if (doctorIdRaw) {
        const resolved = await resolveDoctorId(client, doctorIdRaw);
        if (!resolved) {
          return res.status(400).json({ success: false, message: 'Doctor record not found for doctorId' });
        }
        doctorId = resolved;
      }

      const cols = await getColumns('prescriptions');
    const hasCreatedAt = cols.has('created_at');

    const params = [];
    let where = 'WHERE 1=1';

    if (patientId && cols.has('patient_id')) {
      params.push(patientId);
      where += ` AND patient_id = $${params.length}`;
    }

    if (doctorId && cols.has('doctor_id')) {
      params.push(doctorId);
      where += ` AND doctor_id = $${params.length}`;
    }

      const r = await client.query(
      `SELECT *
       FROM prescriptions
       ${where}
       ORDER BY ${hasCreatedAt ? 'created_at' : 'id'} DESC
       LIMIT 200`,
      params
    );

    const pres = r.rows || [];
    const ids = pres.map((p) => String(p.id));
      const itemsR = await client.query(
      `SELECT *
       FROM prescription_items
       WHERE prescription_id = ANY($1::text[])
       ORDER BY created_at ASC`,
      [ids]
    );

    const itemsBy = new Map();
    for (const row of itemsR.rows || []) {
      const pid = String(row.prescription_id);
      const list = itemsBy.get(pid) || [];
      list.push(row);
      itemsBy.set(pid, list);
    }

      // Best-effort enrichment of doctor/patient names (must never crash endpoint)
      let doctorNameById = new Map();
      let patientNameById = new Map();
      try {
        const hasDoctorsTable = await tableExists('doctors');
        const hasPatientsTable = await tableExists('patients');
        const hasUsersTable = await tableExists('users');
        const nameExpr = buildUserNameExpr();

        if (hasUsersTable && hasDoctorsTable && cols.has('doctor_id')) {
          const doctorIds = Array.from(new Set(pres.map((p) => String(p.doctor_id)).filter(Boolean)));
          if (doctorIds.length) {
            // Join on doctors.user_id or doctors.userId (schema varies)
            let dr;
            try {
              dr = await client.query(
                `SELECT d.id AS doctor_id,
                        ${nameExpr} AS name
                 FROM doctors d
                 LEFT JOIN users u ON u.id = d.user_id
                 WHERE d.id = ANY($1::text[])`,
                [doctorIds]
              );
            } catch {
              dr = await client.query(
                `SELECT d.id AS doctor_id,
                        ${nameExpr} AS name
                 FROM doctors d
                 LEFT JOIN users u ON u.id = d."userId"
                 WHERE d.id = ANY($1::text[])`,
                [doctorIds]
              );
            }
            for (const row of dr?.rows || []) {
              doctorNameById.set(String(row.doctor_id), row.name || null);
            }
          }
        }

        if (hasUsersTable && hasPatientsTable && cols.has('patient_id')) {
          const patientIds = Array.from(new Set(pres.map((p) => String(p.patient_id)).filter(Boolean)));
          if (patientIds.length) {
            let pr;
            try {
              pr = await client.query(
                `SELECT p.id AS patient_id,
                        ${nameExpr} AS name
                 FROM patients p
                 LEFT JOIN users u ON u.id = p.user_id
                 WHERE p.id = ANY($1::text[])`,
                [patientIds]
              );
            } catch {
              pr = await client.query(
                `SELECT p.id AS patient_id,
                        ${nameExpr} AS name
                 FROM patients p
                 LEFT JOIN users u ON u.id = p."userId"
                 WHERE p.id = ANY($1::text[])`,
                [patientIds]
              );
            }
            for (const row of pr?.rows || []) {
              patientNameById.set(String(row.patient_id), row.name || null);
            }
          }
        }
      } catch (e) {
        console.warn('Skipping prescriptions name enrichment:', e?.message || e);
      }

    return res.json({
      success: true,
      data: pres.map((p) => ({
        ...p,
        doctor_name: cols.has('doctor_id') ? (doctorNameById.get(String(p.doctor_id)) || null) : null,
        patient_name: cols.has('patient_id') ? (patientNameById.get(String(p.patient_id)) || null) : null,
        items: itemsBy.get(String(p.id)) || [],
      })),
    });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Error listing prescriptions:', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch prescriptions', error: e.message });
  }
});

module.exports = router;
