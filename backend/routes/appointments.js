const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function getColumns(tableName) {
  const r = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [String(tableName).toLowerCase()]
  );
  return new Set((r.rows || []).map((x) => String(x.column_name)));
}

async function getAnyRoleRecipientId(role) {
  if (!role) return null;
  const r = await pool.query(
    'SELECT id FROM users WHERE role = $1 ORDER BY id LIMIT 1',
    [String(role)]
  );
  return r.rows?.[0]?.id || null;
}

async function insertNotification({
  recipientUserId = null,
  recipientRole = null,
  type = 'system',
  title,
  message,
  metadata = null,
}) {
  if (!title || !message) return;

  // This DB schema requires recipient_id to be non-null.
  // Use user id for direct notifications; for role-based notifications,
  // pick any user id for that role and set recipient_role for filtering.
  const recipientId = recipientUserId
    ? String(recipientUserId)
    : await getAnyRoleRecipientId(recipientRole);

  if (!recipientId) return;

  try {
    await pool.query(
      `INSERT INTO notifications (
        id, recipient_id, recipient_user_id, recipient_role, type, title, message, metadata, created_at, is_read
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), false)`,
      [
        uuidv4(),
        recipientId,
        recipientUserId ? String(recipientUserId) : null,
        recipientRole ? String(recipientRole) : null,
        String(type),
        String(title),
        String(message),
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (e) {
    console.error('Failed to insert notification:', e);
  }
}

async function getAppointmentActorUserIds(appointmentId) {
  const r = await pool.query(
    `SELECT pat.user_id AS patient_user_id,
            doc.user_id AS doctor_user_id
     FROM appointments a
     LEFT JOIN patients pat ON a.patient_id = pat.id
     LEFT JOIN doctors doc ON a.doctor_id = doc.id
     WHERE a.id = $1
     LIMIT 1`,
    [String(appointmentId)]
  );

  return {
    patientUserId: r.rows[0]?.patient_user_id || null,
    doctorUserId: r.rows[0]?.doctor_user_id || null,
  };
}

async function resolvePatientId(idOrUserId) {
  if (!idOrUserId) return null;
  const r = await pool.query(
    'SELECT id FROM patients WHERE id = $1 OR user_id = $1 LIMIT 1',
    [String(idOrUserId)]
  );
  return r.rows[0]?.id || null;
}

async function resolveDoctorId(idOrUserId) {
  if (!idOrUserId) return null;
  const r = await pool.query(
    'SELECT id FROM doctors WHERE id = $1 OR user_id = $1 LIMIT 1',
    [String(idOrUserId)]
  );
  return r.rows[0]?.id || null;
}

// Get all appointments (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { patient_id, doctor_id, status } = req.query;

    const resolvedPatientId = patient_id ? await resolvePatientId(patient_id) : null;
    const resolvedDoctorId = doctor_id ? await resolveDoctorId(doctor_id) : null;
    
    let query = `
      SELECT a.*, 
             p.first_name as patient_first_name, 
             p.last_name as patient_last_name,
             d.first_name as doctor_first_name, 
             d.last_name as doctor_last_name,
             doc.specialization as doctor_specialization
      FROM appointments a
      LEFT JOIN patients pat ON a.patient_id = pat.id
      LEFT JOIN users p ON pat.user_id = p.id
      LEFT JOIN doctors doc ON a.doctor_id = doc.id
      LEFT JOIN users d ON doc.user_id = d.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (patient_id) {
      if (!resolvedPatientId) {
        return res.json({ success: true, data: [] });
      }
      query += ` AND a.patient_id = $${paramCount}`;
      params.push(resolvedPatientId);
      paramCount++;
    }
    
    if (doctor_id) {
      if (!resolvedDoctorId) {
        return res.json({ success: true, data: [] });
      }
      query += ` AND a.doctor_id = $${paramCount}`;
      params.push(resolvedDoctorId);
      paramCount++;
    }
    
    if (status) {
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message,
    });
  }
});

// Get single appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT a.*, 
              p.first_name as patient_first_name, 
              p.last_name as patient_last_name,
              d.first_name as doctor_first_name, 
              d.last_name as doctor_last_name,
              doc.specialization as doctor_specialization
       FROM appointments a
       LEFT JOIN patients pat ON a.patient_id = pat.id
       LEFT JOIN users p ON pat.user_id = p.id
       LEFT JOIN doctors doc ON a.doctor_id = doc.id
       LEFT JOIN users d ON doc.user_id = d.id
       WHERE a.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment',
      error: error.message,
    });
  }
});

// Create new appointment
router.post('/', async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      reason,
      notes,
    } = req.body;
    
    // Validate required fields
    if (!patient_id || !doctor_id || !appointment_date || !appointment_time || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patient_id, doctor_id, appointment_date, appointment_time, and reason are required',
      });
    }
    
    const resolvedPatientId = await resolvePatientId(patient_id);
    const resolvedDoctorId = await resolveDoctorId(doctor_id);

    if (!resolvedPatientId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient_id (must be patient.id or patient.user_id)',
      });
    }

    if (!resolvedDoctorId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor_id (must be doctor.id or doctor.user_id)',
      });
    }

    const id = uuidv4();
    const status = 'pending'; // Default status for new appointments
    const created_at = new Date();
    
    const result = await pool.query(
      `INSERT INTO Appointments (
        id, patient_id, doctor_id, appointment_date, appointment_time,
        status, reason, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [id, resolvedPatientId, resolvedDoctorId, appointment_date, appointment_time, status, reason, notes || null, created_at]
    );

    // Notifications (best-effort)
    const actorIds = await pool.query(
      `SELECT pat.user_id AS patient_user_id,
              doc.user_id AS doctor_user_id
       FROM patients pat
       JOIN doctors doc ON doc.id = $2
       WHERE pat.id = $1
       LIMIT 1`,
      [String(resolvedPatientId), String(resolvedDoctorId)]
    );
    const patientUserId = actorIds.rows[0]?.patient_user_id || null;
    const doctorUserId = actorIds.rows[0]?.doctor_user_id || null;

    const baseMeta = {
      event: 'appointment_created',
      appointmentId: id,
      patientId: String(resolvedPatientId),
      doctorId: String(resolvedDoctorId),
    };

    await insertNotification({
      recipientRole: 'admin',
      type: 'system',
      title: 'New appointment request',
      message: `A new appointment was booked for ${appointment_date} at ${appointment_time}.`,
      metadata: baseMeta,
    });
    if (doctorUserId) {
      await insertNotification({
        recipientUserId: doctorUserId,
        type: 'system',
        title: 'New appointment request',
        message: `You have a new appointment request for ${appointment_date} at ${appointment_time}.`,
        metadata: baseMeta,
      });
    }
    if (patientUserId) {
      await insertNotification({
        recipientUserId: patientUserId,
        type: 'system',
        title: 'Appointment request submitted',
        message: `Your appointment request was submitted for ${appointment_date} at ${appointment_time}.`,
        metadata: baseMeta,
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      error: error.message,
    });
  }
});

// Update appointment status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, user_id, cancellation_reason, actual_visit_time, visit_notes } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }
    
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'cancel_requested'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, confirmed, completed, cancelled, cancel_requested',
      });
    }
    
    let updateQuery = 'UPDATE Appointments SET status = $1, updated_at = NOW()';
    const params = [status];
    let paramCount = 2;

    // Optional completion details (best-effort): update only if the columns exist.
    const cols = await getColumns('appointments');

    if (typeof actual_visit_time === 'string' && actual_visit_time.trim()) {
      if (cols.has('actual_visit_time')) {
        updateQuery += `, actual_visit_time = $${paramCount}`;
        params.push(actual_visit_time.trim());
        paramCount++;
      } else if (cols.has('actual_visit_time_text')) {
        updateQuery += `, actual_visit_time_text = $${paramCount}`;
        params.push(actual_visit_time.trim());
        paramCount++;
      }
    }

    if (typeof visit_notes === 'string' && visit_notes.trim()) {
      if (cols.has('visit_notes')) {
        updateQuery += `, visit_notes = $${paramCount}`;
        params.push(visit_notes.trim());
        paramCount++;
      } else if (cols.has('doctor_notes')) {
        updateQuery += `, doctor_notes = $${paramCount}`;
        params.push(visit_notes.trim());
        paramCount++;
      } else if (cols.has('notes')) {
        updateQuery += `, notes = $${paramCount}`;
        params.push(visit_notes.trim());
        paramCount++;
      }
    }
    
    // Add timestamp fields based on status
    if (status === 'confirmed') {
      updateQuery += `, approved_at = NOW()`;
      if (user_id) {
        updateQuery += `, approved_by = $${paramCount}`;
        params.push(String(user_id));
        paramCount++;
      }
    } else if (status === 'completed') {
      updateQuery += `, completed_at = NOW()`;
      if (user_id) {
        updateQuery += `, completed_by = $${paramCount}`;
        params.push(String(user_id));
        paramCount++;
      }
    } else if (status === 'cancelled') {
      updateQuery += `, cancelled_at = NOW()`;
      if (user_id) {
        updateQuery += `, cancelled_by = $${paramCount}`;
        params.push(String(user_id));
        paramCount++;
      }
    } else if (status === 'cancel_requested') {
      updateQuery += `, cancellation_requested_at = NOW(), cancellation_rejected_reason = NULL`;
      if (user_id) {
        updateQuery += `, cancellation_requested_by = $${paramCount}`;
        params.push(String(user_id));
        paramCount++;
      }
      if (typeof cancellation_reason === 'string' && cancellation_reason.trim()) {
        updateQuery += `, cancellation_reason = $${paramCount}`;
        params.push(cancellation_reason.trim());
        paramCount++;
      }
    }

    updateQuery += ` WHERE id = $${paramCount} RETURNING *`;
    params.push(String(id));
    
    const result = await pool.query(updateQuery, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Notifications (best-effort)
    const actors = await getAppointmentActorUserIds(id);
    const meta = { event: 'appointment_status_changed', appointmentId: String(id), status: String(status) };

    if (status === 'confirmed') {
      if (actors.patientUserId) {
        await insertNotification({
          recipientUserId: actors.patientUserId,
          type: 'system',
          title: 'Appointment approved',
          message: 'Your appointment has been approved by the doctor.',
          metadata: { ...meta, event: 'appointment_confirmed' },
        });
      }
      await insertNotification({
        recipientRole: 'admin',
        type: 'system',
        title: 'Appointment approved',
        message: 'A doctor approved an appointment.',
        metadata: { ...meta, event: 'appointment_confirmed' },
      });
    }

    if (status === 'completed') {
      if (actors.patientUserId) {
        await insertNotification({
          recipientUserId: actors.patientUserId,
          type: 'system',
          title: 'Appointment completed',
          message: 'Your appointment has been marked as completed.',
          metadata: { ...meta, event: 'appointment_completed' },
        });
      }
      await insertNotification({
        recipientRole: 'admin',
        type: 'system',
        title: 'Appointment completed',
        message: 'A doctor completed an appointment.',
        metadata: { ...meta, event: 'appointment_completed' },
      });
    }

    if (status === 'cancel_requested') {
      const msg = typeof cancellation_reason === 'string' && cancellation_reason.trim()
        ? `A cancellation was requested. Reason: ${cancellation_reason.trim()}`
        : 'A cancellation was requested.';

      await insertNotification({
        recipientRole: 'admin',
        type: 'system',
        title: 'Cancellation requested',
        message: msg,
        metadata: { ...meta, event: 'appointment_cancel_requested' },
      });

      if (actors.patientUserId) {
        await insertNotification({
          recipientUserId: actors.patientUserId,
          type: 'system',
          title: 'Cancellation requested',
          message: 'The doctor requested to cancel an appointment. Admin review is pending.',
          metadata: { ...meta, event: 'appointment_cancel_requested' },
        });
      }
    }

    if (status === 'cancelled') {
      const metaCancelled = { ...meta, event: 'appointment_cancelled', cancelledBy: user_id ? String(user_id) : null };
      const cancelledMessage = user_id
        ? 'Admin cancelled the appointment.'
        : 'The appointment has been cancelled.';

      if (actors.patientUserId) {
        await insertNotification({
          recipientUserId: actors.patientUserId,
          type: 'system',
          title: 'Appointment cancelled',
          message: cancelledMessage,
          metadata: metaCancelled,
        });
      }

      if (actors.doctorUserId) {
        await insertNotification({
          recipientUserId: actors.doctorUserId,
          type: 'system',
          title: 'Appointment cancelled',
          message: cancelledMessage,
          metadata: metaCancelled,
        });
      }

      await insertNotification({
        recipientRole: 'admin',
        type: 'system',
        title: 'Appointment cancelled',
        message: 'An appointment was cancelled by admin.',
        metadata: metaCancelled,
      });
    }
    
    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment status',
      error: error.message,
    });
  }
});

