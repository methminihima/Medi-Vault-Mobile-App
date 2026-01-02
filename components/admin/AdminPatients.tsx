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

interface Patient {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup: string;
  address: string;
  emergencyContact: string;
  registrationDate: string;
  lastVisit: string;
  totalVisits: number;
  status: 'active' | 'inactive';
  medicalConditions?: string[];
}

export default function AdminPatients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [patients, setPatients] = useState<Patient[]>([
    {
      id: '1',
      fullName: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1 234-567-8901',
      dateOfBirth: '1985-03-15',
      gender: 'male',
      bloodGroup: 'O+',
      address: '123 Main St, New York, NY 10001',
      emergencyContact: '+1 234-567-8999',
      registrationDate: '2024-01-15',
      lastVisit: '2024-11-25',
      totalVisits: 12,
      status: 'active',
      medicalConditions: ['Hypertension', 'Type 2 Diabetes']
    },
    {
      id: '2',
      fullName: 'Emma Wilson',
      email: 'emma.wilson@email.com',
      phone: '+1 234-567-8902',
      dateOfBirth: '1990-07-22',
      gender: 'female',
      bloodGroup: 'A+',
      address: '456 Oak Ave, Los Angeles, CA 90001',
      emergencyContact: '+1 234-567-8998',
      registrationDate: '2024-02-10',
      lastVisit: '2024-11-28',
      totalVisits: 8,
      status: 'active',
      medicalConditions: ['Asthma']
    },
    {
      id: '3',
      fullName: 'Michael Brown',
      email: 'michael.brown@email.com',
      phone: '+1 234-567-8903',
      dateOfBirth: '1978-12-05',
      gender: 'male',
      bloodGroup: 'B+',
      address: '789 Pine Rd, Chicago, IL 60601',
      emergencyContact: '+1 234-567-8997',
      registrationDate: '2024-01-20',
      lastVisit: '2024-10-15',
      totalVisits: 15,
      status: 'active',
      medicalConditions: ['High Cholesterol']
    },
    {
      id: '4',
      fullName: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 234-567-8904',
      dateOfBirth: '1995-05-18',
      gender: 'female',
      bloodGroup: 'AB+',
      address: '321 Elm St, Houston, TX 77001',
      emergencyContact: '+1 234-567-8996',
      registrationDate: '2024-03-05',
      lastVisit: '2024-11-30',
      totalVisits: 5,
      status: 'active'
    },
    {
      id: '5',
      fullName: 'David Martinez',
      email: 'david.martinez@email.com',
      phone: '+1 234-567-8905',
      dateOfBirth: '1982-09-30',
      gender: 'male',
      bloodGroup: 'O-',
      address: '654 Maple Dr, Miami, FL 33101',
      emergencyContact: '+1 234-567-8995',
      registrationDate: '2024-02-28',
      lastVisit: '2024-09-10',
      totalVisits: 3,
      status: 'inactive'
    },
    {
      id: '6',
      fullName: 'Lisa Anderson',
      email: 'lisa.anderson@email.com',
      phone: '+1 234-567-8906',
      dateOfBirth: '1988-11-12',
      gender: 'female',
      bloodGroup: 'A-',
      address: '987 Cedar Ln, Seattle, WA 98101',
      emergencyContact: '+1 234-567-8994',
      registrationDate: '2024-04-15',
      lastVisit: '2024-11-29',
      totalVisits: 7,
      status: 'active',
      medicalConditions: ['Migraine', 'Anxiety']
    },
    {
      id: '7',
      fullName: 'Robert Taylor',
      email: 'robert.taylor@email.com',
      phone: '+1 234-567-8907',
      dateOfBirth: '1975-04-08',
      gender: 'male',
      bloodGroup: 'B-',
      address: '147 Birch Ct, Boston, MA 02101',
      emergencyContact: '+1 234-567-8993',
      registrationDate: '2024-01-08',
      lastVisit: '2024-11-20',
      totalVisits: 20,
      status: 'active',
      medicalConditions: ['Arthritis', 'Heart Disease']
    },
    {
      id: '8',
      fullName: 'Jennifer White',
      email: 'jennifer.white@email.com',
      phone: '+1 234-567-8908',
      dateOfBirth: '1992-06-25',
      gender: 'female',
      bloodGroup: 'AB-',
      address: '258 Willow Way, Denver, CO 80201',
      emergencyContact: '+1 234-567-8992',
      registrationDate: '2024-05-20',
      lastVisit: '2024-08-15',
      totalVisits: 2,
      status: 'inactive'
    }
  ]);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      searchQuery === '' ||
      patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery) ||
      patient.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const viewPatientDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const togglePatientStatus = (patient: Patient) => {
    const newStatus: Patient['status'] = patient.status === 'active' ? 'inactive' : 'active';
    const updatedPatients = patients.map(p => 
      p.id === patient.id ? { ...p, status: newStatus } : p
    );
    setPatients(updatedPatients);
    Alert.alert('Success', `Patient ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male': return 'gender-male';
      case 'female': return 'gender-female';
      default: return 'gender-male-female';
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'male': return '#3B82F6';
      case 'female': return '#EC4899';
      default: return '#8B5CF6';
    }
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
          <RNText style={styles.headerTitle}>Patient Records</RNText>
          <View style={styles.statsContainer}>
            <View style={styles.statBadge}>
              <RNText style={styles.statNumber}>{patients.filter(p => p.status === 'active').length}</RNText>
              <RNText style={styles.statLabel}>Active</RNText>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, phone, or blood group..."
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
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
            onPress={() => setFilterStatus('all')}
          >
            <RNText style={[styles.filterChipText, filterStatus === 'all' && styles.filterChipTextActive]}>
              All Patients
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
            style={[styles.filterChip, filterStatus === 'inactive' && styles.filterChipActive]}
            onPress={() => setFilterStatus('inactive')}
          >
            <RNText style={[styles.filterChipText, filterStatus === 'inactive' && styles.filterChipTextActive]}>
              Inactive
            </RNText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Patients List */}
      <ScrollView
        style={styles.patientsList}
        contentContainerStyle={styles.patientsContent}
        showsVerticalScrollIndicator={false}
      >
        <RNText style={styles.resultCount}>
          {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
        </RNText>

        {filteredPatients.map((patient) => (
          <TouchableOpacity 
            key={patient.id} 
            style={styles.patientCard}
            onPress={() => viewPatientDetails(patient)}
            activeOpacity={0.7}
          >
            <View style={styles.patientLeft}>
              <View style={[styles.patientAvatar, { backgroundColor: `${getGenderColor(patient.gender)}15` }]}>
                <MaterialCommunityIcons
                  name={getGenderIcon(patient.gender) as any}
                  size={28}
                  color={getGenderColor(patient.gender)}
                />
              </View>
            </View>

            <View style={styles.patientContent}>
              <View style={styles.patientHeader}>
                <RNText style={styles.patientName}>{patient.fullName}</RNText>
                <View style={[styles.statusBadge, { backgroundColor: patient.status === 'active' ? '#10B98115' : '#6B728015' }]}>
                  <View style={[styles.statusDot, { backgroundColor: patient.status === 'active' ? '#10B981' : '#6B7280' }]} />
                  <RNText style={[styles.statusText, { color: patient.status === 'active' ? '#10B981' : '#6B7280' }]}>
                    {patient.status}
                  </RNText>
                </View>
              </View>

              <View style={styles.patientMetrics}>
                <View style={styles.metricItem}>
                  <MaterialCommunityIcons name="calendar" size={14} color="#6B7280" />
                  <RNText style={styles.metricText}>{calculateAge(patient.dateOfBirth)} years</RNText>
                </View>
                <View style={styles.metricItem}>
                  <MaterialCommunityIcons name="water" size={14} color="#EF4444" />
                  <RNText style={styles.metricText}>{patient.bloodGroup}</RNText>
                </View>
                <View style={styles.metricItem}>
                  <MaterialCommunityIcons name="hospital-building" size={14} color="#6B7280" />
                  <RNText style={styles.metricText}>{patient.totalVisits} visits</RNText>
                </View>
              </View>

              <View style={styles.patientInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={14} color="#6B7280" />
                  <RNText style={styles.infoText}>{patient.email}</RNText>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={14} color="#6B7280" />
                  <RNText style={styles.infoText}>{patient.phone}</RNText>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <RNText style={styles.infoText}>Last visit: {patient.lastVisit}</RNText>
                </View>
              </View>

              {patient.medicalConditions && patient.medicalConditions.length > 0 && (
                <View style={styles.conditionsContainer}>
                  {patient.medicalConditions.map((condition, index) => (
                    <View key={index} style={styles.conditionBadge}>
                      <RNText style={styles.conditionText}>{condition}</RNText>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.viewButton]}
                  onPress={() => viewPatientDetails(patient)}
                >
                  <Ionicons name="eye-outline" size={16} color="#3B82F6" />
                  <RNText style={styles.viewButtonText}>View Details</RNText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.toggleButton]}
                  onPress={() => togglePatientStatus(patient)}
                >
                  <Ionicons
                    name={patient.status === 'active' ? 'pause-outline' : 'play-outline'}
                    size={16}
                    color="#F59E0B"
                  />
                  <RNText style={styles.toggleButtonText}>
                    {patient.status === 'active' ? 'Deactivate' : 'Activate'}
                  </RNText>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredPatients.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-search" size={64} color="#D1D5DB" />
            <RNText style={styles.emptyText}>No patients found</RNText>
            <RNText style={styles.emptySubtext}>Try adjusting your search or filters</RNText>
          </View>
        )}
      </ScrollView>

      {/* Patient Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <RNText style={styles.modalTitle}>Patient Details</RNText>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedPatient && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.detailsHeader}>
                  <View style={[styles.detailsAvatar, { backgroundColor: `${getGenderColor(selectedPatient.gender)}15` }]}>
                    <MaterialCommunityIcons
                      name={getGenderIcon(selectedPatient.gender) as any}
                      size={48}
                      color={getGenderColor(selectedPatient.gender)}
                    />
                  </View>
                  <RNText style={styles.detailsName}>{selectedPatient.fullName}</RNText>
                  <RNText style={styles.detailsAge}>{calculateAge(selectedPatient.dateOfBirth)} years old</RNText>
                </View>

                <View style={styles.detailsSection}>
                  <RNText style={styles.detailsSectionTitle}>Personal Information</RNText>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Date of Birth</RNText>
                    <RNText style={styles.detailValue}>{selectedPatient.dateOfBirth}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Gender</RNText>
                    <RNText style={styles.detailValue}>{selectedPatient.gender.charAt(0).toUpperCase() + selectedPatient.gender.slice(1)}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Blood Group</RNText>
                    <RNText style={[styles.detailValue, styles.bloodGroup]}>{selectedPatient.bloodGroup}</RNText>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <RNText style={styles.detailsSectionTitle}>Contact Information</RNText>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Email</RNText>
                    <RNText style={styles.detailValue}>{selectedPatient.email}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Phone</RNText>
                    <RNText style={styles.detailValue}>{selectedPatient.phone}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Address</RNText>
                    <RNText style={styles.detailValue}>{selectedPatient.address}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Emergency Contact</RNText>
                    <RNText style={styles.detailValue}>{selectedPatient.emergencyContact}</RNText>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <RNText style={styles.detailsSectionTitle}>Medical History</RNText>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Registration Date</RNText>
                    <RNText style={styles.detailValue}>{selectedPatient.registrationDate}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Last Visit</RNText>
                    <RNText style={styles.detailValue}>{selectedPatient.lastVisit}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Total Visits</RNText>
                    <RNText style={styles.detailValue}>{selectedPatient.totalVisits}</RNText>
                  </View>
                  {selectedPatient.medicalConditions && selectedPatient.medicalConditions.length > 0 && (
                    <View style={styles.detailRow}>
                      <RNText style={styles.detailLabel}>Medical Conditions</RNText>
                      <View style={styles.conditionsListContainer}>
                        {selectedPatient.medicalConditions.map((condition, index) => (
                          <View key={index} style={styles.conditionBadgeLarge}>
                            <RNText style={styles.conditionTextLarge}>{condition}</RNText>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
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
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: '#1E4BA315',
    borderWidth: 1,
    borderColor: '#1E4BA3',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#1E4BA3',
    fontWeight: '600',
  },
  patientsList: {
    flex: 1,
  },
  patientsContent: {
    padding: 16,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  patientCard: {
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
  patientLeft: {
    marginRight: 12,
  },
  patientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientContent: {
    flex: 1,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
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
    textTransform: 'capitalize',
  },
  patientMetrics: {
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
  patientInfo: {
    gap: 6,
    marginBottom: 8,
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
  conditionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  conditionBadge: {
    backgroundColor: '#EF444415',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
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
  toggleButton: {
    backgroundColor: '#F59E0B15',
  },
  toggleButtonText: {
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
  detailsAge: {
    fontSize: 14,
    color: '#6B7280',
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
  bloodGroup: {
    color: '#EF4444',
    fontWeight: '700',
  },
  conditionsListContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
  },
  conditionBadgeLarge: {
    backgroundColor: '#EF444415',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  conditionTextLarge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
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

