import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Dimensions,
    Text as RNText,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;

interface Patient {
  id: string;
  name: string;
  nic: string;
  healthId: string;
  age: number;
  gender: string;
  phone: string;
  lastVisit: string;
}

interface DPatientsProps {
  patients: Patient[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchType: 'nic' | 'healthId' | 'name';
  setSearchType: (type: 'nic' | 'healthId' | 'name') => void;
  handleViewPatient: (patient: Patient) => void;
}

export default function DPatients({
  patients,
  searchQuery,
  setSearchQuery,
  searchType,
  setSearchType,
  handleViewPatient,
}: DPatientsProps) {
  const filteredPatients = patients.filter(patient => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    switch (searchType) {
      case 'nic':
        return patient.nic.toLowerCase().includes(query);
      case 'healthId':
        return patient.healthId.toLowerCase().includes(query);
      case 'name':
      default:
        return patient.name.toLowerCase().includes(query);
    }
  });

  return (
    <View style={styles.section}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBarWrapper}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search patients..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {/* Search Type Selector */}
        <View style={styles.searchTypeContainer}>
          {(['name', 'nic', 'healthId'] as const).map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.searchTypeButton, searchType === type && styles.searchTypeButtonActive]}
              onPress={() => setSearchType(type)}
            >
              <RNText style={[
                styles.searchTypeText,
                searchType === type && styles.searchTypeTextActive
              ]}>
                {type === 'name' ? 'Name' : type === 'nic' ? 'NIC' : 'Health ID'}
              </RNText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Patients List */}
      <RNText style={styles.sectionTitle}>Patients ({filteredPatients.length})</RNText>
      {filteredPatients.map(patient => (
        <TouchableOpacity 
          key={patient.id} 
          style={styles.patientCard}
          onPress={() => handleViewPatient(patient)}
        >
          <View style={styles.patientAvatar}>
            <Ionicons name="person" size={24} color="#fff" />
          </View>
          <View style={styles.patientInfo}>
            <RNText style={styles.patientName}>{patient.name}</RNText>
            <RNText style={styles.patientDetails}>
              {patient.age}y • {patient.gender} • NIC: {patient.nic}
            </RNText>
            <RNText style={styles.patientHealthId}>Health ID: {patient.healthId}</RNText>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  searchBar: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 0,
    paddingRight: 44,
    height: 50,
    fontSize: 15,
    color: '#1F2937',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 15,
  },
  searchTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  searchTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    alignItems: 'center',
  },
  searchTypeButtonActive: {
    backgroundColor: '#1E4BA3',
  },
  searchTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  searchTypeTextActive: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E4BA3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  patientHealthId: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