// Approve or reject a cancellation request (admin)
router.post('/:id/cancellation/decision', async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, user_id, rejection_reason } = req.body;

    if (decision !== 'approve' && decision !== 'reject') {
      return res.status(400).json({
        success: false,
        message: "decision must be 'approve' or 'reject'",
      });
    }

    if (decision === 'approve') {
      const params = [id];
      let q = `
        UPDATE Appointments
        SET status = 'cancelled',
            cancelled_at = NOW(),
            updated_at = NOW()
      `;
      if (user_id) {
        q += `, cancelled_by = $2`;
        params.push(String(user_id));
      }
      q += ` WHERE id = $1 AND status = 'cancel_requested' RETURNING *`;

      const r = await pool.query(q, params);
      if (r.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cancellation request not found (appointment is not in cancel_requested state)',
        });
      }

      // Notifications (best-effort)
      const actors = await getAppointmentActorUserIds(id);
      const meta = { event: 'appointment_cancel_approved', appointmentId: String(id) };
      if (actors.doctorUserId) {
        await insertNotification({
          recipientUserId: actors.doctorUserId,
          type: 'system',
          title: 'Cancellation approved',
          message: 'Admin approved the cancellation request.',
          metadata: meta,
        });
      }
      if (actors.patientUserId) {
        await insertNotification({
          recipientUserId: actors.patientUserId,
          type: 'system',
          title: 'Appointment cancelled',
          message: 'Admin approved the cancellation. Your appointment is cancelled.',
          metadata: meta,
        });
      }

      return res.json({
        success: true,
        message: 'Cancellation approved',
        data: r.rows[0],
      });
    }

    // reject: revert to confirmed if previously approved, else pending
    const rejectParams = [typeof rejection_reason === 'string' && rejection_reason.trim() ? rejection_reason.trim() : null, id];
    const rejectQuery = `
      UPDATE Appointments
      SET status = CASE WHEN approved_at IS NULL THEN 'pending' ELSE 'confirmed' END,
          cancellation_rejected_reason = $1,
          updated_at = NOW()
      WHERE id = $2 AND status = 'cancel_requested'
      RETURNING *
    `;

    const rr = await pool.query(rejectQuery, rejectParams);
    if (rr.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cancellation request not found (appointment is not in cancel_requested state)',
      });
    }

    // Notifications (best-effort)
    const actors = await getAppointmentActorUserIds(id);
    const meta = {
      event: 'appointment_cancel_rejected',
      appointmentId: String(id),
      rejectionReason: typeof rejection_reason === 'string' && rejection_reason.trim() ? rejection_reason.trim() : null,
    };

    if (actors.doctorUserId) {
      await insertNotification({
        recipientUserId: actors.doctorUserId,
        type: 'system',
        title: 'Cancellation rejected',
        message: meta.rejectionReason ? `Admin rejected the cancellation request. Reason: ${meta.rejectionReason}` : 'Admin rejected the cancellation request.',
        metadata: meta,
      });
    }

    if (actors.patientUserId) {
      await insertNotification({
        recipientUserId: actors.patientUserId,
        type: 'system',
        title: 'Cancellation rejected',
        message: 'Admin rejected the cancellation request. The appointment is still scheduled.',
        metadata: meta,
      });
    }

    return res.json({
      success: true,
      message: 'Cancellation rejected',
      data: rr.rows[0],
    });
  } catch (error) {
    console.error('Error deciding cancellation request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decide cancellation request',
      error: error.message,
    });
  }
});

