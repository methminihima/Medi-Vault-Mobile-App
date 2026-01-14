import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Doctor {
  // We use the user's id here; backend resolves doctor_id via doctors.user_id.
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email?: string;
  specialization?: string;
}

interface AddAppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId: string;
  apiBaseUrl: string;
}

const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({
  visible,
  onClose,
  onSuccess,
  patientId,
  apiBaseUrl,
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [appointmentTime, setAppointmentTime] = useState('09:00 AM');
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Fetch available doctors
  useEffect(() => {
    if (visible) {
      fetchDoctors();
    }
  }, [visible]);

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      // Load doctors from users table so newly created doctors appear.
      const response = await fetch(`${apiBaseUrl}/users?role=doctor&isActive=true`);
      const data = await response.json();
      
      if (data.success) {
        const mapped: Doctor[] = (data.data || []).map((u: any) => ({
          id: String(u.id),
          firstName: u.firstName ?? u.first_name ?? '',
          lastName: u.lastName ?? u.last_name ?? '',
          fullName: u.fullName ?? u.full_name,
          email: u.email,
          specialization: u.specialization ?? u.doctor_specialization,
        }));
        setDoctors(mapped);
      } else {
        Alert.alert('Error', 'Failed to load doctors');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      Alert.alert('Error', 'Failed to load doctors');
    } finally {
      setLoadingDoctors(false);
    }
  };

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setAppointmentDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setAppointmentTime(formatTime(selectedTime));
    }
  };

  const validateForm = () => {
    if (!selectedDoctor) {
      Alert.alert('Validation Error', 'Please select a doctor');
      return false;
    }
    if (!reason.trim()) {
      Alert.alert('Validation Error', 'Please enter the reason for appointment');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const appointmentData = {
        patient_id: patientId,
        doctor_id: selectedDoctor!.id,
        appointment_date: formatDate(appointmentDate),
        appointment_time: appointmentTime,
        reason: reason.trim(),
        notes: notes.trim() || null,
      };

      const response = await fetch(`${apiBaseUrl}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Success',
          'Appointment booked successfully! Your appointment is pending approval.',
          [
            {
              text: 'OK',
              onPress: () => {
                resetForm();
                onSuccess();
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDoctor(null);
    setAppointmentDate(new Date());
    setAppointmentTime('09:00 AM');
    setReason('');
    setNotes('');
  };

  const timeSlots = [
    '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
    '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Book Appointment</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Doctor Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Doctor *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDoctorPicker(!showDoctorPicker)}
              >
                <Text style={[styles.pickerText, !selectedDoctor && styles.placeholderText]}>
                  {selectedDoctor
                    ? `Dr. ${selectedDoctor.fullName ?? `${selectedDoctor.firstName} ${selectedDoctor.lastName}`.trim()} - ${selectedDoctor.specialization || 'General'}`
                    : 'Choose a doctor'}
                </Text>
                <Ionicons
                  name={showDoctorPicker ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>

              {/* Doctor List */}
              {showDoctorPicker && (
                <View style={styles.pickerList}>
                  {loadingDoctors ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#3B82F6" />
                    </View>
                  ) : doctors.length === 0 ? (
                    <Text style={styles.emptyText}>No doctors available</Text>
                  ) : (
                    doctors.map((doctor) => (
                      <TouchableOpacity
                        key={doctor.id}
                        style={[
                          styles.pickerItem,
                          selectedDoctor?.id === doctor.id && styles.pickerItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedDoctor(doctor);
                          setShowDoctorPicker(false);
                        }}
                      >
                        <View>
                          <Text style={styles.doctorName}>
                            Dr. {doctor.fullName ?? `${doctor.firstName} ${doctor.lastName}`.trim()}
                          </Text>
                          <Text style={styles.doctorSpecialization}>{doctor.specialization || 'General'}</Text>
                        </View>
                        {selectedDoctor?.id === doctor.id && (
                          <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* Date Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Appointment Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                <Text style={styles.dateText}>
                  {appointmentDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={appointmentDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Time Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Appointment Time *</Text>
              <View style={styles.timeSlotContainer}>
                {timeSlots.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeSlot,
                      appointmentTime === time && styles.timeSlotSelected,
                    ]}
                    onPress={() => setAppointmentTime(time)}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        appointmentTime === time && styles.timeSlotTextSelected,
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reason */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reason for Visit *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="E.g., General checkup, Follow-up visit, etc."
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Any specific symptoms or concerns..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Book Appointment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
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
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
  },
  pickerText: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  pickerList: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    maxHeight: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    padding: 20,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  doctorSpecialization: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  dateText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeSlotSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  timeSlotText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
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
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default AddAppointmentModal;
