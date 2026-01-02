import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
    ImageBackground,
    Platform,
    Text as RNText,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface DispensedRecord {
  id: string;
  prescriptionCode: string;
  patientName: string;
  patientNIC: string;
  doctorName: string;
  medications: Array<{
    name: string;
    quantity: number;
    batchNumber: string;
  }>;
  dispensedDate: string;
  dispensedTime: string;
  pharmacistName: string;
  totalAmount: number;
}

export default function DispensingHistory() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterPeriod, setFilterPeriod] = React.useState<'today' | 'week' | 'month' | 'all'>('today');

  const [dispensingRecords] = React.useState<DispensedRecord[]>([
    {
      id: '1',
      prescriptionCode: 'RX-2025-001',
      patientName: 'John Doe',
      patientNIC: '199512345678',
      doctorName: 'Dr. Sarah Johnson',
      medications: [
        { name: 'Amoxicillin 500mg', quantity: 21, batchNumber: 'BT2025001' },
        { name: 'Paracetamol 500mg', quantity: 10, batchNumber: 'BT2025045' }
      ],
      dispensedDate: '2024-12-03',
      dispensedTime: '10:30 AM',
      pharmacistName: 'Pharmacist A',
      totalAmount: 1250.00
    },
    {
      id: '2',
      prescriptionCode: 'RX-2025-002',
      patientName: 'Jane Smith',
      patientNIC: '199823456789',
      doctorName: 'Dr. Mike Wilson',
      medications: [
        { name: 'Metformin 850mg', quantity: 60, batchNumber: 'BT2025023' }
      ],
      dispensedDate: '2024-12-03',
      dispensedTime: '11:15 AM',
      pharmacistName: 'Pharmacist B',
      totalAmount: 1920.00
    },
    {
      id: '3',
      prescriptionCode: 'RX-2025-003',
      patientName: 'Michael Brown',
      patientNIC: '199734567890',
      doctorName: 'Dr. Emily Davis',
      medications: [
        { name: 'Aspirin 100mg', quantity: 30, batchNumber: 'BT2025067' },
        { name: 'Atorvastatin 20mg', quantity: 30, batchNumber: 'BT2025089' }
      ],
      dispensedDate: '2024-12-02',
      dispensedTime: '02:45 PM',
      pharmacistName: 'Pharmacist A',
      totalAmount: 2150.00
    },
    {
      id: '4',
      prescriptionCode: 'RX-2025-004',
      patientName: 'Sarah Williams',
      patientNIC: '199645678901',
      doctorName: 'Dr. David Martinez',
      medications: [
        { name: 'Omeprazole 20mg', quantity: 14, batchNumber: 'BT2025034' }
      ],
      dispensedDate: '2024-12-02',
      dispensedTime: '09:20 AM',
      pharmacistName: 'Pharmacist C',
      totalAmount: 680.00
    },
    {
      id: '5',
      prescriptionCode: 'RX-2025-005',
      patientName: 'Robert Johnson',
      patientNIC: '199556789012',
      doctorName: 'Dr. Lisa Anderson',
      medications: [
        { name: 'Lisinopril 10mg', quantity: 30, batchNumber: 'BT2025056' },
        { name: 'Amlodipine 5mg', quantity: 30, batchNumber: 'BT2025078' }
      ],
      dispensedDate: '2024-12-01',
      dispensedTime: '03:30 PM',
      pharmacistName: 'Pharmacist B',
      totalAmount: 1800.00
    }
  ]);

  const filteredRecords = dispensingRecords.filter(record => {
    const matchesSearch = 
      record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.patientNIC.includes(searchQuery) ||
      record.prescriptionCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by date period
    const recordDate = new Date(record.dispensedDate);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let matchesPeriod = true;
    if (filterPeriod === 'today') matchesPeriod = diffDays === 0;
    else if (filterPeriod === 'week') matchesPeriod = diffDays <= 7;
    else if (filterPeriod === 'month') matchesPeriod = diffDays <= 30;
    
    return matchesSearch && matchesPeriod;
  });

  const totalDispensed = filteredRecords.length;
  const totalRevenue = filteredRecords.reduce((sum, record) => sum + record.totalAmount, 0);

  return (
    <ImageBackground 
      source={require('../../assets/images/Background-image.jpg')} 
      style={styles.container} 
      resizeMode="cover"
    >
      {/* Header */}
      <View style={styles.header}>
        <RNText style={styles.headerTitle}>Dispensing History</RNText>
        <RNText style={styles.headerSubtitle}>Complete record of dispensed prescriptions</RNText>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="clipboard-check" size={24} color="#10B981" />
          <RNText style={styles.summaryValue}>{totalDispensed}</RNText>
          <RNText style={styles.summaryLabel}>Dispensed</RNText>
        </View>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="cash" size={24} color="#3B82F6" />
          <RNText style={styles.summaryValue}>Rs. {totalRevenue.toFixed(2)}</RNText>
          <RNText style={styles.summaryLabel}>Total Revenue</RNText>
        </View>
      </View>

      {/* Search & Filters */}
      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by patient, NIC, or prescription code..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.filterContainer}>
          {['today', 'week', 'month', 'all'].map(period => (
            <TouchableOpacity
              key={period}
              onPress={() => setFilterPeriod(period as any)}
              style={[styles.filterButton, filterPeriod === period && styles.filterButtonActive]}
            >
              <RNText style={[styles.filterButtonText, filterPeriod === period && styles.filterButtonTextActive]}>
                {period.toUpperCase()}
              </RNText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Records List */}
      <ScrollView style={styles.recordsList} contentContainerStyle={styles.recordsContent}>
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-text-off" size={64} color="#D1D5DB" />
            <RNText style={styles.emptyStateText}>No dispensing records found</RNText>
          </View>
        ) : (
          filteredRecords.map(record => (
            <View key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={styles.recordHeaderLeft}>
                  <RNText style={styles.prescriptionCode}>{record.prescriptionCode}</RNText>
                  <View style={styles.statusBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <RNText style={styles.statusText}>DISPENSED</RNText>
                  </View>
                </View>
                <RNText style={styles.amount}>Rs. {record.totalAmount.toFixed(2)}</RNText>
              </View>

              <View style={styles.recordBody}>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={16} color="#6B7280" />
                  <RNText style={styles.infoText}>{record.patientName}</RNText>
                  <RNText style={styles.infoSubtext}>({record.patientNIC})</RNText>
                </View>

                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="doctor" size={16} color="#6B7280" />
                  <RNText style={styles.infoText}>{record.doctorName}</RNText>
                </View>

                <View style={styles.medicationsList}>
                  <RNText style={styles.medicationsLabel}>Medications:</RNText>
                  {record.medications.map((med, index) => (
                    <View key={index} style={styles.medicationItem}>
                      <MaterialCommunityIcons name="pill" size={14} color="#3B82F6" />
                      <RNText style={styles.medicationText}>
                        {med.name} × {med.quantity} (Batch: {med.batchNumber})
                      </RNText>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.recordFooter}>
                <View style={styles.footerItem}>
                  <Ionicons name="calendar" size={14} color="#6B7280" />
                  <RNText style={styles.footerText}>{record.dispensedDate}</RNText>
                </View>
                <View style={styles.footerItem}>
                  <Ionicons name="time" size={14} color="#6B7280" />
                  <RNText style={styles.footerText}>{record.dispensedTime}</RNText>
                </View>
                <View style={styles.footerItem}>
                  <MaterialCommunityIcons name="account" size={14} color="#6B7280" />
                  <RNText style={styles.footerText}>{record.pharmacistName}</RNText>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 }
    })
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#6B7280' },
  summaryContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)'
  },
  summaryCard: { 
    flex: 1, 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 }
    })
  },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginTop: 8, marginBottom: 4 },
  summaryLabel: { fontSize: 12, color: '#6B7280' },
  controls: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 14, color: '#1F2937' },
  filterContainer: { flexDirection: 'row', gap: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6' },
  filterButtonActive: { backgroundColor: '#10B981' },
  filterButtonText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  filterButtonTextActive: { color: '#fff' },
  recordsList: { flex: 1, backgroundColor: 'transparent' },
  recordsContent: { padding: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 16, color: '#9CA3AF', marginTop: 16 },
  recordCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 }
    })
  },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  recordHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  prescriptionCode: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#059669' },
  amount: { fontSize: 18, fontWeight: '700', color: '#10B981' },
  recordBody: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  infoSubtext: { fontSize: 12, color: '#6B7280' },
  medicationsList: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, marginTop: 8 },
  medicationsLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  medicationItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  medicationText: { fontSize: 13, color: '#374151' },
  recordFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: '#6B7280' },
});

