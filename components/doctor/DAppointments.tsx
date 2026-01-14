import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Text as RNText,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;

interface Appointment {
  id: string;
  patientName: string;
  patientNIC?: string;
  patientDbId?: string;
  time: string;
  type: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'cancel_requested';
  cancellationReason?: string;
  cancellationRejectedReason?: string;
  appointment_date?: string;
  created_at?: string;
}

type AppointmentContext = {
  appointmentId: string;
  patientDbId?: string;
  patientName?: string;
  patientNIC?: string;
};

interface DAppointmentsProps {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  showAppointmentModal: boolean;
  setShowAppointmentModal: (show: boolean) => void;
  handleViewAppointment: (appointment: Appointment) => void;
  onApprove: (appointmentId: string) => void;
  onMarkComplete: (appointmentId: string, meta?: { actualVisitTime?: string; visitNotes?: string }) => void;
  onRequestCancel: (appointmentId: string, reason: string) => void;
  completionArtifactsByAppointmentId?: Record<string, { prescriptionId?: string; labTestIds?: string[] }>;
  onOpenCreatePrescription?: (ctx: AppointmentContext) => void;
  onOpenOrderLabTests?: (ctx: AppointmentContext) => void;
  onOpenCreateMedicalRecord?: (ctx: AppointmentContext) => void;
  autoOpenCompleteAppointmentId?: string | null;
  onAutoOpenCompleteHandled?: () => void;
}

