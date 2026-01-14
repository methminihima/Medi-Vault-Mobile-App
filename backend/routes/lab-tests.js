const express = require('express');
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

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

async function getColumnsMeta(tableName) {
  const r = await pool.query(
    `SELECT column_name, is_nullable, column_default, data_type, udt_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [String(tableName)]
  );

  const meta = new Map();
  for (const row of r.rows || []) {
    meta.set(String(row.column_name), {
      isNullable: String(row.is_nullable) === 'YES',
      defaultValue: row.column_default,
      dataType: row.data_type,
      udtName: row.udt_name,
    });
  }
  return meta;
}

function pickInsertable(meta, candidates) {
  return candidates.filter((c) => meta.has(c));
}

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
  // Schema-agnostic display name (avoids "column does not exist" errors)
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

function buildNotes({ priority, category, instructions, additionalNotes }) {
  const parts = [];
  if (priority) parts.push(`Priority: ${priority}`);
  if (category) parts.push(`Category: ${category}`);
  if (instructions) parts.push(`Instructions: ${instructions}`);
  if (additionalNotes) parts.push(`Notes: ${additionalNotes}`);
  const out = parts.join('\n');
  return out.trim() || null;
}

function nowIso() {
  return new Date().toISOString();
}

function dateOnly() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * POST /api/lab-tests
 * Body:
 * {
 *   patientId: string,
 *   doctorId: string,
 *   appointmentId?: string,
 *   priority?: 'routine'|'urgent'|'stat',
 *   additionalNotes?: string,
 *   tests: [{ testName: string, testType: string, category?: string, instructions?: string }]
 * }
 */
router.post('/', async (req, res) => {
  const payload = req.body || {};

  const patientId = payload.patientId != null ? String(payload.patientId).trim() : '';
  const doctorId = payload.doctorId != null ? String(payload.doctorId).trim() : '';
  const appointmentId = payload.appointmentId != null ? String(payload.appointmentId).trim() : '';
  const priority = payload.priority != null ? String(payload.priority).trim() : '';
  const additionalNotes = payload.additionalNotes != null ? String(payload.additionalNotes) : '';

  const tests = Array.isArray(payload.tests) ? payload.tests : [];

  if (!patientId || !doctorId) {
    return res.status(400).json({ success: false, message: 'patientId and doctorId are required' });
  }

  if (!tests.length) {
    return res.status(400).json({ success: false, message: 'At least one lab test is required' });
  }

  const hasLabTestsTable = await tableExists('lab_tests');
  if (!hasLabTestsTable) {
    return res.status(500).json({ success: false, message: 'Database table lab_tests not found' });
  }

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

    const meta = await getColumnsMeta('lab_tests');

    const insertCandidates = [
      'id',
      'patient_id',
      'doctor_id',
      'lab_technician_id',
      'appointment_id',
      'test_type',
      'test_name',
      'status',
      'priority',
      'request_date',
      'completion_date',
      'results',
      'result_file_url',
      'is_abnormal',
      'notes',
      'created_at',
      'updated_at',
    ];

    const insertCols = pickInsertable(meta, insertCandidates);

    // If `id` exists but is likely auto-generated, avoid forcing a value.
    const idMeta = meta.get('id');
    const canGenerateId =
      idMeta &&
      !idMeta.defaultValue &&
      (String(idMeta.dataType).toLowerCase() === 'uuid' || String(idMeta.udtName).toLowerCase() === 'uuid');

    const finalInsertCols = insertCols.filter((c) => c !== 'id' || canGenerateId);

    const requestDateMeta = meta.get('request_date');
    const requestDateValue =
      requestDateMeta && String(requestDateMeta.dataType).toLowerCase() === 'date' ? dateOnly() : nowIso();

    const createdIds = [];

    for (const t of tests) {
      const testName = t?.testName != null ? String(t.testName).trim() : '';
      const testType = t?.testType != null ? String(t.testType).trim() : '';
      const category = t?.category != null ? String(t.category).trim() : '';
      const instructions = t?.instructions != null ? String(t.instructions) : '';

      if (!testName || !testType) {
        const err = new Error('Each test requires testName and testType');
        err.statusCode = 400;
        throw err;
      }

      const newId = canGenerateId ? uuidv4() : null;
      const n = nowIso();

      const getValueForCol = (col) => {
        if (col === 'id') return newId;
        if (col === 'patient_id') return resolvedPatientId;
        if (col === 'doctor_id') return resolvedDoctorId;
        if (col === 'lab_technician_id') return null;
        if (col === 'appointment_id') return appointmentId || null;
        if (col === 'test_type') return testType;
        if (col === 'test_name') return testName;
        if (col === 'status') return payload.status != null ? String(payload.status) : 'pending';
        if (col === 'priority') return priority || null;
        if (col === 'request_date') return requestDateValue;
        if (col === 'completion_date') return null;
        if (col === 'results') return null;
        if (col === 'result_file_url') return null;
        if (col === 'is_abnormal') return false;
        if (col === 'notes') return buildNotes({ priority, category, instructions, additionalNotes });
        if (col === 'created_at') return n;
        if (col === 'updated_at') return n;
        return null;
      };

      const values = finalInsertCols.map((c) => getValueForCol(c));
      const params = finalInsertCols.map((_, i) => `$${i + 1}`).join(', ');

      const hasIdReturn = meta.has('id');
      const returning = hasIdReturn ? ' RETURNING id' : '';

      const sql = `INSERT INTO lab_tests (${finalInsertCols.join(', ')}) VALUES (${params})${returning}`;
      const r = await client.query(sql, values);

      if (hasIdReturn && (r.rows || []).length) {
        createdIds.push(String(r.rows[0].id));
      }
    }

    await client.query('COMMIT');
    return res.json({
      success: true,
      data: {
        ids: createdIds,
      },
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error creating lab tests:', e);
    const statusCode = typeof e?.statusCode === 'number' ? e.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      message: 'Failed to create lab tests',
      error: e.message,
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/lab-tests
 * Optional filters: patientId, doctorId, status, appointmentId
 */
router.get('/', async (req, res) => {
  try {
    const hasLabTestsTable = await tableExists('lab_tests');
    if (!hasLabTestsTable) {
      return res.status(500).json({ success: false, message: 'lab_tests table not found' });
    }

    const meta = await getColumnsMeta('lab_tests');

    const patientIdRaw = typeof req.query.patientId === 'string' ? req.query.patientId.trim() : '';
    const doctorIdRaw = typeof req.query.doctorId === 'string' ? req.query.doctorId.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const appointmentId = typeof req.query.appointmentId === 'string' ? req.query.appointmentId.trim() : '';

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

      const params = [];
      let where = 'WHERE 1=1';

      if (patientId && meta.has('patient_id')) {
        params.push(patientId);
        where += ` AND patient_id = $${params.length}`;
      }

      if (doctorId && meta.has('doctor_id')) {
        params.push(doctorId);
        where += ` AND doctor_id = $${params.length}`;
      }

      if (status && meta.has('status')) {
        params.push(status);
        where += ` AND status = $${params.length}`;
      }

      if (appointmentId && meta.has('appointment_id')) {
        params.push(appointmentId);
        where += ` AND appointment_id = $${params.length}`;
      }

    const orderBy = meta.has('created_at')
      ? 'created_at'
      : meta.has('request_date')
        ? 'request_date'
        : meta.has('id')
          ? 'id'
          : null;

      const sql = `SELECT * FROM lab_tests ${where}${orderBy ? ` ORDER BY ${orderBy} DESC` : ''} LIMIT 200`;
      const r = await client.query(sql, params);

      const rows = r.rows || [];

      // Best-effort doctor/patient name enrichment
      let doctorNameById = new Map();
      let patientNameById = new Map();
      try {
        const hasUsersTable = await tableExists('users');
        const hasDoctorsTable = await tableExists('doctors');
        const hasPatientsTable = await tableExists('patients');
        const nameExpr = buildUserNameExpr();

        if (hasUsersTable && hasDoctorsTable && meta.has('doctor_id')) {
          const doctorIds = Array.from(new Set(rows.map((x) => String(x.doctor_id)).filter(Boolean)));
          if (doctorIds.length) {
            let dr;
            try {
              dr = await client.query(
                `SELECT d.id AS doctor_id, ${nameExpr} AS name
                 FROM doctors d
                 LEFT JOIN users u ON u.id = d.user_id
                 WHERE d.id = ANY($1::text[])`,
                [doctorIds]
              );
            } catch {
              dr = await client.query(
                `SELECT d.id AS doctor_id, ${nameExpr} AS name
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

        if (hasUsersTable && hasPatientsTable && meta.has('patient_id')) {
          const patientIds = Array.from(new Set(rows.map((x) => String(x.patient_id)).filter(Boolean)));
          if (patientIds.length) {
            let pr;
            try {
              pr = await client.query(
                `SELECT p.id AS patient_id, ${nameExpr} AS name
                 FROM patients p
                 LEFT JOIN users u ON u.id = p.user_id
                 WHERE p.id = ANY($1::text[])`,
                [patientIds]
              );
            } catch {
              pr = await client.query(
                `SELECT p.id AS patient_id, ${nameExpr} AS name
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
        console.warn('Skipping lab tests name enrichment:', e?.message || e);
      }

      return res.json({
        success: true,
        data: rows.map((x) => ({
          ...x,
          doctor_name: meta.has('doctor_id') ? (doctorNameById.get(String(x.doctor_id)) || null) : null,
          patient_name: meta.has('patient_id') ? (patientNameById.get(String(x.patient_id)) || null) : null,
        })),
      });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Error listing lab tests:', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch lab tests', error: e.message });
  }
});

module.exports = router;
