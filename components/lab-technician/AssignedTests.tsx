import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    ImageBackground,
    Platform,
    Text as RNText,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface LabTest {
  id: string;
  patientName: string;
  patientNIC: string;
  testType: string;
  testName: string;
  orderDate: string;
  status: 'ordered' | 'in_progress';
  priority: 'routine' | 'urgent' | 'stat';
  doctorName: string;
  sampleCollectionDate?: string;
}

export default function AssignedTests() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'routine' | 'urgent' | 'stat'>('all');

  const [tests] = useState<LabTest[]>([
    {
      id: '1',
      patientName: 'John Doe',
      patientNIC: '123456789V',
      testType: 'Blood Test',
      testName: 'Complete Blood Count (CBC)',
      orderDate: '2024-12-03',
      status: 'ordered',
      priority: 'urgent',
      doctorName: 'Dr. Smith',
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      patientNIC: '987654321V',
      testType: 'Urine Test',
      testName: 'Urinalysis',
      orderDate: '2024-12-02',
      sampleCollectionDate: '2024-12-02',
      status: 'in_progress',
      priority: 'routine',
      doctorName: 'Dr. Johnson',
    },
    {
      id: '3',
      patientName: 'Sarah Brown',
      patientNIC: '789123456V',
      testType: 'Blood Test',
      testName: 'Blood Sugar (Fasting)',
      orderDate: '2024-12-03',
      status: 'ordered',
      priority: 'stat',
      doctorName: 'Dr. Davis',
    },
    {
      id: '4',
      patientName: 'Michael Chen',
      patientNIC: '456789123V',
      testType: 'Blood Test',
      testName: 'Lipid Profile',
      orderDate: '2024-12-03',
      status: 'ordered',
      priority: 'routine',
      doctorName: 'Dr. Williams',
    },
    {
      id: '5',
      patientName: 'Emily Davis',
      patientNIC: '321654987V',
      testType: 'Imaging',
      testName: 'Chest X-Ray',
      orderDate: '2024-12-02',
      sampleCollectionDate: '2024-12-02',
      status: 'in_progress',
      priority: 'urgent',
      doctorName: 'Dr. Martinez',
    },
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat': return '#EF4444';
      case 'urgent': return '#F59E0B';
      case 'routine': default: return '#10B981';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return '#1E4BA3';
      case 'ordered': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const handleStartTest = (test: LabTest) => {
    Alert.alert(
      'Start Test',
      `Begin processing ${test.testName} for ${test.patientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => Alert.alert('Success', 'Test started successfully') }
      ]
    );
  };

  const filteredTests = tests.filter(test => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        test.patientName.toLowerCase().includes(query) ||
        test.patientNIC.toLowerCase().includes(query) ||
        test.testName.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    if (filterPriority !== 'all' && test.priority !== filterPriority) return false;
    return true;
  });

  return (
    <ImageBackground
      source={require('../../assets/images/Background-image.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <RNText style={styles.headerTitle}>Assigned Lab Tests</RNText>
          <RNText style={styles.headerSubtitle}>{filteredTests.length} tests assigned</RNText>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <RNText style={styles.statNumber}>{tests.filter(t => t.status === 'ordered').length}</RNText>
            <RNText style={styles.statLabel}>New</RNText>
          </View>
          <View style={[styles.statBadge, { backgroundColor: '#1E4BA315' }]}>
            <RNText style={[styles.statNumber, { color: '#1E4BA3' }]}>{tests.filter(t => t.status === 'in_progress').length}</RNText>
            <RNText style={styles.statLabel}>In Progress</RNText>
          </View>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by patient, NIC, or test..."
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', 'stat', 'urgent', 'routine'].map(priority => (
            <TouchableOpacity
              key={priority}
              style={[styles.filterChip, filterPriority === priority && styles.filterChipActive]}
              onPress={() => setFilterPriority(priority as any)}
            >
              <RNText style={[styles.filterText, filterPriority === priority && styles.filterTextActive]}>
                {priority.toUpperCase()}
              </RNText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tests List */}
      <ScrollView
        style={styles.testsList}
        contentContainerStyle={styles.testsContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredTests.length > 0 ? (
          filteredTests.map(test => (
            <View key={test.id} style={styles.testCard}>
              <View style={[styles.priorityBar, { backgroundColor: getPriorityColor(test.priority) }]} />
              
              <View style={styles.testContent}>
                <View style={styles.testHeader}>
                  <View style={styles.testHeaderLeft}>
                    <RNText style={styles.testName}>{test.testName}</RNText>
                    <View style={styles.badges}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(test.status) }]}>
                        <RNText style={styles.badgeText}>{test.status.replace('_', ' ').toUpperCase()}</RNText>
                      </View>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(test.priority) }]}>
                        <RNText style={styles.badgeText}>{test.priority.toUpperCase()}</RNText>
                      </View>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="test-tube" size={32} color={getPriorityColor(test.priority)} />
                </View>

                <View style={styles.testDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person" size={16} color="#6B7280" />
                    <RNText style={styles.detailText}>{test.patientName}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="card" size={16} color="#6B7280" />
                    <RNText style={styles.detailText}>{test.patientNIC}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="medical" size={16} color="#6B7280" />
                    <RNText style={styles.detailText}>Dr. {test.doctorName}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={16} color="#6B7280" />
                    <RNText style={styles.detailText}>Ordered: {test.orderDate}</RNText>
                  </View>
                  {test.sampleCollectionDate && (
                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={16} color="#6B7280" />
                      <RNText style={styles.detailText}>Sample: {test.sampleCollectionDate}</RNText>
                    </View>
                  )}
                </View>

                <View style={styles.testActions}>
                  {test.status === 'ordered' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.startButton]}
                      onPress={() => handleStartTest(test)}
                    >
                      <MaterialCommunityIcons name="play" size={18} color="#fff" />
                      <RNText style={styles.actionButtonText}>Start Test</RNText>
                    </TouchableOpacity>
                  )}
                  {test.status === 'in_progress' && (
                    <TouchableOpacity style={[styles.actionButton, styles.continueButton]}>
                      <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
                      <RNText style={styles.actionButtonText}>Continue</RNText>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.actionButton, styles.viewButton]}>
                    <Ionicons name="eye" size={18} color="#1E4BA3" />
                    <RNText style={styles.viewButtonText}>View Details</RNText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="test-tube-empty" size={64} color="#9CA3AF" />
            <RNText style={styles.emptyText}>No assigned tests found</RNText>
            <RNText style={styles.emptySubtext}>Try adjusting your filters</RNText>
          </View>
        )}
      </ScrollView>
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
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F59E0B15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1E4BA3',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  testsList: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  testsContent: {
    padding: 16,
  },
  testCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
    }),
  },
  priorityBar: {
    width: 4,
  },
  testContent: {
    flex: 1,
    padding: 16,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  testHeaderLeft: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  testDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  testActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  startButton: {
    backgroundColor: '#10B981',
  },
  continueButton: {
    backgroundColor: '#1E4BA3',
  },
  viewButton: {
    backgroundColor: '#1E4BA315',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E4BA3',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
});

