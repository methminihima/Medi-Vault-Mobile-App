import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { API_BASE_URL } from '../../src/config/constants';
import { storageService } from '../../src/services/storageService';
import AddAppointmentModalComponent from './AddAppointmentModal';

interface Props {
  onBack?: () => void;
  onMenu?: () => void;
}

type FilterType = 'All' | 'Upcoming' | 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Past';

interface Appointment {
  id: string;
  doctor_id: string;
  patient_id?: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  doctor_name?: string;
  doctor_specialty?: string;
}

interface GroupedAppointments {
  [date: string]: Appointment[];
}

const DOCTORS = [
  { id: 17, name: 'Dr. John Smith', specialty: 'Cardiologist' },
  { id: 18, name: 'Dr. Sarah Johnson', specialty: 'Dermatologist' },
  { id: 19, name: 'Dr. Michael Chen', specialty: 'Pediatrician' },
  { id: 20, name: 'Dr. Emily Davis', specialty: 'Orthopedic Surgeon' },
  { id: 21, name: 'Dr. Robert Wilson', specialty: 'Neurologist' },
];

export default function PatientBookAppointment({ onBack, onMenu }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const isWide = windowWidth >= 720;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [userId, setUserId] = useState<string | number>('');
  
  const [formData, setFormData] = useState({
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
  });

  useEffect(() => {
    void initializeUser();
  }, []);

  useEffect(() => {
    if (!userId) return;
    void fetchAppointments(String(userId), true);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return undefined;
      void fetchAppointments(String(userId), false);
      return undefined;
    }, [userId])
  );

  const initializeUser = async () => {
    const user = await storageService.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const fetchAppointments = async (patientId?: string, showSpinner: boolean = false) => {
    try {
      if (showSpinner) setLoading(true);
      const url = patientId
        ? `${API_BASE_URL}/appointments?patient_id=${encodeURIComponent(patientId)}`
        : `${API_BASE_URL}/appointments`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        const appointmentsWithDoctors = data.data.map((apt: any) => {
          return {
            ...apt,
            doctor_name: apt.doctor_first_name && apt.doctor_last_name 
              ? `Dr. ${apt.doctor_first_name} ${apt.doctor_last_name}`
              : 'Dr. Unknown',
            doctor_specialty: apt.doctor_specialization || 'General',
          };
        });
        setAppointments(appointmentsWithDoctors);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const bookAppointment = async () => {
    try {
      if (!formData.doctor_id || !formData.appointment_date || !formData.appointment_time || !formData.reason) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      const user = await storageService.getUser();
      if (!user) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: user.id,
          doctor_id: formData.doctor_id,
          appointment_date: formData.appointment_date,
          appointment_time: formData.appointment_time,
          reason: formData.reason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Appointment booked successfully!');
        setShowModal(false);
        setFormData({ doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
        void fetchAppointments(String(userId || user.id), false);
      } else {
        Alert.alert('Error', data.message || 'Failed to book appointment');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to book appointment');
      console.error('Error booking appointment:', error);
    }
  };

  const deleteAppointment = async (id: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
                method: 'DELETE',
              });

              const data = await response.json();

              if (data.success) {
                Alert.alert('Success', 'Appointment cancelled successfully!');
                fetchAppointments();
              } else {
                Alert.alert('Error', data.message || 'Failed to cancel appointment');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel appointment');
              console.error('Error cancelling appointment:', error);
            }
          },
        },
      ]
    );
  };

  const isWithinCancelWindow = (createdAt: string) => {
    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) return true;
    const diffMs = Date.now() - created.getTime();
    return diffMs >= 0 && diffMs <= 60 * 60 * 1000;
  };

  const canCancelAppointment = (apt: Appointment) => {
    if (!apt) return false;
    if (apt.status === 'cancelled' || apt.status === 'completed') return false;
    if (!apt.created_at) return true;
    return isWithinCancelWindow(String(apt.created_at));
  };

  const getFilteredAppointments = (): Appointment[] => {
    let filtered = appointments;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.doctor_name?.toLowerCase().includes(query) ||
        apt.doctor_specialty?.toLowerCase().includes(query) ||
        apt.reason.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    const now = new Date();
    switch (activeFilter) {
      case 'Upcoming':
        return filtered.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate >= now && (apt.status === 'confirmed' || apt.status === 'pending');
        });
      case 'Pending':
        return filtered.filter(apt => apt.status === 'pending');
      case 'Confirmed':
        return filtered.filter(apt => apt.status === 'confirmed');
      case 'Completed':
        return filtered.filter(apt => apt.status === 'completed');
      case 'Cancelled':
        return filtered.filter(apt => apt.status === 'cancelled');
      case 'Past':
        return filtered.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate < now;
        });
      default:
        return filtered;
    }
  };

  const getFilterCounts = () => {
    const now = new Date();
    return {
      All: appointments.length,
      Upcoming: appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= now && (apt.status === 'confirmed' || apt.status === 'pending');
      }).length,
      Pending: appointments.filter(apt => apt.status === 'pending').length,
      Confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
      Completed: appointments.filter(apt => apt.status === 'completed').length,
      Cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
      Past: appointments.filter(apt => new Date(apt.appointment_date) < now).length,
    };
  };

  const groupAppointmentsByDate = (appointments: Appointment[]): GroupedAppointments => {
    return appointments.reduce((groups: GroupedAppointments, appointment) => {
      const date = new Date(appointment.appointment_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(appointment);
      return groups;
    }, {});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'completed': return '#6B7280';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#D1FAE5';
      case 'pending': return '#FEF3C7';
      case 'completed': return '#E5E7EB';
      case 'cancelled': return '#FEE2E2';
      default: return '#E5E7EB';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const filteredAppointments = getFilteredAppointments();
  const groupedAppointments = groupAppointmentsByDate(filteredAppointments);
  const filterCounts = getFilterCounts();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E4BA3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/Background-image.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.gradientOverlay} />
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {onMenu ? (
              <TouchableOpacity onPress={onMenu} style={styles.backButton}>
                <Ionicons name="menu" size={24} color="#fff" />
              </TouchableOpacity>
            ) : onBack ? (
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.headerTitle}>Appointments</Text>
          </View>
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.bookButtonText}>Book Appointment</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by doctor, specialty, or reason..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
        {(['All', 'Upcoming', 'Pending', 'Confirmed', 'Completed', 'Cancelled', 'Past'] as FilterType[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, activeFilter === filter && styles.filterTabActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
              {filter}
            </Text>
            <View style={[styles.filterBadge, activeFilter === filter && styles.filterBadgeActive]}>
              <Text style={[styles.filterCount, activeFilter === filter && styles.filterCountActive]}>
                {filterCounts[filter]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        </ScrollView>

        {/* More Filters Button */}
        <View style={styles.moreFiltersContainer}>
        <TouchableOpacity style={styles.moreFiltersButton}>
          <MaterialCommunityIcons name="tune-variant" size={18} color="#6B7280" />
          <Text style={styles.moreFiltersText}>More Filters</Text>
        </TouchableOpacity>
        <Text style={styles.resultsText}>
          {filteredAppointments.length} {filteredAppointments.length === 1 ? 'result' : 'results'}
        </Text>
        </View>

        {/* Appointments List */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {Object.keys(groupedAppointments).length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No appointments found</Text>
            <Text style={styles.emptySubtext}>
              {activeFilter !== 'All' 
                ? `Try changing the filter or search term`
                : `Book your first appointment to get started`
              }
            </Text>
          </View>
        ) : (
          Object.entries(groupedAppointments).map(([date, dateAppointments]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{date}</Text>
              <View style={styles.cardsGrid}>
              {dateAppointments.map((appointment) => (
                <View
                  key={appointment.id}
                  style={[
                    styles.appointmentCard,
                    !isWide && styles.appointmentCardCompact,
                    isWide && styles.appointmentCardWide,
                  ]}
                >
                  <View style={[styles.cardBody, isWide && styles.cardBodyWide]}>
                    <View style={[styles.cardLeft, isWide && styles.cardLeftWide]}>
                      {/* Doctor Info */}
                      <View style={styles.cardHeader}>
                        <View style={styles.doctorInfo}>
                          <Text style={styles.doctorName}>{appointment.doctor_name}</Text>
                          <Text style={styles.specialty}>{appointment.doctor_specialty}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(appointment.status) }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={[styles.cardRight, isWide && styles.cardRightWide]}>
                      {/* Appointment Details */}
                      <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                          <Text style={styles.detailText}>{formatDate(appointment.appointment_date)}</Text>
                        </View>
                      </View>

                      <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="time-outline" size={16} color="#6B7280" />
                          <Text style={styles.detailText}>{appointment.appointment_time}</Text>
                        </View>
                      </View>

                      <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="person-outline" size={16} color="#6B7280" />
                          <Text style={styles.detailText} numberOfLines={isWide ? 2 : 1}>
                            {appointment.reason}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="time-outline" size={16} color="#6B7280" />
                          <Text style={styles.detailText} numberOfLines={1}>
                            Booked on {new Date(appointment.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Actions */}
                  {canCancelAppointment(appointment) && (
                    <TouchableOpacity
                      style={[styles.cancelButton, !isWide && styles.cancelButtonCompact]}
                      onPress={() => deleteAppointment(appointment.id)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              </View>
            </View>
          ))
        )}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Add Appointment Modal */}
        <AddAppointmentModalComponent
          visible={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => void fetchAppointments(String(userId), false)}
          patientId={String(userId)}
          apiBaseUrl={API_BASE_URL}
        />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(243, 244, 246, 0.96)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 10,
    backgroundColor: '#1E4BA3',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    marginTop: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  filterContainer: {
    marginTop: 4,
    marginHorizontal: 4,
    paddingVertical: 0,
  },
  filterContent: {
    gap: 6,
    paddingLeft: 4,
    paddingRight: 4,
    alignItems: 'center',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: 6,
    paddingVertical: 0,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  filterBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
  },
  filterCountActive: {
    color: '#fff',
  },
  moreFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 4,
  },
  moreFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  moreFiltersText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  resultsText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateGroup: {
    marginBottom: 12,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  appointmentCardCompact: {
    padding: 12,
    marginBottom: 6,
  },
  appointmentCardWide: {
    width: '100%',
  },
  cardBody: {
    width: '100%',
  },
  cardBodyWide: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  cardLeft: {
    width: '100%',
  },
  cardLeftWide: {
    flex: 1,
  },
  cardRight: {
    width: '100%',
  },
  cardRightWide: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  specialty: {
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
  },
  detailsRow: {
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  cancelButtonCompact: {
    marginTop: 10,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
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
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  formGroup: {
    marginBottom: 20,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    gap: 8,
  },
  doctorOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
  },
  doctorOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  doctorOptionContent: {
    flex: 1,
  },
  doctorOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  doctorOptionSpecialty: {
    fontSize: 12,
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
