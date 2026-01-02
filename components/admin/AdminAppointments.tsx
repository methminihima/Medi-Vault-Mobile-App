import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    Text as RNText,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;

interface Appointment {
  id: string;
  doctorName: string;
  patientName: string;
  patientNIC: string;
  time: string;
  type: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'cancel_requested';
  cancellationReason?: string;
  requestedBy?: 'doctor' | 'patient';
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      doctorName: 'Dr. Sarah Johnson',
      patientName: 'John Doe',
      patientNIC: '123456789V',
      time: '09:00 AM - Dec 12, 2025',
      type: 'Consultation',
      status: 'confirmed',
    },
    {
      id: '2',
      doctorName: 'Dr. Sarah Johnson',
      patientName: 'Jane Smith',
      patientNIC: '987654321V',
      time: '10:30 AM - Dec 12, 2025',
      type: 'Follow-up',
      status: 'cancel_requested',
      cancellationReason: 'Doctor has an emergency surgery scheduled at the same time.',
      requestedBy: 'doctor',
    },
    {
      id: '3',
      doctorName: 'Dr. Mike Wilson',
      patientName: 'Bob Taylor',
      patientNIC: '456789123V',
      time: '02:00 PM - Dec 13, 2025',
      type: 'Emergency',
      status: 'pending',
    },
  ]);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const cancelRequestedAppointments = appointments.filter(
    (apt) => apt.status === 'cancel_requested'
  );

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleOpenApproval = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(false);
    setShowApprovalModal(true);
  };

  const handleApproveCancellation = () => {
    if (!selectedAppointment) return;

    Alert.alert(
      'Approve Cancellation',
      `Are you sure you want to approve the cancellation request for ${selectedAppointment.patientName}'s appointment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'destructive',
          onPress: () => {
            // Update appointment status
            setAppointments((prev) =>
              prev.map((apt) =>
                apt.id === selectedAppointment.id
                  ? { ...apt, status: 'cancelled' as const }
                  : apt
              )
            );

            Alert.alert(
              'Cancellation Approved',
              `The appointment has been cancelled. Notifications have been sent to both doctor and patient.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setShowApprovalModal(false);
                    setAdminNotes('');
                    setSelectedAppointment(null);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleRejectCancellation = () => {
    if (!selectedAppointment) return;

    if (!adminNotes.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejecting the cancellation request.');
      return;
    }

    Alert.alert(
      'Reject Cancellation',
      `Are you sure you want to reject the cancellation request for ${selectedAppointment.patientName}'s appointment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: () => {
            // Revert status back to confirmed
            setAppointments((prev) =>
              prev.map((apt) =>
                apt.id === selectedAppointment.id
                  ? { ...apt, status: 'confirmed' as const, cancellationReason: undefined }
                  : apt
              )
            );

            Alert.alert(
              'Cancellation Rejected',
              `The cancellation request has been rejected. The requesting party has been notified with your reason.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setShowApprovalModal(false);
                    setAdminNotes('');
                    setSelectedAppointment(null);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Pending Cancellation Requests */}
      {cancelRequestedAppointments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="clock-alert-outline" size={24} color="#F59E0B" />
            <RNText style={styles.sectionTitle}>Pending Cancellation Requests</RNText>
            <View style={styles.badge}>
              <RNText style={styles.badgeText}>{cancelRequestedAppointments.length}</RNText>
            </View>
          </View>

          {cancelRequestedAppointments.map((appointment) => (
            <TouchableOpacity
              key={appointment.id}
              style={styles.appointmentCard}
              onPress={() => handleOpenApproval(appointment)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.urgentBadge}>
                  <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                  <RNText style={styles.urgentText}>ACTION REQUIRED</RNText>
                </View>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="doctor" size={18} color="#6B7280" />
                  <RNText style={styles.infoLabel}>Doctor:</RNText>
                  <RNText style={styles.infoValue}>{appointment.doctorName}</RNText>
                </View>

                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="account" size={18} color="#6B7280" />
                  <RNText style={styles.infoLabel}>Patient:</RNText>
                  <RNText style={styles.infoValue}>{appointment.patientName}</RNText>
                </View>

                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color="#6B7280" />
                  <RNText style={styles.infoLabel}>Time:</RNText>
                  <RNText style={styles.infoValue}>{appointment.time}</RNText>
                </View>

                {appointment.cancellationReason && (
                  <View style={styles.reasonBox}>
                    <RNText style={styles.reasonLabel}>Cancellation Reason:</RNText>
                    <RNText style={styles.reasonText}>{appointment.cancellationReason}</RNText>
                  </View>
                )}
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => handleOpenApproval(appointment)}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <RNText style={styles.approveButtonText}>Review Request</RNText>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* All Appointments */}
      <View style={styles.section}>
        <RNText style={styles.sectionTitle}>All Appointments</RNText>

        {appointments.map((appointment) => (
          <TouchableOpacity
            key={appointment.id}
            style={styles.appointmentCard}
            onPress={() => handleViewAppointment(appointment)}
          >
            <View style={styles.appointmentLeft}>
              <View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor:
                      appointment.status === 'confirmed'
                        ? '#1E4BA3'
                        : appointment.status === 'completed'
                        ? '#1E4BA3'
                        : appointment.status === 'cancelled'
                        ? '#EF4444'
                        : appointment.status === 'cancel_requested'
                        ? '#F59E0B'
                        : '#6B7280',
                  },
                ]}
              />
              <View style={{ flex: 1 }}>
                <RNText style={styles.appointmentDoctor}>{appointment.doctorName}</RNText>
                <RNText style={styles.appointmentPatient}>{appointment.patientName}</RNText>
                <RNText style={styles.appointmentTime}>
                  {appointment.time} • {appointment.type}
                </RNText>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    appointment.status === 'confirmed'
                      ? '#E0F2FE'
                      : appointment.status === 'completed'
                      ? '#E0F2FE'
                      : appointment.status === 'cancelled'
                      ? '#FEE2E2'
                      : appointment.status === 'cancel_requested'
                      ? '#FEF3C7'
                      : '#F3F4F6',
                },
              ]}
            >
              <RNText
                style={[
                  styles.statusText,
                  {
                    color:
                      appointment.status === 'confirmed'
                        ? '#0284C7'
                        : appointment.status === 'completed'
                        ? '#0284C7'
                        : appointment.status === 'cancelled'
                        ? '#DC2626'
                        : appointment.status === 'cancel_requested'
                        ? '#D97706'
                        : '#6B7280',
                  },
                ]}
              >
                {appointment.status === 'cancel_requested'
                  ? 'PENDING CANCEL'
                  : appointment.status.toUpperCase()}
              </RNText>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <View style={modalStyles.header}>
              <RNText style={modalStyles.title}>Appointment Details</RNText>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedAppointment && (
              <ScrollView style={modalStyles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={modalStyles.body}>
                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Doctor:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedAppointment.doctorName}</RNText>
                  </View>
                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Patient:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedAppointment.patientName}</RNText>
                  </View>
                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>NIC:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedAppointment.patientNIC}</RNText>
                  </View>
                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Time:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedAppointment.time}</RNText>
                  </View>
                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Type:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedAppointment.type}</RNText>
                  </View>
                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Status:</RNText>
                    <View
                      style={[
                        modalStyles.statusBadge,
                        {
                          backgroundColor:
                            selectedAppointment.status === 'cancel_requested'
                              ? '#FEF3C7'
                              : '#E0F2FE',
                        },
                      ]}
                    >
                      <RNText
                        style={[
                          modalStyles.statusText,
                          {
                            color:
                              selectedAppointment.status === 'cancel_requested'
                                ? '#D97706'
                                : '#0284C7',
                          },
                        ]}
                      >
                        {selectedAppointment.status.toUpperCase()}
                      </RNText>
                    </View>
                  </View>

                  {selectedAppointment.status === 'cancel_requested' && (
                    <TouchableOpacity
                      style={modalStyles.reviewButton}
                      onPress={() => handleOpenApproval(selectedAppointment)}
                    >
                      <RNText style={modalStyles.reviewButtonText}>Review Cancellation Request</RNText>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Approval/Rejection Modal */}
      <Modal
        visible={showApprovalModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowApprovalModal(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <View style={modalStyles.header}>
              <RNText style={modalStyles.title}>Review Cancellation Request</RNText>
              <TouchableOpacity onPress={() => setShowApprovalModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedAppointment && (
              <ScrollView style={modalStyles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={modalStyles.body}>
                  <View style={modalStyles.warningBox}>
                    <Ionicons name="alert-circle" size={24} color="#F59E0B" />
                    <RNText style={modalStyles.warningText}>
                      This action will notify both the doctor and patient about your decision.
                    </RNText>
                  </View>

                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Doctor:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedAppointment.doctorName}</RNText>
                  </View>
                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Patient:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedAppointment.patientName}</RNText>
                  </View>
                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Time:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedAppointment.time}</RNText>
                  </View>

                  {selectedAppointment.cancellationReason && (
                    <View style={modalStyles.reasonBox}>
                      <RNText style={modalStyles.reasonLabel}>Cancellation Reason:</RNText>
                      <RNText style={modalStyles.reasonText}>
                        {selectedAppointment.cancellationReason}
                      </RNText>
                    </View>
                  )}

                  <View style={modalStyles.inputGroup}>
                    <RNText style={modalStyles.inputLabel}>
                      Admin Notes {!adminNotes.trim() && '(Required for rejection)'}
                    </RNText>
                    <TextInput
                      style={modalStyles.textArea}
                      placeholder="Add notes about your decision (required for rejection)..."
                      multiline
                      numberOfLines={4}
                      value={adminNotes}
                      onChangeText={setAdminNotes}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={modalStyles.actionButtons}>
                    <TouchableOpacity
                      style={modalStyles.approveBtn}
                      onPress={handleApproveCancellation}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <RNText style={modalStyles.approveBtnText}>Approve Cancellation</RNText>
                    </TouchableOpacity>

                    <TouchableOpacity style={modalStyles.rejectBtn} onPress={handleRejectCancellation}>
                      <Ionicons name="close-circle" size={20} color="#fff" />
                      <RNText style={modalStyles.rejectBtnText}>Reject Request</RNText>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  badge: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  appointmentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    marginBottom: 12,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
  },
  reasonBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  cardActions: {
    marginTop: 12,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E4BA3',
    paddingVertical: 12,
    borderRadius: 10,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  appointmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusIndicator: {
    width: 4,
    height: 50,
    borderRadius: 2,
  },
  appointmentDoctor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  appointmentPatient: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

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
    maxHeight: '85%',
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
  scrollView: {
    maxHeight: '80%',
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
  reviewButton: {
    backgroundColor: '#1E4BA3',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
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
  actionButtons: {
    gap: 12,
    marginTop: 20,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E4BA3',
    borderRadius: 12,
    paddingVertical: 14,
  },
  approveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
  },
  rejectBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  reasonBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
});