export default function DAppointments({
  appointments,
  selectedAppointment,
  showAppointmentModal,
  setShowAppointmentModal,
  handleViewAppointment,
  onApprove,
  onMarkComplete,
  onRequestCancel,
  completionArtifactsByAppointmentId,
  onOpenCreatePrescription,
  onOpenOrderLabTests,
  onOpenCreateMedicalRecord,
  autoOpenCompleteAppointmentId,
  onAutoOpenCompleteHandled,
}: DAppointmentsProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedCancelAppointment, setSelectedCancelAppointment] = useState<Appointment | null>(null);

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedCompleteAppointment, setSelectedCompleteAppointment] = useState<Appointment | null>(null);
  const [actualVisitTime, setActualVisitTime] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [createPrescription, setCreatePrescription] = useState(false);
  const [labTestsRequired, setLabTestsRequired] = useState(false);

  const lastAutoOpenedIdRef = useRef<string | null>(null);

  const formatNow12 = () => {
    const d = new Date();
    const hh = d.getHours();
    const mm = d.getMinutes();
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12 = ((hh + 11) % 12) + 1;
    return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
  };

  const handleRequestCancel = (appointment: Appointment) => {
    setSelectedCancelAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleMarkComplete = (appointment: Appointment) => {
    // If returning from another screen for the same appointment, preserve entered values.
    if (selectedCompleteAppointment?.id === appointment.id) {
      setShowCompleteModal(true);
      return;
    }
    setSelectedCompleteAppointment(appointment);
    setActualVisitTime(formatNow12());
    setVisitNotes('');
    setCreatePrescription(false);
    setLabTestsRequired(false);
    setShowCompleteModal(true);
  };

  useEffect(() => {
    if (!autoOpenCompleteAppointmentId) return;
    if (lastAutoOpenedIdRef.current === autoOpenCompleteAppointmentId) return;
    const appt = appointments.find((a) => a.id === autoOpenCompleteAppointmentId);
    if (!appt) return;
    lastAutoOpenedIdRef.current = autoOpenCompleteAppointmentId;
    handleMarkComplete(appt);
    onAutoOpenCompleteHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenCompleteAppointmentId, appointments]);

  const submitComplete = () => {
    if (!selectedCompleteAppointment) return;
    if (!actualVisitTime.trim()) {
      Alert.alert('Required', 'Please provide the actual visit time');
      return;
    }

    const artifacts = completionArtifactsByAppointmentId?.[selectedCompleteAppointment.id];
    if (createPrescription && !artifacts?.prescriptionId) {
      Alert.alert('Required', 'Please save the prescription before completing this appointment');
      return;
    }
    if (labTestsRequired && !(artifacts?.labTestIds && artifacts.labTestIds.length > 0)) {
      Alert.alert('Required', 'Please save the lab test request before completing this appointment');
      return;
    }

    onMarkComplete(selectedCompleteAppointment.id, {
      actualVisitTime: actualVisitTime.trim(),
      visitNotes: visitNotes.trim(),
    });
    setShowCompleteModal(false);
    setSelectedCompleteAppointment(null);
    setActualVisitTime('');
    setVisitNotes('');
    setCreatePrescription(false);
    setLabTestsRequired(false);
  };

  const submitCancelRequest = () => {
    if (!cancelReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for cancellation');
      return;
    }

    if (selectedCancelAppointment) {
      onRequestCancel(selectedCancelAppointment.id, cancelReason.trim());
    }
    setShowCancelModal(false);
    setCancelReason('');
    setSelectedCancelAppointment(null);
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const key = a.appointment_date ? String(a.appointment_date).slice(0, 10) : 'Appointments';
      const list = map.get(key) || [];
      list.push(a);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [appointments]);

  const formatDate = (dateLike?: string) => {
    if (!dateLike) return '';
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return String(dateLike).slice(0, 10);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const statusPill = (status: Appointment['status']) => {
    if (status === 'pending') return { bg: '#FEF3C7', fg: '#92400E', text: 'Pending' };
    if (status === 'confirmed') return { bg: '#D1FAE5', fg: '#065F46', text: 'Confirmed' };
    if (status === 'completed') return { bg: '#DBEAFE', fg: '#1E40AF', text: 'Completed' };
    if (status === 'cancel_requested') return { bg: '#FEF3C7', fg: '#92400E', text: 'Cancel Requested' };
    if (status === 'cancelled') return { bg: '#FEE2E2', fg: '#991B1B', text: 'Cancelled' };
    return { bg: '#E5E7EB', fg: '#374151', text: status };
  };

  return (
    <>
      <View style={styles.section}>
        <RNText style={styles.sectionTitle}>All Appointments</RNText>

        {grouped.map(([dateKey, list]) => (
          <View key={dateKey} style={styles.dateGroup}>
            <RNText style={styles.dateHeader}>{dateKey === 'Appointments' ? 'Appointments' : formatDate(dateKey)}</RNText>
            {list.map((appointment) => {
              const pill = statusPill(appointment.status);
              const showButtonsPending = appointment.status === 'pending';
              const showButtonsConfirmed = appointment.status === 'confirmed';
              const showButtons = showButtonsPending || showButtonsConfirmed;
              const canRequestCancel = showButtons && !appointment.cancellationRejectedReason;

              return (
                <TouchableOpacity
                  key={appointment.id}
                  style={styles.appointmentCard}
                  onPress={() => handleViewAppointment(appointment)}
                  activeOpacity={0.9}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <RNText style={styles.appointmentPatient}>{appointment.patientName}</RNText>
                      <RNText style={styles.metaText}>
                        {appointment.appointment_date ? formatDate(appointment.appointment_date) : ''}
                        {appointment.time ? `  •  ${appointment.time}` : ''}
                      </RNText>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: pill.bg }]}>
                      <RNText style={[styles.statusText, { color: pill.fg }]}>{pill.text}</RNText>
                    </View>
                  </View>

                  <View style={styles.cardBodyRow}>
                    <Ionicons name="person" size={16} color="#9CA3AF" />
                    <RNText style={styles.bodyText}>Patient</RNText>
                  </View>
                  <View style={styles.cardBodyRow}>
                    <Ionicons name="calendar" size={16} color="#9CA3AF" />
                    <RNText style={styles.bodyText}>{appointment.type}</RNText>
                  </View>

                  {appointment.status === 'cancel_requested' && (
                    <RNText style={styles.cancelRequestedText}>⏳ Cancellation pending approval</RNText>
                  )}

                  {!!appointment.cancellationRejectedReason && appointment.status !== 'cancel_requested' && (
                    <RNText style={styles.cancelRejectedText} numberOfLines={2}>
                      Cancellation rejected: {appointment.cancellationRejectedReason}
                    </RNText>
                  )}

                  {showButtons && (
                    <View style={styles.buttonRow}>
                      {showButtonsPending && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.approveButton]}
                          onPress={() => onApprove(appointment.id)}
                        >
                          <RNText style={styles.actionButtonTextWhite}>Approve</RNText>
                        </TouchableOpacity>
                      )}
                      {showButtonsConfirmed && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.completeButton]}
                          onPress={() => handleMarkComplete(appointment)}
                        >
                          <RNText style={styles.actionButtonTextWhite}>Mark Complete</RNText>
                        </TouchableOpacity>
                      )}

                      {canRequestCancel && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.requestCancelButton]}
                          onPress={() => handleRequestCancel(appointment)}
                        >
                          <RNText style={styles.actionButtonTextDanger}>Request Cancel</RNText>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Appointment Details Modal */}
      <Modal visible={showAppointmentModal} animationType="slide" transparent onRequestClose={() => setShowAppointmentModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <View style={modalStyles.header}>
              <RNText style={modalStyles.title}>Appointment Details</RNText>
              <TouchableOpacity onPress={() => setShowAppointmentModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={modalStyles.scrollView} showsVerticalScrollIndicator={false}>
              {selectedAppointment && (
                <View style={modalStyles.body}>
                {[
                  ['Patient:', selectedAppointment.patientName],
                  ['NIC:', selectedAppointment.patientNIC],
                  ['Time:', selectedAppointment.time],
                  ['Type:', selectedAppointment.type]
                ].map(([label, value], i) => (
                  <View key={i} style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>{label}</RNText>
                    <RNText style={modalStyles.detailValue}>{value}</RNText>
                  </View>
                ))}
                
                <View style={modalStyles.detailRow}>
                  <RNText style={modalStyles.detailLabel}>Status:</RNText>
                  <View style={[modalStyles.statusBadge, { backgroundColor: selectedAppointment.status === 'confirmed' ? 'rgba(30, 75, 163, 0.15)' : '#F59E0B20' }]}>
                    <RNText style={[modalStyles.statusText, { color: selectedAppointment.status === 'confirmed' ? '#1E4BA3' : '#F59E0B' }]}>
                      {selectedAppointment.status.toUpperCase()}
                    </RNText>
                  </View>
                </View>

                <View style={modalStyles.modalActions}>
                  {selectedAppointment.status === 'pending' && (
                    <TouchableOpacity
                      style={modalStyles.primaryButton}
                      onPress={() => {
                        setShowAppointmentModal(false);
                        onApprove(selectedAppointment.id);
                      }}
                    >
                      <RNText style={modalStyles.primaryButtonText}>Approve</RNText>
                    </TouchableOpacity>
                  )}

                  {selectedAppointment.status === 'confirmed' && (
                    <TouchableOpacity
                      style={modalStyles.primaryButton}
                      onPress={() => {
                        setShowAppointmentModal(false);
                        handleMarkComplete(selectedAppointment);
                      }}
                    >
                      <RNText style={modalStyles.primaryButtonText}>Mark Complete</RNText>
                    </TouchableOpacity>
                  )}

                  {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'confirmed') &&
                    !selectedAppointment.cancellationRejectedReason && (
                    <TouchableOpacity
                      style={modalStyles.cancelButton}
                      onPress={() => {
                        setShowAppointmentModal(false);
                        handleRequestCancel(selectedAppointment);
                      }}
                    >
                      <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                      <RNText style={modalStyles.cancelButtonText}>Request Cancel</RNText>
                    </TouchableOpacity>
                  )}

                  {selectedAppointment.status === 'cancel_requested' && (
                    <View style={modalStyles.pendingNotice}>
                      <Ionicons name="time-outline" size={20} color="#F59E0B" />
                      <RNText style={modalStyles.pendingText}>
                        Cancellation request pending admin approval
                      </RNText>
                    </View>
                  )}

                  {!!selectedAppointment.cancellationRejectedReason && selectedAppointment.status !== 'cancel_requested' && (
                    <View style={modalStyles.rejectedNotice}>
                      <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                      <RNText style={modalStyles.rejectedText}>
                        Cancellation rejected: {selectedAppointment.cancellationRejectedReason}
                      </RNText>
                    </View>
                  )}
                </View>
              </View>
            )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Cancel Request Modal */}
      <Modal visible={showCancelModal} animationType="slide" transparent onRequestClose={() => setShowCancelModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <View style={modalStyles.header}>
              <RNText style={modalStyles.title}>Request Cancellation</RNText>
              <TouchableOpacity onPress={() => setShowCancelModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.body}>
              {selectedCancelAppointment && (
                <>
                  <View style={modalStyles.infoBox}>
                    <Ionicons name="information-circle" size={24} color="#3B82F6" />
                    <RNText style={modalStyles.infoText}>
                      Cancellation requests require admin approval. The patient will be notified once approved.
                    </RNText>
                  </View>

                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Patient:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedCancelAppointment.patientName}</RNText>
                  </View>
                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Time:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedCancelAppointment.time}</RNText>
                  </View>

                  <View style={modalStyles.inputGroup}>
                    <RNText style={modalStyles.inputLabel}>Reason for Cancellation *</RNText>
                    <TextInput
                      style={modalStyles.textArea}
                      placeholder="Please provide a reason for canceling this appointment..."
                      multiline
                      numberOfLines={4}
                      value={cancelReason}
                      onChangeText={setCancelReason}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={modalStyles.modalActions}>
                    <TouchableOpacity 
                      style={modalStyles.submitButton}
                      onPress={submitCancelRequest}
                    >
                      <RNText style={modalStyles.primaryButtonText}>Submit Request</RNText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={modalStyles.secondaryButton}
                      onPress={() => {
                        setShowCancelModal(false);
                        setCancelReason('');
                      }}
                    >
                      <RNText style={modalStyles.secondaryButtonText}>Cancel</RNText>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Complete Appointment Modal */}
      <Modal visible={showCompleteModal} animationType="slide" transparent onRequestClose={() => setShowCompleteModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <View style={modalStyles.header}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <RNText style={modalStyles.title}>Complete Appointment</RNText>
                <RNText style={modalStyles.subTitle}>
                  Record visit details, add prescription, request lab tests, and complete the appointment.
                </RNText>
              </View>
              <TouchableOpacity onPress={() => setShowCompleteModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={modalStyles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={modalStyles.body}>
                {selectedCompleteAppointment && (
                  <View style={modalStyles.infoBox}>
                    <Ionicons name="information-circle" size={24} color="#3B82F6" />
                    <RNText style={modalStyles.infoText}>
                      Patient: {selectedCompleteAppointment.patientName}{'\n'}
                      Scheduled: {selectedCompleteAppointment.appointment_date ? formatDate(selectedCompleteAppointment.appointment_date) : ''}{' '}
                      {selectedCompleteAppointment.time ? `at ${selectedCompleteAppointment.time}` : ''}
                    </RNText>
                  </View>
                )}

                <View style={modalStyles.inputGroup}>
                  <RNText style={modalStyles.inputLabel}>Actual Visit Time *</RNText>
                  <TextInput
                    style={modalStyles.timeInput}
                    placeholder="e.g., 02:51 PM"
                    value={actualVisitTime}
                    onChangeText={setActualVisitTime}
                    placeholderTextColor="#9CA3AF"
                  />
                  <RNText style={modalStyles.helpText}>Record the actual time the patient was seen</RNText>
                </View>

                <View style={modalStyles.inputGroup}>
                  <RNText style={modalStyles.inputLabel}>Visit Notes & Diagnosis</RNText>
                  <TextInput
                    style={modalStyles.textArea}
                    placeholder="Add notes about symptoms, diagnosis, treatment plan, and recommendations..."
                    multiline
                    numberOfLines={4}
                    value={visitNotes}
                    onChangeText={setVisitNotes}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <TouchableOpacity
                  style={modalStyles.checkRow}
                  activeOpacity={0.9}
                  onPress={() => setCreatePrescription((v) => !v)}
                >
                  <Ionicons name={createPrescription ? 'checkbox' : 'square-outline'} size={22} color={createPrescription ? '#1E4BA3' : '#6B7280'} />
                  <RNText style={modalStyles.checkLabel}>Create Prescription</RNText>
                </TouchableOpacity>
                {createPrescription && !!selectedCompleteAppointment && (
                  <RNText style={modalStyles.savedHintText}>
                    {completionArtifactsByAppointmentId?.[selectedCompleteAppointment.id]?.prescriptionId
                      ? `Saved (ID: ${completionArtifactsByAppointmentId?.[selectedCompleteAppointment.id]?.prescriptionId})`
                      : 'Not saved yet'}
                  </RNText>
                )}
                {createPrescription && (
                  <TouchableOpacity
                    style={modalStyles.linkButton}
                    onPress={() => {
                      setShowCompleteModal(false);
                      onOpenCreatePrescription?.({
                        appointmentId: selectedCompleteAppointment?.id || '',
                        patientDbId: selectedCompleteAppointment?.patientDbId,
                        patientName: selectedCompleteAppointment?.patientName,
                        patientNIC: selectedCompleteAppointment?.patientNIC,
                      });
                    }}
                  >
                    <Ionicons name="document-text-outline" size={18} color="#1E4BA3" />
                    <RNText style={modalStyles.linkButtonText}>Open Prescription Form</RNText>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={modalStyles.checkRow}
                  activeOpacity={0.9}
                  onPress={() => setLabTestsRequired((v) => !v)}
                >
                  <Ionicons name={labTestsRequired ? 'checkbox' : 'square-outline'} size={22} color={labTestsRequired ? '#1E4BA3' : '#6B7280'} />
                  <RNText style={modalStyles.checkLabel}>Lab Tests Required</RNText>
                </TouchableOpacity>
                {labTestsRequired && !!selectedCompleteAppointment && (
                  <RNText style={modalStyles.savedHintText}>
                    {completionArtifactsByAppointmentId?.[selectedCompleteAppointment.id]?.labTestIds?.length
                      ? `Saved (${completionArtifactsByAppointmentId?.[selectedCompleteAppointment.id]?.labTestIds?.length} test(s))`
                      : 'Not saved yet'}
                  </RNText>
                )}
                {labTestsRequired && (
                  <TouchableOpacity
                    style={modalStyles.linkButton}
                    onPress={() => {
                      setShowCompleteModal(false);
                      onOpenOrderLabTests?.({
                        appointmentId: selectedCompleteAppointment?.id || '',
                        patientDbId: selectedCompleteAppointment?.patientDbId,
                        patientName: selectedCompleteAppointment?.patientName,
                        patientNIC: selectedCompleteAppointment?.patientNIC,
                      });
                    }}
                  >
                    <Ionicons name="flask-outline" size={18} color="#1E4BA3" />
                    <RNText style={modalStyles.linkButtonText}>Open Lab Test Request</RNText>
                  </TouchableOpacity>
                )}

                {!!onOpenCreateMedicalRecord && (
                  <TouchableOpacity
                    style={modalStyles.linkButtonMuted}
                    onPress={() => {
                      setShowCompleteModal(false);
                      onOpenCreateMedicalRecord({
                        appointmentId: selectedCompleteAppointment?.id || '',
                        patientDbId: selectedCompleteAppointment?.patientDbId,
                        patientName: selectedCompleteAppointment?.patientName,
                        patientNIC: selectedCompleteAppointment?.patientNIC,
                      });
                    }}
                  >
                    <Ionicons name="clipboard-outline" size={18} color="#6B7280" />
                    <RNText style={modalStyles.linkButtonMutedText}>Open Medical Record Form</RNText>
                  </TouchableOpacity>
                )}

                <View style={modalStyles.footerRow}>
                  <TouchableOpacity
                    style={[modalStyles.secondaryButton, { flex: 1 }]}
                    onPress={() => setShowCompleteModal(false)}
                  >
                    <RNText style={modalStyles.secondaryButtonText}>Cancel</RNText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[modalStyles.primaryButton, { flex: 1 }]}
                    onPress={submitComplete}
                  >
                    <RNText style={modalStyles.primaryButtonText}>Complete Appointment</RNText>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  rejectedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  rejectedText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  subTitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  scrollView: {
    maxHeight: '75%',
  },
  body: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalActions: {
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    backgroundColor: '#1E4BA3',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  pendingText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  inputGroup: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  helpText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginTop: 12,
  },
  checkLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  savedHintText: {
    marginTop: 6,
    marginLeft: 30,
    fontSize: 12,
    color: '#6B7280',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E4BA3',
  },
  linkButtonMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  linkButtonMutedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  submitButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
});

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  dateGroup: {
    marginBottom: 12,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
  },
  appointmentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  appointmentPatient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  bodyText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  cancelRequestedText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 4,
  },
  cancelRejectedText: {
    marginTop: 8,
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  completeButton: {
    backgroundColor: '#3B82F6',
  },
  requestCancelButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  actionButtonTextWhite: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  actionButtonTextDanger: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 13,
  },
});

