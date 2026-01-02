import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
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

interface Doctor {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  experience: number;
  qualification: string;
  rating: number;
  totalPatients: number;
  totalAppointments: number;
  availableDays: string[];
  consultationFee: number;
  registrationDate: string;
  status: 'active' | 'inactive' | 'on_leave';
}

export default function AdminDoctors() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [doctors, setDoctors] = useState<Doctor[]>([
    {
      id: '1',
      fullName: 'Dr. Nimal Silvs',
      email: 'sarah.johnson@medivault.com',
      phone: '+1 234-567-8901',
      specialization: 'Cardiologist',
      licenseNumber: 'MD-12345',
      experience: 15,
      qualification: 'MD, FACC',
      rating: 4.8,
      totalPatients: 342,
      totalAppointments: 1247,
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday'],
      consultationFee: 150,
      registrationDate: '2024-01-15',
      status: 'active'
    },
    {
      id: '2',
      fullName: 'Dr. Sirisena Abeysekera',
      email: 'michael.chen@medivault.com',
      phone: '+1 234-567-8902',
      specialization: 'Neurologist',
      licenseNumber: 'MD-12346',
      experience: 12,
      qualification: 'MD, PhD',
      rating: 4.9,
      totalPatients: 287,
      totalAppointments: 1089,
      availableDays: ['Monday', 'Wednesday', 'Thursday', 'Saturday'],
      consultationFee: 180,
      registrationDate: '2024-01-10',
      status: 'active'
    },
    {
      id: '3',
      fullName: 'Dr. Emily Rodriguez',
      email: 'emily.rodriguez@medivault.com',
      phone: '+1 234-567-8903',
      specialization: 'Pediatrician',
      licenseNumber: 'MD-12347',
      experience: 10,
      qualification: 'MD, FAAP',
      rating: 4.7,
      totalPatients: 456,
      totalAppointments: 1523,
      availableDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      consultationFee: 120,
      registrationDate: '2024-02-01',
      status: 'active'
    },
    {
      id: '4',
      fullName: 'Dr. James Wilson',
      email: 'james.wilson@medivault.com',
      phone: '+1 234-567-8904',
      specialization: 'Orthopedic Surgeon',
      licenseNumber: 'MD-12348',
      experience: 18,
      qualification: 'MD, FAAOS',
      rating: 4.6,
      totalPatients: 298,
      totalAppointments: 987,
      availableDays: ['Monday', 'Tuesday', 'Friday'],
      consultationFee: 200,
      registrationDate: '2024-01-20',
      status: 'active'
    },
    {
      id: '5',
      fullName: 'Dr. Lisa Anderson',
      email: 'lisa.anderson@medivault.com',
      phone: '+1 234-567-8905',
      specialization: 'Dermatologist',
      licenseNumber: 'MD-12349',
      experience: 8,
      qualification: 'MD, FAAD',
      rating: 4.5,
      totalPatients: 215,
      totalAppointments: 756,
      availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
      consultationFee: 130,
      registrationDate: '2024-03-05',
      status: 'on_leave'
    },
    {
      id: '6',
      fullName: 'Dr. Robert Brown',
      email: 'robert.brown@medivault.com',
      phone: '+1 234-567-8906',
      specialization: 'Psychiatrist',
      licenseNumber: 'MD-12350',
      experience: 14,
      qualification: 'MD, MRCPsych',
      rating: 4.7,
      totalPatients: 178,
      totalAppointments: 634,
      availableDays: ['Tuesday', 'Thursday', 'Friday'],
      consultationFee: 160,
      registrationDate: '2024-02-15',
      status: 'active'
    },
    {
      id: '7',
      fullName: 'Dr. Jennifer Martinez',
      email: 'jennifer.martinez@medivault.com',
      phone: '+1 234-567-8907',
      specialization: 'Gynecologist',
      licenseNumber: 'MD-12351',
      experience: 11,
      qualification: 'MD, FACOG',
      rating: 4.8,
      totalPatients: 389,
      totalAppointments: 1345,
      availableDays: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
      consultationFee: 140,
      registrationDate: '2024-01-25',
      status: 'active'
    },
    {
      id: '8',
      fullName: 'Dr. David Kim',
      email: 'david.kim@medivault.com',
      phone: '+1 234-567-8908',
      specialization: 'Ophthalmologist',
      licenseNumber: 'MD-12352',
      experience: 9,
      qualification: 'MD, FACS',
      rating: 4.6,
      totalPatients: 267,
      totalAppointments: 892,
      availableDays: ['Monday', 'Wednesday', 'Thursday'],
      consultationFee: 135,
      registrationDate: '2024-02-20',
      status: 'inactive'
    }
  ]);

  const specializations = ['all', 'Cardiologist', 'Neurologist', 'Pediatrician', 'Orthopedic Surgeon', 'Dermatologist', 'Psychiatrist', 'Gynecologist', 'Ophthalmologist'];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = 
      searchQuery === '' ||
      doctor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialization = filterSpecialization === 'all' || doctor.specialization === filterSpecialization;
    const matchesStatus = filterStatus === 'all' || doctor.status === filterStatus;
    
    return matchesSearch && matchesSpecialization && matchesStatus;
  });

  const getSpecializationColor = (specialization: string) => {
    const colors: { [key: string]: string } = {
      'Cardiologist': '#EF4444',
      'Neurologist': '#8B5CF6',
      'Pediatrician': '#EC4899',
      'Orthopedic Surgeon': '#F59E0B',
      'Dermatologist': '#10B981',
      'Psychiatrist': '#3B82F6',
      'Gynecologist': '#EC4899',
      'Ophthalmologist': '#06B6D4',
    };
    return colors[specialization] || '#6B7280';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'on_leave': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on_leave': return 'On Leave';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const viewDoctorDetails = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDetailsModal(true);
  };

  const toggleDoctorStatus = (doctor: Doctor) => {
    Alert.alert(
      'Change Doctor Status',
      'Select new status:',
      [
        {
          text: 'Active',
          onPress: () => updateDoctorStatus(doctor.id, 'active')
        },
        {
          text: 'Inactive',
          onPress: () => updateDoctorStatus(doctor.id, 'inactive')
        },
        {
          text: 'On Leave',
          onPress: () => updateDoctorStatus(doctor.id, 'on_leave')
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const updateDoctorStatus = (doctorId: string, newStatus: Doctor['status']) => {
    const updatedDoctors = doctors.map(d => 
      d.id === doctorId ? { ...d, status: newStatus } : d
    );
    setDoctors(updatedDoctors);
    Alert.alert('Success', 'Doctor status updated successfully');
  };

  return (
    <ImageBackground
      source={require('../../assets/images/Background-image.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <RNText style={styles.headerTitle}>Doctors Management</RNText>
          <View style={styles.statsContainer}>
            <View style={styles.statBadge}>
              <RNText style={styles.statNumber}>{doctors.filter(d => d.status === 'active').length}</RNText>
              <RNText style={styles.statLabel}>Active</RNText>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, specialization..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <RNText style={styles.filterLabel}>Specialization:</RNText>
            {specializations.map((spec) => (
              <TouchableOpacity
                key={spec}
                style={[styles.filterChip, filterSpecialization === spec && styles.filterChipActive]}
                onPress={() => setFilterSpecialization(spec)}
              >
                <RNText style={[styles.filterChipText, filterSpecialization === spec && styles.filterChipTextActive]}>
                  {spec === 'all' ? 'All' : spec}
                </RNText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filtersContainer}>
          <RNText style={styles.filterLabel}>Status:</RNText>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
            onPress={() => setFilterStatus('all')}
          >
            <RNText style={[styles.filterChipText, filterStatus === 'all' && styles.filterChipTextActive]}>
              All
            </RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'active' && styles.filterChipActive]}
            onPress={() => setFilterStatus('active')}
          >
            <RNText style={[styles.filterChipText, filterStatus === 'active' && styles.filterChipTextActive]}>
              Active
            </RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'on_leave' && styles.filterChipActive]}
            onPress={() => setFilterStatus('on_leave')}
          >
            <RNText style={[styles.filterChipText, filterStatus === 'on_leave' && styles.filterChipTextActive]}>
              On Leave
            </RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'inactive' && styles.filterChipActive]}
            onPress={() => setFilterStatus('inactive')}
          >
            <RNText style={[styles.filterChipText, filterStatus === 'inactive' && styles.filterChipTextActive]}>
              Inactive
            </RNText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Doctors List */}
      <ScrollView
        style={styles.doctorsList}
        contentContainerStyle={styles.doctorsContent}
        showsVerticalScrollIndicator={false}
      >
        <RNText style={styles.resultCount}>
          {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found
        </RNText>

        {filteredDoctors.map((doctor) => (
          <TouchableOpacity 
            key={doctor.id} 
            style={styles.doctorCard}
            onPress={() => viewDoctorDetails(doctor)}
            activeOpacity={0.7}
          >
            <View style={styles.doctorLeft}>
              <View style={[styles.doctorAvatar, { backgroundColor: `${getSpecializationColor(doctor.specialization)}15` }]}>
                <MaterialCommunityIcons
                  name="doctor"
                  size={28}
                  color={getSpecializationColor(doctor.specialization)}
                />
              </View>
            </View>

            <View style={styles.doctorContent}>
              <View style={styles.doctorHeader}>
                <RNText style={styles.doctorName}>{doctor.fullName}</RNText>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(doctor.status)}15` }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(doctor.status) }]} />
                  <RNText style={[styles.statusText, { color: getStatusColor(doctor.status) }]}>
                    {getStatusLabel(doctor.status)}
                  </RNText>
                </View>
              </View>

              <View style={[styles.specializationBadge, { backgroundColor: `${getSpecializationColor(doctor.specialization)}15` }]}>
                <MaterialCommunityIcons name="stethoscope" size={12} color={getSpecializationColor(doctor.specialization)} />
                <RNText style={[styles.specializationText, { color: getSpecializationColor(doctor.specialization) }]}>
                  {doctor.specialization}
                </RNText>
              </View>

              <View style={styles.doctorMetrics}>
                <View style={styles.metricItem}>
                  <MaterialCommunityIcons name="briefcase" size={14} color="#6B7280" />
                  <RNText style={styles.metricText}>{doctor.experience} years</RNText>
                </View>
                <View style={styles.metricItem}>
                  <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                  <RNText style={styles.metricText}>{doctor.rating}</RNText>
                </View>
                <View style={styles.metricItem}>
                  <MaterialCommunityIcons name="account-group" size={14} color="#6B7280" />
                  <RNText style={styles.metricText}>{doctor.totalPatients} patients</RNText>
                </View>
              </View>

              <View style={styles.doctorInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={14} color="#6B7280" />
                  <RNText style={styles.infoText}>{doctor.email}</RNText>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={14} color="#6B7280" />
                  <RNText style={styles.infoText}>{doctor.phone}</RNText>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="certificate" size={14} color="#6B7280" />
                  <RNText style={styles.infoText}>{doctor.licenseNumber}</RNText>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="cash" size={14} color="#10B981" />
                  <RNText style={styles.infoText}>${doctor.consultationFee} / consultation</RNText>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.viewButton]}
                  onPress={() => viewDoctorDetails(doctor)}
                >
                  <Ionicons name="eye-outline" size={16} color="#3B82F6" />
                  <RNText style={styles.viewButtonText}>View Details</RNText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.statusButton]}
                  onPress={() => toggleDoctorStatus(doctor)}
                >
                  <Ionicons name="swap-horizontal-outline" size={16} color="#F59E0B" />
                  <RNText style={styles.statusButtonText}>Change Status</RNText>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredDoctors.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="doctor" size={64} color="#D1D5DB" />
            <RNText style={styles.emptyText}>No doctors found</RNText>
            <RNText style={styles.emptySubtext}>Try adjusting your search or filters</RNText>
          </View>
        )}
      </ScrollView>

      {/* Doctor Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <RNText style={styles.modalTitle}>Doctor Details</RNText>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedDoctor && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.detailsHeader}>
                  <View style={[styles.detailsAvatar, { backgroundColor: `${getSpecializationColor(selectedDoctor.specialization)}15` }]}>
                    <MaterialCommunityIcons
                      name="doctor"
                      size={48}
                      color={getSpecializationColor(selectedDoctor.specialization)}
                    />
                  </View>
                  <RNText style={styles.detailsName}>{selectedDoctor.fullName}</RNText>
                  <RNText style={styles.detailsSpecialization}>{selectedDoctor.specialization}</RNText>
                  <View style={styles.ratingContainer}>
                    <MaterialCommunityIcons name="star" size={20} color="#F59E0B" />
                    <RNText style={styles.ratingText}>{selectedDoctor.rating} Rating</RNText>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <RNText style={styles.detailsSectionTitle}>Professional Information</RNText>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>License Number</RNText>
                    <RNText style={styles.detailValue}>{selectedDoctor.licenseNumber}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Qualification</RNText>
                    <RNText style={styles.detailValue}>{selectedDoctor.qualification}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Experience</RNText>
                    <RNText style={styles.detailValue}>{selectedDoctor.experience} years</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Consultation Fee</RNText>
                    <RNText style={[styles.detailValue, styles.feeText]}>${selectedDoctor.consultationFee}</RNText>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <RNText style={styles.detailsSectionTitle}>Contact Information</RNText>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Email</RNText>
                    <RNText style={styles.detailValue}>{selectedDoctor.email}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Phone</RNText>
                    <RNText style={styles.detailValue}>{selectedDoctor.phone}</RNText>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <RNText style={styles.detailsSectionTitle}>Statistics</RNText>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Total Patients</RNText>
                    <RNText style={styles.detailValue}>{selectedDoctor.totalPatients}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Total Appointments</RNText>
                    <RNText style={styles.detailValue}>{selectedDoctor.totalAppointments}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Registration Date</RNText>
                    <RNText style={styles.detailValue}>{selectedDoctor.registrationDate}</RNText>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <RNText style={styles.detailsSectionTitle}>Availability</RNText>
                  <View style={styles.daysContainer}>
                    {selectedDoctor.availableDays.map((day, index) => (
                      <View key={index} style={styles.dayBadge}>
                        <RNText style={styles.dayText}>{day}</RNText>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetailsModal(false)}
              >
                <RNText style={styles.closeButtonText}>Close</RNText>
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
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    alignItems: 'center',
    backgroundColor: '#10B98115',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#1E4BA315',
    borderWidth: 1,
    borderColor: '#1E4BA3',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#1E4BA3',
    fontWeight: '600',
  },
  doctorsList: {
    flex: 1,
  },
  doctorsContent: {
    padding: 16,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  doctorLeft: {
    marginRight: 12,
  },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorContent: {
    flex: 1,
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  specializationBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 8,
  },
  specializationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  doctorMetrics: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  doctorInfo: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  viewButton: {
    backgroundColor: '#3B82F615',
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  statusButton: {
    backgroundColor: '#F59E0B15',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },

  // Modal Styles
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detailsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  detailsAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  detailsName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  detailsSpecialization: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  feeText: {
    color: '#10B981',
    fontWeight: '700',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayBadge: {
    backgroundColor: '#1E4BA315',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E4BA3',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E4BA3',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  closeButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E4BA3',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