// Update appointment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      appointment_date,
      appointment_time,
      reason,
      notes,
      actual_visit_time,
      completion_notes,
      prescription_needed,
      lab_tests_needed,
    } = req.body;
    
    const updates = [];
    const params = [];
    let paramCount = 1;
    
    if (appointment_date !== undefined) {
      updates.push(`appointment_date = $${paramCount}`);
      params.push(appointment_date);
      paramCount++;
    }
    
    if (appointment_time !== undefined) {
      updates.push(`appointment_time = $${paramCount}`);
      params.push(appointment_time);
      paramCount++;
    }
    
    if (reason !== undefined) {
      updates.push(`reason = $${paramCount}`);
      params.push(reason);
      paramCount++;
    }
    
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount}`);
      params.push(notes);
      paramCount++;
    }
    
    if (actual_visit_time !== undefined) {
      updates.push(`actual_visit_time = $${paramCount}`);
      params.push(actual_visit_time);
      paramCount++;
    }
    
    if (completion_notes !== undefined) {
      updates.push(`completion_notes = $${paramCount}`);
      params.push(completion_notes);
      paramCount++;
    }
    
    if (prescription_needed !== undefined) {
      updates.push(`prescription_needed = $${paramCount}`);
      params.push(prescription_needed);
      paramCount++;
    }
    
    if (lab_tests_needed !== undefined) {
      updates.push(`lab_tests_needed = $${paramCount}`);
      params.push(lab_tests_needed);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }
    
    params.push(id);
    const query = `UPDATE Appointments SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: error.message,
    });
  }
});

