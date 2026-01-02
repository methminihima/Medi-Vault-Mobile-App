import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  ImageBackground,
  Modal,
  Platform,
  Text as RNText,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeIn } from '../../utils/animations';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;
const isTablet = width >= 768;

interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending';
  type: string;
  notes?: string;
}

interface AppointmentsViewProps {
  userRole: 'doctor' | 'patient' | 'admin' | 'pharmacist' | 'lab_technician';
  userId?: string;
}

export default function AppointmentsView({ userRole, userId }: AppointmentsViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      patientName: 'John Doe',
      doctorName: 'Dr. Sarah Johnson',
      date: '2025-12-02',
      time: '10:00 AM',
      status: 'scheduled',
      type: 'General Checkup',
      notes: 'Annual physical examination'
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      doctorName: 'Dr. Michael Brown',
      date: '2025-12-02',
      time: '02:30 PM',
      status: 'scheduled',
      type: 'Follow-up',
      notes: 'Review test results'
    },
    {
      id: '3',
      patientName: 'Robert Wilson',
      doctorName: 'Dr. Sarah Johnson',
      date: '2025-12-01',
      time: '09:00 AM',
      status: 'completed',
      type: 'Consultation',
      notes: 'Consultation completed successfully'
    }
  ]);

  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedView, setSelectedView] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [newAppointment, setNewAppointment] = useState({
    doctorName: '',
    date: '',
    time: '',
    type: '',
    notes: ''
  });

  const cardAnim = useFadeIn(0, 600);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'pending':
        return '#3B82F6';
      case 'completed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'calendar-check';
      case 'pending':
        return 'clock-outline';
      case 'completed':
        return 'check-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const filterAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    switch (selectedView) {
      case 'upcoming':
        return appointments.filter(apt => apt.date >= today && apt.status !== 'cancelled');
      case 'past':
        return appointments.filter(apt => apt.date < today || apt.status === 'completed');
      case 'all':
      default:
        return appointments;
    }
  };

  const handleBookAppointment = () => {
    if (!newAppointment.doctorName || !newAppointment.date || !newAppointment.time) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const appointment: Appointment = {
      id: String(appointments.length + 1),
      patientName: userRole === 'patient' ? 'Current User' : newAppointment.doctorName,
      doctorName: newAppointment.doctorName,
      date: newAppointment.date,
      time: newAppointment.time,
      status: 'pending',
      type: newAppointment.type || 'General Checkup',
      notes: newAppointment.notes
    };

    setAppointments([appointment, ...appointments]);
    setShowBookModal(false);
    setNewAppointment({ doctorName: '', date: '', time: '', type: '', notes: '' });
    Alert.alert('Success', 'Appointment booked successfully!');
  };

  const handleCancelAppointment = (id: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            setAppointments(prev =>
              prev.map(apt => (apt.id === id ? { ...apt, status: 'cancelled' as const } : apt))
            );
          }
        }
      ]
    );
  };

  const filteredAppointments = filterAppointments();

  return (
    <ImageBackground
      source={require('../../assets/images/Background-image.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <RNText style={styles.headerTitle}>Appointments</RNText>
          <RNText style={styles.headerSubtitle}>
            {filteredAppointments.length} {selectedView} appointments
          </RNText>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={() => setShowBookModal(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['upcoming', 'past', 'all'] as const).map(view => (
          <TouchableOpacity
            key={view}
            style={[styles.filterTab, selectedView === view && styles.filterTabActive]}
            onPress={() => setSelectedView(view)}
          >
            <RNText style={[styles.filterText, selectedView === view && styles.filterTextActive]}>
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </RNText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Appointments List */}
      <ScrollView style={styles.appointmentsList} showsVerticalScrollIndicator={false}>
        {filteredAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-blank" size={64} color="#D1D5DB" />
            <RNText style={styles.emptyText}>No appointments found</RNText>
            <RNText style={styles.emptySubtext}>Book a new appointment to get started</RNText>
          </View>
        ) : (
          filteredAppointments.map((appointment, index) => (
            <Animated.View key={appointment.id} style={cardAnim}>
              <View style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.appointmentInfo}>
                    <MaterialCommunityIcons
                      name={getStatusIcon(appointment.status)}
                      size={24}
                      color={getStatusColor(appointment.status)}
                    />
                    <View style={styles.appointmentDetails}>
                      <RNText style={styles.appointmentType}>{appointment.type}</RNText>
                      <RNText style={styles.appointmentMeta}>
                        {userRole === 'doctor' ? appointment.patientName : appointment.doctorName}
                      </RNText>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
                    <RNText style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
                      {appointment.status}
                    </RNText>
                  </View>
                </View>

                <View style={styles.appointmentBody}>
                  <View style={styles.appointmentRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <RNText style={styles.appointmentText}>{appointment.date}</RNText>
                  </View>
                  <View style={styles.appointmentRow}>
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <RNText style={styles.appointmentText}>{appointment.time}</RNText>
                  </View>
                  {appointment.notes && (
                    <View style={styles.appointmentRow}>
                      <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                      <RNText style={styles.appointmentText}>{appointment.notes}</RNText>
                    </View>
                  )}
                </View>

                {appointment.status === 'scheduled' && (
                  <View style={styles.appointmentActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => handleCancelAppointment(appointment.id)}
                    >
                      <RNText style={styles.cancelButtonText}>Cancel</RNText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.rescheduleButton]}>
                      <RNText style={styles.rescheduleButtonText}>Reschedule</RNText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Book Appointment Modal */}
      <Modal visible={showBookModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <RNText style={styles.modalTitle}>Book Appointment</RNText>
              <TouchableOpacity onPress={() => setShowBookModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <RNText style={styles.inputLabel}>Doctor Name *</RNText>
                <TextInput
                  style={styles.input}
                  placeholder="Enter doctor name"
                  value={newAppointment.doctorName}
                  onChangeText={text => setNewAppointment({ ...newAppointment, doctorName: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <RNText style={styles.inputLabel}>Date *</RNText>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={newAppointment.date}
                  onChangeText={text => setNewAppointment({ ...newAppointment, date: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <RNText style={styles.inputLabel}>Time *</RNText>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM AM/PM"
                  value={newAppointment.time}
                  onChangeText={text => setNewAppointment({ ...newAppointment, time: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <RNText style={styles.inputLabel}>Appointment Type</RNText>
                <TextInput
                  style={styles.input}
                  placeholder="General Checkup, Follow-up, etc."
                  value={newAppointment.type}
                  onChangeText={text => setNewAppointment({ ...newAppointment, type: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <RNText style={styles.inputLabel}>Notes</RNText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Additional notes..."
                  value={newAppointment.notes}
                  onChangeText={text => setNewAppointment({ ...newAppointment, notes: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowBookModal(false)}
              >
                <RNText style={styles.cancelModalButtonText}>Cancel</RNText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.bookModalButton]}
                onPress={handleBookAppointment}
              >
                <RNText style={styles.bookModalButtonText}>Book Appointment</RNText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  bookButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E4BA3',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1E4BA3',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#1E4BA3',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  appointmentsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  appointmentMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  appointmentBody: {
    gap: 8,
    marginBottom: 12,
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appointmentText: {
    fontSize: 14,
    color: '#374151',
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  rescheduleButton: {
    backgroundColor: '#DBEAFE',
  },
  rescheduleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  bookModalButton: {
    backgroundColor: '#1E4BA3',
  },
  bookModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

