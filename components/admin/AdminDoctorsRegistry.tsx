import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
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
    View,
} from 'react-native';

import { API_BASE_URL } from '@config/constants';

type DoctorStatus = 'active' | 'inactive';

interface DoctorRegistryRow {
  doctorId: string | null;
  userId: string;
  fullName: string;
  email: string;
  username?: string;
  isActive: boolean;
  createdAt?: string;

  specialization?: string | null;
  licenseNumber?: string | null;
  qualifications?: string | null;
  experience?: number | null;
  consultationFee?: number | string | null;
  availableDays?: string | null;
}

function safeText(v: any): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

function normalizeStatus(isActive: boolean): DoctorStatus {
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

export default function AdminDoctorsRegistry() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorRegistryRow | null>(null);

  const [doctors, setDoctors] = useState<DoctorRegistryRow[]>([]);
  const [stats, setStats] = useState<{ total: number; active: number; inactive: number }>(
    { total: 0, active: 0, inactive: 0 }
  );
  const [refreshing, setRefreshing] = useState(false);

  const specializations = useMemo(() => {
    const uniq = Array.from(
      new Set(
        doctors
          .map((d) => safeText(d.specialization).trim())
          .filter((s) => s && s.toLowerCase() !== 'null')
      )
    ).sort((a, b) => a.localeCompare(b));

    return ['all', ...uniq];
  }, [doctors]);

  const [filterSpecialization, setFilterSpecialization] = useState<string>('all');

  const fetchRegistry = async () => {
    const qs = new URLSearchParams();
    if (searchQuery.trim()) qs.set('q', searchQuery.trim());
    if (filterStatus && filterStatus !== 'all') qs.set('status', filterStatus);
    if (filterSpecialization && filterSpecialization !== 'all') qs.set('specialization', filterSpecialization);

    const url = `${API_BASE_URL}/doctors/registry${qs.toString() ? `?${qs.toString()}` : ''}`;
    const resp = await fetch(url);
    const json = await resp.json();

    if (!resp.ok || !json?.success) {
      throw new Error(json?.message || 'Failed to load doctors');
    }

    setDoctors(Array.isArray(json.data) ? json.data : []);
    if (json.stats) {
      setStats({
        total: Number(json.stats.total || 0),
        active: Number(json.stats.active || 0),
        inactive: Number(json.stats.inactive || 0),
      });
    }
  };

  useEffect(() => {
    fetchRegistry().catch((e) => {
      console.error(e);
      Alert.alert('Error', e?.message || 'Failed to load doctors');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterSpecialization]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchRegistry().catch(() => {});
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

  const viewDoctorDetails = (doctor: DoctorRegistryRow) => {
    setSelectedDoctor(doctor);
    setShowDetailsModal(true);
  };

  const toggleDoctorStatus = async (doctor: DoctorRegistryRow) => {
    const nextActive = !doctor.isActive;
    try {
      const resp = await fetch(`${API_BASE_URL}/users/${doctor.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const json = await resp.json();
      if (!resp.ok || !json?.success) {
        throw new Error(json?.message || 'Failed to update status');
      }
      Alert.alert('Success', `Doctor ${nextActive ? 'activated' : 'deactivated'} successfully`);
      await fetchRegistry();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update status');
    }
  };

  const exportCsv = async () => {
    const header = toCsvRow([
      'Full Name',
      'Email',
      'Specialization',
      'License Number',
      'Experience',
      'Consultation Fee',
      'Available Days',
      'Status',
      'Created At',
    ]);

    const rows = doctors.map((d) =>
      toCsvRow([
        safeText(d.fullName),
        safeText(d.email),
        safeText(d.specialization || ''),
        safeText(d.licenseNumber || ''),
        safeText(d.experience ?? ''),
        safeText(d.consultationFee ?? ''),
        safeText(d.availableDays ?? ''),
        normalizeStatus(d.isActive),
        safeText(d.createdAt || ''),
      ])
    );

    const csv = [header, ...rows].join('\n');
    Alert.alert('Doctors CSV', csv);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.titleBlock}>
        <RNText style={styles.pageTitle}>Doctor Records</RNText>
        <RNText style={styles.pageSubtitle}>Manage doctor profiles and registry data</RNText>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <RNText style={styles.statLabel}>Total Doctors</RNText>
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

      <View style={styles.listHeader}>
        <View>
          <RNText style={styles.listTitle}>All Doctors</RNText>
          <RNText style={styles.listSubtitle}>{doctors.length} record(s)</RNText>
        </View>
        <TouchableOpacity style={styles.exportButton} onPress={exportCsv}>
          <Ionicons name="download-outline" size={18} color="#111827" />
          <RNText style={styles.exportText}>Export CSV</RNText>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, license, specialization..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {['all', 'active', 'inactive'].map((k) => (
            <TouchableOpacity
              key={k}
              style={[styles.filterChip, filterStatus === k && styles.filterChipActive]}
              onPress={() => setFilterStatus(k)}
            >
              <RNText style={[styles.filterChipText, filterStatus === k && styles.filterChipTextActive]}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </RNText>
            </TouchableOpacity>
          ))}

          {specializations.length > 1 && (
            <View style={styles.chipsDivider} />
          )}

          {specializations.map((s) => (
            <TouchableOpacity
              key={`spec-${s}`}
              style={[styles.filterChip, filterSpecialization === s && styles.filterChipActive]}
              onPress={() => setFilterSpecialization(s)}
            >
              <RNText style={[styles.filterChipText, filterSpecialization === s && styles.filterChipTextActive]}>
                {s === 'all' ? 'All Specializations' : s}
              </RNText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <RNText style={[styles.th, styles.colDoctor]}>Doctor</RNText>
            <RNText style={[styles.th, styles.colSpec]}>Specialization</RNText>
            <RNText style={[styles.th, styles.colLicense]}>License</RNText>
            <RNText style={[styles.th, styles.colExp]}>Experience</RNText>
            <RNText style={[styles.th, styles.colFee]}>Fee</RNText>
            <RNText style={[styles.th, styles.colDays]}>Days</RNText>
            <RNText style={[styles.th, styles.colStatus]}>Status</RNText>
            <RNText style={[styles.th, styles.colActions]}>Actions</RNText>
          </View>

          {doctors.map((d) => {
            const statusNorm = normalizeStatus(d.isActive);
            const statusBg = statusNorm === 'active' ? '#D1FAE5' : '#E5E7EB';
            const statusFg = statusNorm === 'active' ? '#10B981' : '#6B7280';

            const feeText = safeText(d.consultationFee);
            const experienceText = d.experience === null || d.experience === undefined ? '' : `${d.experience} yrs`;

            return (
              <View key={d.userId} style={styles.tableRow}>
                <View style={[styles.td, styles.colDoctor]}>
                  <RNText style={styles.cellMain}>{d.fullName || '—'}</RNText>
                  <RNText style={styles.cellSub}>{d.email || '—'}</RNText>
                </View>
                <View style={[styles.td, styles.colSpec]}>
                  <View style={styles.pill}>
                    <RNText style={styles.pillText}>{safeText(d.specialization) || '—'}</RNText>
                  </View>
                </View>
                <View style={[styles.td, styles.colLicense]}>
                  <RNText style={styles.cellMain}>{safeText(d.licenseNumber) || '—'}</RNText>
                </View>
                <View style={[styles.td, styles.colExp]}>
                  <RNText style={styles.cellMain}>{experienceText || '—'}</RNText>
                </View>
                <View style={[styles.td, styles.colFee]}>
                  <RNText style={styles.cellMain}>{feeText ? `Rs. ${feeText}` : '—'}</RNText>
                </View>
                <View style={[styles.td, styles.colDays]}>
                  <RNText style={styles.cellMain}>{safeText(d.availableDays) || '—'}</RNText>
                </View>
                <View style={[styles.td, styles.colStatus]}>
                  <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                    <RNText style={[styles.statusPillText, { color: statusFg }]}>
                      {statusNorm.charAt(0).toUpperCase() + statusNorm.slice(1)}
                    </RNText>
                  </View>
                </View>
                <View style={[styles.td, styles.colActions]}>
                  <TouchableOpacity style={styles.actionIcon} onPress={() => viewDoctorDetails(d)}>
                    <Ionicons name="eye-outline" size={18} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionIcon} onPress={() => toggleDoctorStatus(d)}>
                    <Ionicons
                      name={d.isActive ? 'pause-outline' : 'play-outline'}
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

      {doctors.length === 0 && (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="doctor" size={64} color="#D1D5DB" />
          <RNText style={styles.emptyText}>No doctors found</RNText>
          <RNText style={styles.emptySubtext}>Try adjusting your search or filters</RNText>
        </View>
      )}

      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent
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
                  <View style={[styles.detailsAvatar, { backgroundColor: '#1E4BA315' }]}>
                    <MaterialCommunityIcons name="doctor" size={48} color="#1E4BA3" />
                  </View>
                  <RNText style={styles.detailsName}>{selectedDoctor.fullName || '—'}</RNText>
                  <RNText style={styles.detailsSubtitle}>{safeText(selectedDoctor.specialization) || '—'}</RNText>
                </View>

                <View style={styles.detailsSection}>
                  <RNText style={styles.detailsSectionTitle}>Professional Information</RNText>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>License Number</RNText>
                    <RNText style={styles.detailValue}>{safeText(selectedDoctor.licenseNumber) || '—'}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Qualifications</RNText>
                    <RNText style={styles.detailValue}>{safeText(selectedDoctor.qualifications) || '—'}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Experience</RNText>
                    <RNText style={styles.detailValue}>
                      {selectedDoctor.experience === null || selectedDoctor.experience === undefined
                        ? '—'
                        : `${selectedDoctor.experience} years`}
                    </RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Consultation Fee</RNText>
                    <RNText style={styles.detailValue}>
                      {safeText(selectedDoctor.consultationFee) ? `Rs. ${safeText(selectedDoctor.consultationFee)}` : '—'}
                    </RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Available Days</RNText>
                    <RNText style={styles.detailValue}>{safeText(selectedDoctor.availableDays) || '—'}</RNText>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <RNText style={styles.detailsSectionTitle}>Account</RNText>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Email</RNText>
                    <RNText style={styles.detailValue}>{safeText(selectedDoctor.email) || '—'}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Username</RNText>
                    <RNText style={styles.detailValue}>{safeText(selectedDoctor.username) || '—'}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Registered</RNText>
                    <RNText style={styles.detailValue}>{safeText(selectedDoctor.createdAt) || '—'}</RNText>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowDetailsModal(false)}>
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
  chipsRow: {
    gap: 8,
    paddingRight: 8,
  },
  chipsDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 6,
    alignSelf: 'center',
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
    minWidth: 980,
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
  colDoctor: { width: 260 },
  colSpec: { width: 170 },
  colLicense: { width: 140 },
  colExp: { width: 120 },
  colFee: { width: 130 },
  colDays: { width: 220 },
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
  detailsSubtitle: {
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