// Delete appointment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Capture actors before deletion so we can notify (best-effort)
    let actors = { patientUserId: null, doctorUserId: null };
    let apptInfo = null;
    try {
      actors = await getAppointmentActorUserIds(id);
      const infoRes = await pool.query(
        'SELECT appointment_date, appointment_time FROM Appointments WHERE id = $1',
        [String(id)]
      );
      apptInfo = infoRes.rows[0] || null;
    } catch {
      // ignore
    }
    
    const result = await pool.query(
      'DELETE FROM Appointments WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Notifications (best-effort)
    const when = apptInfo?.appointment_date && apptInfo?.appointment_time
      ? `${apptInfo.appointment_date} ${apptInfo.appointment_time}`
      : 'the scheduled time';
    const metaDeleted = { event: 'appointment_deleted', appointmentId: String(id) };

    if (actors.patientUserId) {
      await insertNotification({
        recipientUserId: actors.patientUserId,
        type: 'system',
        title: 'Appointment removed',
        message: `An appointment was removed for ${when}.`,
        metadata: metaDeleted,
      });
    }

    if (actors.doctorUserId) {
      await insertNotification({
        recipientUserId: actors.doctorUserId,
        type: 'system',
        title: 'Appointment removed',
        message: `An appointment was removed for ${when}.`,
        metadata: metaDeleted,
      });
    }

    await insertNotification({
      recipientRole: 'admin',
      type: 'system',
      title: 'Appointment removed',
      message: `An appointment was removed for ${when}.`,
      metadata: metaDeleted,
    });
    
    res.json({
      success: true,
      message: 'Appointment deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete appointment',
      error: error.message,
    });
  }
});

// Get available doctors
router.get('/doctors/available', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          doc.id,
          doc.user_id,
          u.first_name,
          u.last_name,
          u.email,
          doc.specialization
        FROM doctors doc
        JOIN users u ON u.id = doc.user_id
        WHERE u.role = 'doctor' AND u.is_active = true
        ORDER BY u.first_name, u.last_name`
    );
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching available doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available doctors',
      error: error.message,
    });
  }
});

module.exports = router;
