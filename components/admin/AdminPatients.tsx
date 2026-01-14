import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    RefreshControl,
    Text as RNText,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { API_BASE_URL } from '@config/constants';

type PatientStatus = 'active' | 'inactive';

interface PatientRegistryRow {
  patientId: string | null;
  userId: string;
  fullName: string;
  email: string;
  username?: string;
  isActive: boolean;
  createdAt?: string;

  nic?: string | null;
  healthId?: string | null;
  rfid?: string | null;
  rfidMasked?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  contactInfo?: string | null;
  address?: string | null;
  bloodType?: string | null;
  allergies?: string | null;
}

function safeText(v: any): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

function normalizeStatus(isActive: boolean): PatientStatus {
  return isActive ? 'active' : 'inactive';
}

function toCsvRow(fields: string[]): string {
  return fields
    .map((f) => {
      const s = safeText(f);
      const escaped = s.replace(/\"/g, '""');
      return `"${escaped}"`;
    })
    .join(',');
}

export default function AdminPatients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRegistryRow | null>(null);

  const [patients, setPatients] = useState<PatientRegistryRow[]>([]);
  const [stats, setStats] = useState<{ total: number; active: number; inactive: number }>(
    { total: 0, active: 0, inactive: 0 }
  );
  const [refreshing, setRefreshing] = useState(false);

  const fetchRegistry = async () => {
    const qs = new URLSearchParams();
    if (searchQuery.trim()) qs.set('q', searchQuery.trim());
    if (filterStatus && filterStatus !== 'all') qs.set('status', filterStatus);

    const url = `${API_BASE_URL}/patients/registry${qs.toString() ? `?${qs.toString()}` : ''}`;
    const resp = await fetch(url);
    const json = await resp.json();

    if (!resp.ok || !json?.success) {
      throw new Error(json?.message || 'Failed to load patients');
    }

    setPatients(Array.isArray(json.data) ? json.data : []);
    if (json.stats) {
      setStats({
        total: Number(json.stats.total || 0),
        active: Number(json.stats.active || 0),
        inactive: Number(json.stats.inactive || 0),
      });
    }
  };

  React.useEffect(() => {
    fetchRegistry().catch((e) => {
      console.error(e);
      Alert.alert('Error', e?.message || 'Failed to load patients');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      fetchRegistry().catch((e) => {
        console.error(e);
      });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchRegistry();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const filteredPatients = patients;

  const calculateAge = (dateOfBirth?: string | null) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) return null;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const viewPatientDetails = (patient: PatientRegistryRow) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const togglePatientStatus = async (patient: PatientRegistryRow) => {
    const nextActive = !patient.isActive;
    try {
      const resp = await fetch(`${API_BASE_URL}/users/${patient.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const json = await resp.json();
      if (!resp.ok || !json?.success) {
        throw new Error(json?.message || 'Failed to update status');
      }
      Alert.alert('Success', `Patient ${nextActive ? 'activated' : 'deactivated'} successfully`);
      await fetchRegistry();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update status');
    }
  };

  const exportCsv = async () => {
    const header = toCsvRow([
      'Full Name',
      'Email',
      'NIC',
      'Contact',
      'DOB',
      'Gender',
      'Blood Type',
      'RFID',
      'Status',
      'Created At',
    ]);

    const rows = filteredPatients.map((p) =>
      toCsvRow([
        p.fullName,
        p.email,
        safeText(p.nic || ''),
        safeText(p.contactInfo || ''),
        safeText(p.dateOfBirth || ''),
        safeText(p.gender || ''),
        safeText(p.bloodType || ''),
        safeText(p.rfidMasked || p.rfid || ''),
        normalizeStatus(p.isActive),
        safeText(p.createdAt || ''),
      ])
    );

    const csv = [header, ...rows].join('\n');

    Alert.alert('Patients CSV', csv);
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Title */}
        <View style={styles.titleBlock}>
          <RNText style={styles.pageTitle}>Patient Records</RNText>
          <RNText style={styles.pageSubtitle}>Manage patient profiles and registry data</RNText>
        </View>

        {/* Summary cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <RNText style={styles.statLabel}>Total Patients</RNText>
            <RNText style={styles.statValue}>{stats.total}</RNText>
          </View>
          <View style={styles.statCard}>
            <RNText style={styles.statLabel}>Active</RNText>
            <RNText style={[styles.statValue, { color: '#10B981' }]}>{stats.active}</RNText>
          </View>
          <View style={styles.statCard}>
            <RNText style={styles.statLabel}>Inactive</RNText>
            <RNText style={[styles.statValue, { color: '#6B7280' }]}>{stats.inactive}</RNText>
          </View>
        </View>

        {/* List header */}
        <View style={styles.listHeader}>
          <View>
            <RNText style={styles.listTitle}>All Patients</RNText>
            <RNText style={styles.listSubtitle}>{filteredPatients.length} record(s)</RNText>
          </View>
          <TouchableOpacity style={styles.exportButton} onPress={exportCsv}>
            <Ionicons name="download-outline" size={18} color="#111827" />
            <RNText style={styles.exportText}>Export CSV</RNText>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filtersRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email, NIC, RFID, or contact..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.filtersContainer}>
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
              style={[styles.filterChip, filterStatus === 'inactive' && styles.filterChipActive]}
              onPress={() => setFilterStatus('inactive')}
            >
              <RNText style={[styles.filterChipText, filterStatus === 'inactive' && styles.filterChipTextActive]}>
                Inactive
              </RNText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <RNText style={[styles.th, styles.colPatient]}>Patient</RNText>
              <RNText style={[styles.th, styles.colNic]}>NIC</RNText>
              <RNText style={[styles.th, styles.colContact]}>Contact</RNText>
              <RNText style={[styles.th, styles.colDob]}>DOB</RNText>
              <RNText style={[styles.th, styles.colBlood]}>Blood</RNText>
              <RNText style={[styles.th, styles.colRfid]}>RFID</RNText>
              <RNText style={[styles.th, styles.colStatus]}>Status</RNText>
              <RNText style={[styles.th, styles.colActions]}>Actions</RNText>
            </View>

            {filteredPatients.map((p) => {
              const statusNorm = normalizeStatus(p.isActive);
              const statusBg = statusNorm === 'active' ? '#D1FAE5' : '#E5E7EB';
              const statusFg = statusNorm === 'active' ? '#10B981' : '#6B7280';
              const age = calculateAge(p.dateOfBirth);

              return (
                <View key={p.userId} style={styles.tableRow}>
                  <View style={[styles.td, styles.colPatient]}>
                    <RNText style={styles.cellMain}>{p.fullName || '—'}</RNText>
                    <RNText style={styles.cellSub}>{p.email || '—'}</RNText>
                  </View>
                  <View style={[styles.td, styles.colNic]}>
                    <RNText style={styles.cellMain}>{safeText(p.nic) || '—'}</RNText>
                  </View>
                  <View style={[styles.td, styles.colContact]}>
                    <RNText style={styles.cellMain}>{safeText(p.contactInfo) || '—'}</RNText>
                  </View>
                  <View style={[styles.td, styles.colDob]}>
                    <RNText style={styles.cellMain}>{safeText(p.dateOfBirth) || '—'}</RNText>
                    <RNText style={styles.cellSub}>{age !== null ? `${age} yrs` : '—'}</RNText>
                  </View>
                  <View style={[styles.td, styles.colBlood]}>
                    <View style={styles.pill}>
                      <RNText style={styles.pillText}>{safeText(p.bloodType) || '—'}</RNText>
                    </View>
                  </View>
                  <View style={[styles.td, styles.colRfid]}>
                    <RNText style={styles.cellMain}>{safeText(p.rfidMasked || p.rfid) || '—'}</RNText>
                  </View>
                  <View style={[styles.td, styles.colStatus]}>
                    <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                      <RNText style={[styles.statusPillText, { color: statusFg }]}>
                        {statusNorm.charAt(0).toUpperCase() + statusNorm.slice(1)}
                      </RNText>
                    </View>
                  </View>
                  <View style={[styles.td, styles.colActions]}>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => viewPatientDetails(p)}>
                      <Ionicons name="eye-outline" size={18} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => togglePatientStatus(p)}>
                      <Ionicons
                        name={p.isActive ? 'pause-outline' : 'play-outline'}
                        size={18}
                        color="#F59E0B"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {filteredPatients.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-search" size={64} color="#D1D5DB" />
            <RNText style={styles.emptyText}>No patients found</RNText>
            <RNText style={styles.emptySubtext}>Try adjusting your search or filters</RNText>
          </View>
        )}

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
                  <View style={[styles.detailsAvatar, { backgroundColor: `${getGenderColor(selectedPatient.gender || 'other')}15` }]}>
                    <MaterialCommunityIcons
                      name={getGenderIcon(selectedPatient.gender || 'other') as any}
                      size={48}
                      color={getGenderColor(selectedPatient.gender || 'other')}
                    />
                  </View>
                  <RNText style={styles.detailsName}>{selectedPatient.fullName}</RNText>
                  <RNText style={styles.detailsAge}>
                    {calculateAge(selectedPatient.dateOfBirth) !== null
                      ? `${calculateAge(selectedPatient.dateOfBirth)} years old`
                      : '—'}
                  </RNText>
                </View>

                <View style={styles.detailsSection}>
                  <RNText style={styles.detailsSectionTitle}>Personal Information</RNText>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Date of Birth</RNText>
                    <RNText style={styles.detailValue}>{safeText(selectedPatient.dateOfBirth) || '—'}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Gender</RNText>
                    <RNText style={styles.detailValue}>
                      {safeText(selectedPatient.gender)
                        ? safeText(selectedPatient.gender).charAt(0).toUpperCase() + safeText(selectedPatient.gender).slice(1)
                        : '—'}
                    </RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Blood Type</RNText>
                    <RNText style={[styles.detailValue, styles.bloodGroup]}>{safeText(selectedPatient.bloodType) || '—'}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>NIC</RNText>
                    <RNText style={styles.detailValue}>{safeText(selectedPatient.nic) || '—'}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Health ID</RNText>
                    <RNText style={styles.detailValue}>{safeText(selectedPatient.healthId) || '—'}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>RFID</RNText>
                    <RNText style={styles.detailValue}>{safeText(selectedPatient.rfidMasked || selectedPatient.rfid) || '—'}</RNText>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <RNText style={styles.detailsSectionTitle}>Contact Information</RNText>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Email</RNText>
                    <RNText style={styles.detailValue}>{selectedPatient.email}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Contact</RNText>
                    <RNText style={styles.detailValue}>{safeText(selectedPatient.contactInfo) || '—'}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Address</RNText>
                    <RNText style={styles.detailValue}>{safeText(selectedPatient.address) || '—'}</RNText>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <RNText style={styles.detailsSectionTitle}>Medical History</RNText>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Registered</RNText>
                    <RNText style={styles.detailValue}>{safeText(selectedPatient.createdAt) || '—'}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Blood Type</RNText>
                    <RNText style={styles.detailValue}>{safeText(selectedPatient.bloodType) || '—'}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Allergies</RNText>
                    <RNText style={styles.detailValue}>{safeText(selectedPatient.allergies) || '—'}</RNText>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  titleBlock: {
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  pageSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    minWidth: 140,
    flexGrow: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  statValue: {
    marginTop: 6,
    fontSize: 20,
    color: '#111827',
    fontWeight: '800',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  listSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exportText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
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
  table: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 920,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  th: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  td: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  cellMain: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  cellSub: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3730A3',
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  colPatient: { width: 260 },
  colNic: { width: 140 },
  colContact: { width: 180 },
  colDob: { width: 140 },
  colBlood: { width: 110 },
  colRfid: { width: 140 },
  colStatus: { width: 130 },
  colActions: { width: 140, flexDirection: 'row' },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  emptySubtext: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
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

