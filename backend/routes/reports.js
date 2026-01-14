const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

function clampPeriod(period) {
  const p = String(period || '').toLowerCase();
  if (p === 'today' || p === 'week' || p === 'month' || p === 'year') return p;
  return 'month';
}

function toYMD(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function percentChange(current, prev) {
  const c = Number(current) || 0;
  const p = Number(prev) || 0;
  if (p <= 0) {
    if (c <= 0) return { trend: 'stable', value: '0%' };
    return { trend: 'up', value: '+100%' };
  }
  const pct = ((c - p) / p) * 100;
  const rounded = Math.round(pct * 10) / 10;
  if (Math.abs(rounded) < 0.05) return { trend: 'stable', value: '0%' };
  return { trend: rounded > 0 ? 'up' : 'down', value: `${rounded > 0 ? '+' : ''}${rounded}%` };
}

router.get('/analytics', async (req, res) => {
  const period = clampPeriod(req.query.period);

  const end = new Date();
  const endYmd = toYMD(end);

  const rangeDays = period === 'today' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const start = addDays(end, -(rangeDays - 1));
  const startYmd = toYMD(start);

  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(rangeDays - 1));
  const prevStartYmd = toYMD(prevStart);
  const prevEndYmd = toYMD(prevEnd);

  try {
    const [
      totalPatientsRes,
      totalStaffRes,
      totalAppointmentsRes,
      apptStatusRes,
      apptTotalsRes,
      apptTotalsPrevRes,
      newPatientsRes,
      newPatientsPrevRes,
      newStaffRes,
      newStaffPrevRes,
      recentActivityRes,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'patient'"),
      pool.query(
        "SELECT COUNT(*)::int AS count FROM users WHERE role IN ('doctor','pharmacist','lab_technician')"
      ),
      pool.query('SELECT COUNT(*)::int AS count FROM appointments'),
      pool.query(
        `SELECT status, COUNT(*)::int AS count
         FROM appointments
         WHERE appointment_date BETWEEN $1 AND $2
         GROUP BY status`,
        [startYmd, endYmd]
      ),
      pool.query(
        `SELECT
           COUNT(*)::int AS total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::int AS completed,
           SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END)::int AS cancelled
         FROM appointments
         WHERE appointment_date BETWEEN $1 AND $2`,
        [startYmd, endYmd]
      ),
      pool.query(
        `SELECT
           COUNT(*)::int AS total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::int AS completed,
           SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END)::int AS cancelled
         FROM appointments
         WHERE appointment_date BETWEEN $1 AND $2`,
        [prevStartYmd, prevEndYmd]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count
         FROM users
         WHERE role = 'patient' AND created_at::date BETWEEN $1 AND $2`,
        [startYmd, endYmd]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count
         FROM users
         WHERE role = 'patient' AND created_at::date BETWEEN $1 AND $2`,
        [prevStartYmd, prevEndYmd]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count
         FROM users
         WHERE role IN ('doctor','pharmacist','lab_technician') AND created_at::date BETWEEN $1 AND $2`,
        [startYmd, endYmd]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count
         FROM users
         WHERE role IN ('doctor','pharmacist','lab_technician') AND created_at::date BETWEEN $1 AND $2`,
        [prevStartYmd, prevEndYmd]
      ),
      pool.query(
        `SELECT id, type, title, message, created_at
         FROM notifications
         WHERE recipient_role = 'admin'
         ORDER BY created_at DESC
         LIMIT 10`
      ),
    ]);

    const totalPatients = totalPatientsRes.rows?.[0]?.count ?? 0;
    const totalStaff = totalStaffRes.rows?.[0]?.count ?? 0;
    const totalAppointments = totalAppointmentsRes.rows?.[0]?.count ?? 0;

    const apptTotals = apptTotalsRes.rows?.[0] || { total: 0, completed: 0, cancelled: 0 };
    const apptTotalsPrev = apptTotalsPrevRes.rows?.[0] || { total: 0, completed: 0, cancelled: 0 };

    const apptTotalInPeriod = Number(apptTotals.total) || 0;
    const completedInPeriod = Number(apptTotals.completed) || 0;
    const cancelledInPeriod = Number(apptTotals.cancelled) || 0;

    const completionRate = apptTotalInPeriod > 0 ? (completedInPeriod / apptTotalInPeriod) * 100 : 0;
    const cancelRate = apptTotalInPeriod > 0 ? (cancelledInPeriod / apptTotalInPeriod) * 100 : 0;

    const completionRatePrev = (Number(apptTotalsPrev.total) || 0) > 0
      ? ((Number(apptTotalsPrev.completed) || 0) / (Number(apptTotalsPrev.total) || 1)) * 100
      : 0;

    const statusCounts = (apptStatusRes.rows || []).reduce((acc, row) => {
      acc[String(row.status || 'unknown')] = Number(row.count) || 0;
      return acc;
    }, {});

    // Trend buckets for chart
    let trendSql;
    let trendParams;
    if (period === 'year') {
      trendSql = `
        SELECT to_char(date_trunc('month', appointment_date::timestamp), 'Mon') AS label,
               COUNT(*)::int AS count
        FROM appointments
        WHERE appointment_date BETWEEN $1 AND $2
        GROUP BY date_trunc('month', appointment_date::timestamp)
        ORDER BY date_trunc('month', appointment_date::timestamp)
      `;
      trendParams = [startYmd, endYmd];
    } else {
      trendSql = `
        SELECT to_char(appointment_date::date, 'Mon DD') AS label,
               COUNT(*)::int AS count
        FROM appointments
        WHERE appointment_date BETWEEN $1 AND $2
        GROUP BY appointment_date::date
        ORDER BY appointment_date::date
      `;
      trendParams = [startYmd, endYmd];
    }

    const trendRes = await pool.query(trendSql, trendParams);
    const trendLabels = (trendRes.rows || []).map((r) => String(r.label));
    const trendCounts = (trendRes.rows || []).map((r) => Number(r.count) || 0);

    const apptTrend = percentChange(apptTotalInPeriod, apptTotalsPrev.total);
    const newPatients = newPatientsRes.rows?.[0]?.count ?? 0;
    const newPatientsPrev = newPatientsPrevRes.rows?.[0]?.count ?? 0;
    const patientTrend = percentChange(newPatients, newPatientsPrev);

    const newStaff = newStaffRes.rows?.[0]?.count ?? 0;
    const newStaffPrev = newStaffPrevRes.rows?.[0]?.count ?? 0;
    const staffTrend = percentChange(newStaff, newStaffPrev);

    const completionTrend = percentChange(completionRate, completionRatePrev);

    return res.json({
      success: true,
      data: {
        period,
        range: { start: startYmd, end: endYmd },
        kpis: {
          totalPatients,
          totalStaff,
          totalAppointments,
          completionRate,
          cancelRate,
          inPeriod: {
            appointments: apptTotalInPeriod,
            completed: completedInPeriod,
            cancelled: cancelledInPeriod,
            newPatients,
            newStaff,
          },
        },
        trends: {
          appointments: { labels: trendLabels, data: trendCounts },
        },
        distributions: {
          appointmentStatus: statusCounts,
        },
        cards: {
          patients: { trend: patientTrend.trend, trendValue: patientTrend.value },
          staff: { trend: staffTrend.trend, trendValue: staffTrend.value },
          appointments: { trend: apptTrend.trend, trendValue: apptTrend.value },
          completionRate: { trend: completionTrend.trend, trendValue: completionTrend.value },
        },
        recentActivity: (recentActivityRes.rows || []).map((n) => ({
          id: String(n.id),
          type: String(n.type || 'system'),
          title: String(n.title || 'Notification'),
          message: String(n.message || ''),
          created_at: n.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching reports analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reports analytics',
      error: error.message,
    });
  }
});

// System status for admin dashboard
// Provides DB connectivity + lightweight operational metrics
router.get('/system-status', async (_req, res) => {
  const startedAt = Date.now();
  try {
    await pool.query('SELECT 1');
    const dbLatencyMs = Date.now() - startedAt;

    const [activeUsersRes, pendingApprovalsRes, pendingCancelRes] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM users WHERE is_active = true'),
      pool.query(
        "SELECT COUNT(*)::int AS count FROM appointments WHERE status IN ('pending','cancel_requested')"
      ),
      pool.query("SELECT COUNT(*)::int AS count FROM appointments WHERE status = 'cancel_requested'"),
    ]);

    const activeSessions = activeUsersRes.rows?.[0]?.count ?? 0;
    const pendingApprovals = pendingApprovalsRes.rows?.[0]?.count ?? 0;
    const pendingCancellationApprovals = pendingCancelRes.rows?.[0]?.count ?? 0;

    return res.json({
      success: true,
      data: {
        db: { connected: true, latencyMs: dbLatencyMs },
        activeSessions,
        pendingApprovals,
        breakdown: {
          pendingCancellationApprovals,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch system status',
      error: error.message,
    });
  }
});

module.exports = router;
