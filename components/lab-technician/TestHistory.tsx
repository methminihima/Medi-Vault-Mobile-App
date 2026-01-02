import { Ionicons } from '@expo/vector-icons';
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

interface TestHistoryItem {
  id: string;
  patientName: string;
  patientNIC: string;
  testName: string;
  testDate: string;
  result: string;
  status: 'normal' | 'abnormal';
  technician: string;
}

export default function TestHistory() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'normal' | 'abnormal'>('all');
  const [testHistory] = React.useState<TestHistoryItem[]>([
    { id: '1', patientName: 'John Doe', patientNIC: '123456789V', testName: 'Complete Blood Count (CBC)', testDate: '2024-12-01', result: 'All values within normal range', status: 'normal', technician: 'Tech A' },
    { id: '2', patientName: 'Jane Smith', patientNIC: '987654321V', testName: 'Urinalysis', testDate: '2024-12-02', result: 'Elevated glucose levels detected', status: 'abnormal', technician: 'Tech B' },
    { id: '3', patientName: 'Sarah Brown', patientNIC: '456789123V', testName: 'Blood Sugar (Fasting)', testDate: '2024-12-02', result: 'Normal glucose levels', status: 'normal', technician: 'Tech A' },
    { id: '4', patientName: 'Mike Johnson', patientNIC: '789123456V', testName: 'Lipid Panel', testDate: '2024-11-30', result: 'High cholesterol levels', status: 'abnormal', technician: 'Tech C' },
    { id: '5', patientName: 'Emily Davis', patientNIC: '321654987V', testName: 'Liver Function Test', testDate: '2024-11-29', result: 'All enzymes within normal range', status: 'normal', technician: 'Tech B' },
  ]);

  const filteredTests = testHistory.filter(test => {
    const matchesSearch = test.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || test.patientNIC.includes(searchQuery) || test.testName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || test.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <ImageBackground source={require('../../assets/images/Background-image.jpg')} style={styles.container} resizeMode="cover">
      <View style={styles.header}>
        <RNText style={styles.headerTitle}>Test History</RNText>
        <RNText style={styles.headerSubtitle}>{testHistory.length} total tests completed</RNText>
      </View>

      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by patient, NIC, or test name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity onPress={() => setFilterStatus('all')} style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}>
            <RNText style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>All</RNText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilterStatus('normal')} style={[styles.filterButton, filterStatus === 'normal' && styles.filterButtonActive]}>
            <RNText style={[styles.filterButtonText, filterStatus === 'normal' && styles.filterButtonTextActive]}>Normal</RNText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilterStatus('abnormal')} style={[styles.filterButton, filterStatus === 'abnormal' && styles.filterButtonActive]}>
            <RNText style={[styles.filterButtonText, filterStatus === 'abnormal' && styles.filterButtonTextActive]}>Abnormal</RNText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.historyList} contentContainerStyle={styles.historyContent}>
        {filteredTests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <RNText style={styles.emptyStateText}>No test history found</RNText>
          </View>
        ) : (
          filteredTests.map(test => (
            <View key={test.id} style={styles.testCard}>
              <View style={[styles.statusBar, { backgroundColor: test.status === 'normal' ? '#10B981' : '#EF4444' }]} />
              <View style={styles.testCardContent}>
                <View style={styles.testCardHeader}>
                  <RNText style={styles.testName}>{test.testName}</RNText>
                  <View style={[styles.statusBadge, { backgroundColor: test.status === 'normal' ? '#D1FAE5' : '#FEE2E2' }]}>
                    <RNText style={[styles.statusBadgeText, { color: test.status === 'normal' ? '#059669' : '#DC2626' }]}>
                      {test.status.toUpperCase()}
                    </RNText>
                  </View>
                </View>

                <View style={styles.patientInfo}>
                  <Ionicons name="person" size={16} color="#6B7280" />
                  <RNText style={styles.patientName}>{test.patientName}</RNText>
                  <RNText style={styles.patientNIC}>(NIC: {test.patientNIC})</RNText>
                </View>

                <View style={styles.resultSection}>
                  <RNText style={styles.resultLabel}>Result:</RNText>
                  <RNText style={styles.resultText}>{test.result}</RNText>
                </View>

                <View style={styles.testCardFooter}>
                  <View style={styles.footerItem}>
                    <Ionicons name="calendar" size={14} color="#6B7280" />
                    <RNText style={styles.footerText}>{test.testDate}</RNText>
                  </View>
                  <View style={styles.footerItem}>
                    <Ionicons name="person-circle" size={14} color="#6B7280" />
                    <RNText style={styles.footerText}>{test.technician}</RNText>
                  </View>
                  <TouchableOpacity style={styles.viewButton}>
                    <RNText style={styles.viewButtonText}>View Details</RNText>
                    <Ionicons name="chevron-forward" size={14} color="#3B82F6" />
                  </TouchableOpacity>
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
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }) },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#6B7280' },
  controls: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 14, color: '#1F2937' },
  filterContainer: { flexDirection: 'row', gap: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6' },
  filterButtonActive: { backgroundColor: '#3B82F6' },
  filterButtonText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  filterButtonTextActive: { color: '#fff' },
  historyList: { flex: 1, backgroundColor: 'transparent' },
  historyContent: { padding: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 16, color: '#9CA3AF', marginTop: 16 },
  testCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 3 } }) },
  statusBar: { width: 4 },
  testCardContent: { flex: 1, padding: 16 },
  testCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  testName: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1F2937', marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  patientInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  patientName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  patientNIC: { fontSize: 12, color: '#6B7280' },
  resultSection: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, marginBottom: 12 },
  resultLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  resultText: { fontSize: 14, color: '#1F2937', lineHeight: 20 },
  testCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, color: '#6B7280' },
  viewButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewButtonText: { fontSize: 12, fontWeight: '600', color: '#3B82F6' },
});

