import { Ionicons } from '@expo/vector-icons';
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
    View
} from 'react-native';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;

interface Appointment {
  id: string;
  patientName: string;
  patientNIC: string;
  time: string;
  type: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'cancel_requested';
  cancellationReason?: string;
}

interface DAppointmentsProps {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  showAppointmentModal: boolean;
  setShowAppointmentModal: (show: boolean) => void;
  handleViewAppointment: (appointment: Appointment) => void;
}

export default function DAppointments({
  appointments,
  selectedAppointment,
  showAppointmentModal,
  setShowAppointmentModal,
  handleViewAppointment,
}: DAppointmentsProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedCancelAppointment, setSelectedCancelAppointment] = useState<Appointment | null>(null);

  const handleRequestCancel = (appointment: Appointment) => {
    setSelectedCancelAppointment(appointment);
    setShowCancelModal(true);
  };

  const submitCancelRequest = () => {
    if (!cancelReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for cancellation');
      return;
    }

    // In real app, this would send request to admin
    Alert.alert(
      'Request Submitted',
      `Cancellation request for ${selectedCancelAppointment?.patientName}'s appointment has been sent to admin for approval.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setShowCancelModal(false);
            setCancelReason('');
            setSelectedCancelAppointment(null);
          }
        }
      ]
    );
  };

  return (
    <>
      <View style={styles.section}>
        <RNText style={styles.sectionTitle}>All Appointments</RNText>
        {appointments.map(appointment => (
          <TouchableOpacity 
            key={appointment.id} 
            style={styles.appointmentCard}
            onPress={() => handleViewAppointment(appointment)}
          >
            <View style={styles.appointmentLeft}>
              <View style={[styles.appointmentStatus, { 
                backgroundColor: appointment.status === 'confirmed' ? '#10B981' : 
                               appointment.status === 'completed' ? '#1E4BA3' : 
                               appointment.status === 'cancelled' ? '#EF4444' :
                               appointment.status === 'cancel_requested' ? '#F59E0B' : '#6B7280'
              }]} />
              <View style={{ flex: 1 }}>
                <RNText style={styles.appointmentPatient}>{appointment.patientName}</RNText>
                <RNText style={styles.appointmentTime}>{appointment.time} • {appointment.type}</RNText>
                <RNText style={styles.appointmentNIC}>NIC: {appointment.patientNIC}</RNText>
                {appointment.status === 'cancel_requested' && (
                  <RNText style={styles.cancelRequestedText}>⏳ Cancellation Pending Admin Approval</RNText>
                )}
              </View>
            </View>
            <View style={styles.appointmentActions}>
              <TouchableOpacity style={styles.actionIconButton}>
                <Ionicons name="checkmark-circle" size={24} color="#1E4BA3" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIconButton}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
                  {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'cancel_requested' && selectedAppointment.status !== 'completed' && (
                    <TouchableOpacity style={modalStyles.primaryButton}>
                      <RNText style={modalStyles.primaryButtonText}>Start Consultation</RNText>
                    </TouchableOpacity>
                  )}
                  
                  {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'cancel_requested' && selectedAppointment.status !== 'completed' && (
                    <TouchableOpacity 
                      style={modalStyles.cancelButton}
                      onPress={() => {
                        setShowAppointmentModal(false);
                        handleRequestCancel(selectedAppointment);
                      }}
                    >
                      <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                      <RNText style={modalStyles.cancelButtonText}>Request to Cancel</RNText>
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
  appointmentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  appointmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  appointmentStatus: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  appointmentPatient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 13,
    color: '#6B7280',
  },
  appointmentNIC: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  cancelRequestedText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 4,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconButton: {
    padding: 4,
  },
});

