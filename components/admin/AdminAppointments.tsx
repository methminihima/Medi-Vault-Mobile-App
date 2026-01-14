import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    RefreshControl,
    Text as RNText,
    ScrollView,
    Share,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { API_BASE_URL } from '../../src/config/constants';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'cancel_requested';

interface AppointmentRow {
  id: string;
  appointment_date: string;
  appointment_time: string;
  reason?: string;
  notes?: string | null;
  status: string;
  cancellation_reason?: string | null;
  cancellation_requested_by?: string | null;
  cancellation_requested_at?: string | null;
  cancellation_rejected_reason?: string | null;
  patient_first_name?: string | null;
  patient_last_name?: string | null;
  doctor_first_name?: string | null;
  doctor_last_name?: string | null;
  doctor_specialization?: string | null;
}

function safeText(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function toYMD(dateLike: string): string {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return safeText(dateLike).slice(0, 10);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDisplayDate(dateLike: string): string {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return safeText(dateLike);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function normalizeStatus(s: string): StatusFilter | 'other' {
  const v = safeText(s).trim().toLowerCase();
  if (v === 'pending' || v === 'confirmed' || v === 'completed' || v === 'cancelled' || v === 'cancel_requested') return v;
  return 'other';
}

function statusLabel(s: StatusFilter): string {
  if (s === 'all') return 'All Status';
  if (s === 'cancel_requested') return 'Cancel Requested';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function AdminAppointments() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRow | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectAppointmentId, setRejectAppointmentId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        headers: { Accept: 'application/json' },
      });

      const rawText = await res.text();
      const json = (() => {
        try {
          return rawText ? JSON.parse(rawText) : null;
        } catch {
          return null;
        }
      })();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || `Failed to fetch appointments (${res.status})`);
      }

      const rows = Array.isArray(json.data) ? (json.data as AppointmentRow[]) : [];
      setAppointments(rows);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments();
  }, [fetchAppointments]);

  const filteredAppointments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const dateYmd = dateFilter.trim();

    return appointments.filter((a) => {
      const st = normalizeStatus(a.status);
      if (statusFilter !== 'all' && st !== statusFilter) return false;

      if (dateYmd) {
        const aDate = toYMD(a.appointment_date);
        if (aDate !== dateYmd) return false;
      }

      if (!q) return true;
      const patientName = `${safeText(a.patient_first_name)} ${safeText(a.patient_last_name)}`.trim().toLowerCase();
      const doctorName = `${safeText(a.doctor_first_name)} ${safeText(a.doctor_last_name)}`.trim().toLowerCase();
      const spec = safeText(a.doctor_specialization).toLowerCase();
      const reason = safeText(a.reason).toLowerCase();
      const cancelReason = safeText(a.cancellation_reason).toLowerCase();
      const date = safeText(a.appointment_date).toLowerCase();
      const time = safeText(a.appointment_time).toLowerCase();

      return (
        patientName.includes(q) ||
        doctorName.includes(q) ||
        spec.includes(q) ||
        reason.includes(q) ||
        cancelReason.includes(q) ||
        date.includes(q) ||
        time.includes(q)
      );
    });
  }, [appointments, dateFilter, searchQuery, statusFilter]);

  const summary = useMemo(() => {
    const counts = {
      total: appointments.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      cancel_requested: 0,
    };
    for (const a of appointments) {
      const st = normalizeStatus(a.status);
      if (st === 'pending') counts.pending += 1;
      if (st === 'confirmed') counts.confirmed += 1;
      if (st === 'completed') counts.completed += 1;
      if (st === 'cancelled') counts.cancelled += 1;
      if (st === 'cancel_requested') counts.cancel_requested += 1;
    }
    return counts;
  }, [appointments]);

  const decideCancellation = useCallback(
    async (appointmentId: string, decision: 'approve' | 'reject', opts?: { rejectionReason?: string }) => {
      try {
        const body: any = { decision };
        if (decision === 'reject' && opts?.rejectionReason) {
          body.rejection_reason = opts.rejectionReason;
        }
        const res = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/cancellation/decision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(body),
        });

        const rawText = await res.text();
        const json = (() => {
          try {
            return rawText ? JSON.parse(rawText) : null;
          } catch {
            return null;
          }
        })();

        if (!res.ok || !json?.success) {
          throw new Error(json?.message || `Failed to ${decision} cancellation (${res.status})`);
        }

        const nextStatus = safeText(json?.data?.status) || (decision === 'approve' ? 'cancelled' : 'confirmed');
        const nextCancellationRejectedReason = json?.data?.cancellation_rejected_reason;

        setAppointments((prev) =>
          prev.map((a) =>
            a.id === appointmentId
              ? {
                  ...a,
                  status: nextStatus,
                  cancellation_rejected_reason:
                    typeof nextCancellationRejectedReason === 'string' ? nextCancellationRejectedReason : a.cancellation_rejected_reason,
                }
              : a
          )
        );

        setSelectedAppointment((prev) =>
          prev && prev.id === appointmentId
            ? {
                ...prev,
                status: nextStatus,
                cancellation_rejected_reason:
                  typeof nextCancellationRejectedReason === 'string' ? nextCancellationRejectedReason : prev.cancellation_rejected_reason,
              }
            : prev
        );
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to update cancellation request');
      }
    },
    []
  );

  const setStatus = useCallback(
    async (appointmentId: string, nextStatus: StatusFilter) => {
      try {
        const res = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        });

        const rawText = await res.text();
        const json = (() => {
          try {
            return rawText ? JSON.parse(rawText) : null;
          } catch {
            return null;
          }
        })();

        if (!res.ok || !json?.success) {
          throw new Error(json?.message || `Failed to update status (${res.status})`);
        }

        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? { ...a, status: nextStatus } : a))
        );
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to update appointment status');
      }
    },
    []
  );

  const rescheduleAppointment = useCallback(async (appointmentId: string, nextDate: string, nextTime: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ appointment_date: nextDate, appointment_time: nextTime }),
      });

      const rawText = await res.text();
      const json = (() => {
        try {
          return rawText ? JSON.parse(rawText) : null;
        } catch {
          return null;
        }
      })();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || `Failed to reschedule (${res.status})`);
      }

      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, appointment_date: nextDate, appointment_time: nextTime } : a))
      );
      setSelectedAppointment((prev) =>
        prev && prev.id === appointmentId ? { ...prev, appointment_date: nextDate, appointment_time: nextTime } : prev
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to reschedule appointment');
    }
  }, []);

  const exportCsv = useCallback(async () => {
    const header = ['Date', 'Time', 'Patient', 'Doctor', 'Specialization', 'Status', 'Reason'];
    const rows = filteredAppointments.map((a) => {
      const patient = `${safeText(a.patient_first_name)} ${safeText(a.patient_last_name)}`.trim();
      const doctor = `${safeText(a.doctor_first_name)} ${safeText(a.doctor_last_name)}`.trim();
      const spec = safeText(a.doctor_specialization) || 'General';
      const st = safeText(a.status);
      const reason =
        normalizeStatus(st) === 'cancel_requested' ? safeText(a.cancellation_reason) : safeText(a.reason);
      return [formatDisplayDate(a.appointment_date), safeText(a.appointment_time), patient, doctor, spec, st, reason];
    });

    const csv = [header, ...rows]
      .map((line) => line.map((cell) => `"${safeText(cell).replace(/\"/g, '""')}"`).join(','))
      .join('\n');

    try {
      await Share.share({
        title: 'Appointments CSV',
        message: csv,
      });
    } catch {
      // ignore
    }
  }, [filteredAppointments]);

  const openActions = useCallback((a: AppointmentRow) => {
    setSelectedAppointment(a);
    setRescheduleDate(toYMD(a.appointment_date));
    setRescheduleTime(safeText(a.appointment_time));
    setShowActionsModal(true);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E4BA3" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Title */}
      <View style={styles.titleBlock}>
        <RNText style={styles.pageTitle}>Appointment Management</RNText>
        <RNText style={styles.pageSubtitle}>Manage all appointments, schedules, and bookings</RNText>
      </View>

      {/* Summary cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <RNText style={styles.statLabel}>Total Appointments</RNText>
          <RNText style={styles.statValue}>{summary.total}</RNText>
        </View>
        <View style={styles.statCard}>
          <RNText style={styles.statLabel}>Cancel Requests</RNText>
          <RNText style={[styles.statValue, { color: '#F59E0B' }]}>{summary.cancel_requested}</RNText>
        </View>
        <View style={styles.statCard}>
          <RNText style={styles.statLabel}>Pending</RNText>
          <RNText style={[styles.statValue, { color: '#F59E0B' }]}>{summary.pending}</RNText>
        </View>
        <View style={styles.statCard}>
          <RNText style={styles.statLabel}>Confirmed</RNText>
          <RNText style={[styles.statValue, { color: '#10B981' }]}>{summary.confirmed}</RNText>
        </View>
        <View style={styles.statCard}>
          <RNText style={styles.statLabel}>Completed</RNText>
          <RNText style={[styles.statValue, { color: '#3B82F6' }]}>{summary.completed}</RNText>
        </View>
        <View style={styles.statCard}>
          <RNText style={styles.statLabel}>Cancelled</RNText>
          <RNText style={[styles.statValue, { color: '#EF4444' }]}>{summary.cancelled}</RNText>
        </View>
      </View>

      {/* List header */}
      <View style={styles.listHeader}>
        <View>
          <RNText style={styles.listTitle}>All Appointments</RNText>
          <RNText style={styles.listSubtitle}>View and manage patient appointments with doctors</RNText>
        </View>
        <TouchableOpacity style={styles.exportButton} onPress={exportCsv}>
          <Ionicons name="download-outline" size={18} color="#111827" />
          <RNText style={styles.exportText}>Export CSV</RNText>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by patient, doctor, specialty, or reason..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.filterPill} onPress={() => setShowStatusModal(true)}>
          <RNText style={styles.filterPillText}>
            {statusLabel(statusFilter)}
          </RNText>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterPill} onPress={() => setShowDateModal(true)}>
          <Ionicons name="calendar-outline" size={16} color="#111827" />
          <RNText style={styles.filterPillText}>{dateFilter ? dateFilter : 'Filter by Date'}</RNText>
        </TouchableOpacity>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <RNText style={[styles.th, styles.colDate]}>Date & Time</RNText>
            <RNText style={[styles.th, styles.colPatient]}>Patient</RNText>
            <RNText style={[styles.th, styles.colDoctor]}>Doctor</RNText>
            <RNText style={[styles.th, styles.colSpec]}>Specialization</RNText>
            <RNText style={[styles.th, styles.colStatus]}>Status</RNText>
            <RNText style={[styles.th, styles.colReason]}>Reason</RNText>
            <RNText style={[styles.th, styles.colActions]}>Actions</RNText>
          </View>

          {filteredAppointments.map((a) => {
            const patient = `${safeText(a.patient_first_name)} ${safeText(a.patient_last_name)}`.trim() || '—';
            const doctor = `${safeText(a.doctor_first_name)} ${safeText(a.doctor_last_name)}`.trim() || '—';
            const spec = safeText(a.doctor_specialization) || 'General';
            const st = safeText(a.status);
            const statusNorm = normalizeStatus(st);
            const statusBg =
              statusNorm === 'confirmed'
                ? '#D1FAE5'
                : statusNorm === 'pending' || statusNorm === 'cancel_requested'
                ? '#FEF3C7'
                : statusNorm === 'completed'
                ? '#DBEAFE'
                : statusNorm === 'cancelled'
                ? '#FEE2E2'
                : '#E5E7EB';
            const statusFg =
              statusNorm === 'confirmed'
                ? '#10B981'
                : statusNorm === 'pending' || statusNorm === 'cancel_requested'
                ? '#F59E0B'
                : statusNorm === 'completed'
                ? '#3B82F6'
                : statusNorm === 'cancelled'
                ? '#EF4444'
                : '#6B7280';

            const displayReason =
              statusNorm === 'cancel_requested' ? safeText(a.cancellation_reason) || '—' : safeText(a.reason) || '—';

            return (
              <View key={a.id} style={styles.tableRow}>
                <View style={[styles.td, styles.colDate]}>
                  <RNText style={styles.cellMain}>{formatDisplayDate(a.appointment_date)}</RNText>
                  <RNText style={styles.cellSub}>{safeText(a.appointment_time)}</RNText>
                </View>
                <View style={[styles.td, styles.colPatient]}>
                  <RNText style={styles.cellMain}>{patient}</RNText>
                </View>
                <View style={[styles.td, styles.colDoctor]}>
                  <RNText style={styles.cellMain}>{doctor}</RNText>
                </View>
                <View style={[styles.td, styles.colSpec]}>
                  <View style={styles.pill}>
                    <RNText style={styles.pillText}>{spec}</RNText>
                  </View>
                </View>
                <View style={[styles.td, styles.colStatus]}>
                  <View style={[styles.statusPill, { backgroundColor: statusBg }]}
                  >
                    <RNText style={[styles.statusPillText, { color: statusFg }]}>
                      {statusNorm === 'cancel_requested'
                        ? 'Cancel Requested'
                        : st
                        ? st.charAt(0).toUpperCase() + st.slice(1)
                        : '—'}
                    </RNText>
                  </View>
                </View>
                <View style={[styles.td, styles.colReason]}>
                  <RNText style={styles.cellMain} numberOfLines={1}>
                    {displayReason}
                  </RNText>
                </View>
                <View style={[styles.td, styles.colActions]}>
                  <TouchableOpacity style={styles.actionIcon} onPress={() => openActions(a)}>
                    <MaterialCommunityIcons name="dots-vertical" size={18} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Status filter modal */}
      <Modal visible={showStatusModal} transparent animationType="fade" onRequestClose={() => setShowStatusModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <RNText style={styles.modalTitle}>Filter Status</RNText>
            {(['all', 'cancel_requested', 'pending', 'confirmed', 'completed', 'cancelled'] as StatusFilter[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.modalItem}
                onPress={() => {
                  setStatusFilter(s);
                  setShowStatusModal(false);
                }}
              >
                <RNText style={styles.modalItemText}>
                  {statusLabel(s)}
                </RNText>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowStatusModal(false)}>
              <RNText style={styles.modalCloseText}>Close</RNText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date filter modal */}
      <Modal visible={showDateModal} transparent animationType="fade" onRequestClose={() => setShowDateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <RNText style={styles.modalTitle}>Filter Date</RNText>
            <RNText style={styles.modalHint}>Use format: YYYY-MM-DD</RNText>
            <TextInput
              style={styles.dateInput}
              placeholder="2026-01-04"
              placeholderTextColor="#9CA3AF"
              value={dateFilter}
              onChangeText={setDateFilter}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setDateFilter('');
                  setShowDateModal(false);
                }}
              >
                <RNText style={styles.modalButtonTextSecondary}>Clear</RNText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => setShowDateModal(false)}
              >
                <RNText style={styles.modalButtonTextPrimary}>Apply</RNText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Actions modal */}
      <Modal visible={showActionsModal} transparent animationType="fade" onRequestClose={() => setShowActionsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.actionsCard}>
            <View style={styles.actionsHeader}>
              <RNText style={styles.modalTitle}>Appointment Actions</RNText>
              <TouchableOpacity onPress={() => setShowActionsModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedAppointment && (
              <View style={styles.actionsBody}>
                <RNText style={styles.actionsMeta}>
                  {formatDisplayDate(selectedAppointment.appointment_date)} • {safeText(selectedAppointment.appointment_time)}
                </RNText>
                <RNText style={styles.actionsMeta}>
                  {`${safeText(selectedAppointment.patient_first_name)} ${safeText(selectedAppointment.patient_last_name)}`.trim() || '—'}
                  {'  '}→{'  '}
                  {`${safeText(selectedAppointment.doctor_first_name)} ${safeText(selectedAppointment.doctor_last_name)}`.trim() || '—'}
                </RNText>
              </View>
            )}

            {selectedAppointment && normalizeStatus(selectedAppointment.status) === 'cancel_requested' && (
              <>
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    const id = selectedAppointment.id;
                    setShowActionsModal(false);
                    Alert.alert('Approve Cancellation', 'Approve this cancellation request?', [
                      { text: 'No', style: 'cancel' },
                      {
                        text: 'Yes, approve',
                        style: 'destructive',
                        onPress: () => void decideCancellation(id, 'approve'),
                      },
                    ]);
                  }}
                >
                  <RNText style={[styles.actionRowText, { color: '#EF4444' }]}>Approve Cancellation</RNText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    const id = selectedAppointment.id;
                    setShowActionsModal(false);
                    setRejectAppointmentId(id);
                    setRejectReason('');
                    setShowRejectModal(true);
                  }}
                >
                  <RNText style={styles.actionRowText}>Reject Cancellation</RNText>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                if (!selectedAppointment) return;
                setShowActionsModal(false);
                setShowRescheduleModal(true);
              }}
            >
              <RNText style={styles.actionRowText}>Reschedule</RNText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                if (!selectedAppointment) return;
                const id = selectedAppointment.id;
                setShowActionsModal(false);
                Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
                  { text: 'No', style: 'cancel' },
                  {
                    text: 'Yes, cancel',
                    style: 'destructive',
                    onPress: () => void setStatus(id, 'cancelled'),
                  },
                ]);
              }}
              disabled={normalizeStatus(selectedAppointment?.status ?? '') === 'cancel_requested'}
            >
              <RNText
                style={[
                  styles.actionRowText,
                  { color: normalizeStatus(selectedAppointment?.status ?? '') === 'cancel_requested' ? '#9CA3AF' : '#EF4444' },
                ]}
              >
                Cancel Appointment
              </RNText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reschedule modal */}
      <Modal
        visible={showRescheduleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <RNText style={styles.modalTitle}>Reschedule Appointment</RNText>
            <RNText style={styles.modalHint}>Enter new date and time</RNText>

            <TextInput
              style={styles.dateInput}
              value={rescheduleDate}
              onChangeText={setRescheduleDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.dateInput}
              value={rescheduleTime}
              onChangeText={setRescheduleTime}
              placeholder="HH:MM"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
            />

            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowRescheduleModal(false)}
              >
                <RNText style={styles.modalButtonTextSecondary}>Close</RNText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  if (!selectedAppointment) return;
                  const nextDate = rescheduleDate.trim();
                  const nextTime = rescheduleTime.trim();
                  if (!nextDate || !nextTime) {
                    Alert.alert('Required', 'Please enter both date and time.');
                    return;
                  }
                  setShowRescheduleModal(false);
                  void rescheduleAppointment(selectedAppointment.id, nextDate, nextTime);
                }}
              >
                <RNText style={styles.modalButtonTextPrimary}>Save</RNText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject cancellation modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowRejectModal(false);
          setRejectReason('');
          setRejectAppointmentId(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <RNText style={styles.modalTitle}>Reject Cancellation</RNText>
            <RNText style={styles.modalHint}>Please provide a reason (required)</RNText>

            <TextInput
              style={styles.dateInput}
              placeholder="Reason for rejecting cancellation"
              placeholderTextColor="#9CA3AF"
              value={rejectReason}
              onChangeText={setRejectReason}
              autoCapitalize="sentences"
            />

            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setRejectAppointmentId(null);
                }}
              >
                <RNText style={styles.modalButtonTextSecondary}>Cancel</RNText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  const id = rejectAppointmentId;
                  const reason = rejectReason.trim();
                  if (!id) return;
                  if (!reason) {
                    Alert.alert('Required', 'Please enter a rejection reason.');
                    return;
                  }
                  setShowRejectModal(false);
                  setRejectReason('');
                  setRejectAppointmentId(null);
                  void decideCancellation(id, 'reject', { rejectionReason: reason });
                }}
              >
                <RNText style={styles.modalButtonTextPrimary}>Reject</RNText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  titleBlock: {
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  pageSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: isSmallScreen ? '100%' : '48%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  statValue: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  listHeader: {
    marginTop: 6,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  listSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  exportText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexGrow: 1,
    minWidth: 220,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    paddingVertical: 0,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  table: {
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 860,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  th: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  td: {
    justifyContent: 'center',
  },
  cellMain: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  cellSub: {
    marginTop: 2,
    fontSize: 11,
    color: '#6B7280',
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  colDate: { width: 140 },
  colPatient: { width: 150 },
  colDoctor: { width: 150 },
  colSpec: { width: 150 },
  colStatus: { width: 120 },
  colReason: { width: 160 },
  colActions: { width: 70, alignItems: 'flex-end' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  actionsCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  actionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionsBody: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  actionsMeta: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  actionRow: {
    paddingVertical: 12,
  },
  actionRowText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  modalClose: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
  },
  modalHint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
    fontWeight: '600',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#1E4BA3',
  },
  modalButtonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonTextPrimary: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  modalButtonTextSecondary: {
    color: '#374151',
    fontWeight: '800',
    fontSize: 13,
  },
});

