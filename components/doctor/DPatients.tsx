import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Text as RNText,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { API_BASE_URL } from '../../src/config/constants';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;

interface Patient {
  id: string;
  patientId?: string;
  name: string;
  nic: string;
  healthId: string;
  age: number;
  gender: string;
  phone: string;
  lastVisit: string;
  email?: string;
  rfid?: string;
  dateOfBirth?: string;
  address?: string;
}

type VerifiedPatient = {
  patientId: string;
  userId: string;
  fullName: string;
  email?: string;
  nic?: string;
  healthId?: string;
  rfid?: string;
  dateOfBirth?: string;
  gender?: string;
  contactInfo?: string;
  address?: string;
  bloodType?: string;
  allergies?: string;
};

type PatientPrescriptionRow = {
  id: string;
  issuedDate: string;
  status: string;
  doctor: string;
  itemsCount: number;
};

type PatientLabTestRow = {
  id: string;
  testName: string;
  testType: string;
  status: string;
  requestDate: string;
  priority?: string;
  isAbnormal?: boolean;
};

interface DPatientsProps {
  patients: Patient[];
}

export default function DPatients({
  patients,
}: DPatientsProps) {
  const [patientIdQuery, setPatientIdQuery] = useState('');
  const [nicQuery, setNicQuery] = useState('');
  const [rfidQuery, setRfidQuery] = useState('');
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [verifiedPatient, setVerifiedPatient] = useState<VerifiedPatient | null>(null);
  const [activeInfoTab, setActiveInfoTab] = useState<'basic' | 'medical' | 'records'>('basic');
  const [errorText, setErrorText] = useState<string | null>(null);

  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [patientPrescriptions, setPatientPrescriptions] = useState<PatientPrescriptionRow[]>([]);
  const [patientLabTests, setPatientLabTests] = useState<PatientLabTestRow[]>([]);

  const isTablet = width >= 768;

  const normalize = (v: string) => String(v || '').trim().toLowerCase();

  const fmtDate = (v: any) => {
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
    return d.toISOString().slice(0, 10);
  };

  const loadPatientRecords = async (p: VerifiedPatient) => {
    const idForApi = (p.userId && String(p.userId).trim())
      ? String(p.userId).trim()
      : String(p.patientId || '').trim();

    if (!idForApi) return;

    setRecordsLoading(true);
    setRecordsError(null);
    try {
      const [presResp, labResp] = await Promise.all([
        fetch(`${API_BASE_URL}/prescriptions?patientId=${encodeURIComponent(idForApi)}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }),
        fetch(`${API_BASE_URL}/lab-tests?patientId=${encodeURIComponent(idForApi)}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }),
      ]);

      const presText = await presResp.text();
      const presJson = (() => {
        try {
          return presText ? JSON.parse(presText) : null;
        } catch {
          return null;
        }
      })();

      const labText = await labResp.text();
      const labJson = (() => {
        try {
          return labText ? JSON.parse(labText) : null;
        } catch {
          return null;
        }
      })();

      if (!presResp.ok || !presJson?.success) {
        throw new Error(presJson?.message || `Failed to load prescriptions (${presResp.status})`);
      }
      if (!labResp.ok || !labJson?.success) {
        throw new Error(labJson?.message || `Failed to load lab tests (${labResp.status})`);
      }

      const presList = Array.isArray(presJson?.data) ? presJson.data : [];
      const labList = Array.isArray(labJson?.data) ? labJson.data : [];

      setPatientPrescriptions(
        presList.map((row: any) => {
          const items = Array.isArray(row?.items) ? row.items : [];
          return {
            id: String(row?.id ?? ''),
            issuedDate: fmtDate(row?.prescription_date ?? row?.date_issued ?? row?.created_at),
            status: String(row?.status ?? 'active'),
            doctor: String(row?.doctor_name ?? row?.doctor_id ?? 'Unknown'),
            itemsCount: items.length,
          } as PatientPrescriptionRow;
        })
      );

      setPatientLabTests(
        labList.map((row: any) => ({
          id: String(row?.id ?? ''),
          testName: String(row?.test_name ?? 'Lab Test'),
          testType: String(row?.test_type ?? ''),
          status: String(row?.status ?? 'pending'),
          requestDate: fmtDate(row?.request_date ?? row?.created_at),
          priority: row?.priority != null ? String(row.priority) : undefined,
          isAbnormal: row?.is_abnormal != null ? Boolean(row.is_abnormal) : undefined,
        }))
      );
    } catch (e: any) {
      setRecordsError(e?.message || 'Failed to load patient records');
      setPatientPrescriptions([]);
      setPatientLabTests([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    if (verifiedPatient && activeInfoTab === 'records') {
      loadPatientRecords(verifiedPatient);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifiedPatient?.userId, verifiedPatient?.patientId, activeInfoTab]);

  const onVerify = async () => {
    setErrorText(null);
    const pid = patientIdQuery.trim();
    const nic = nicQuery.trim();
    const rfid = rfidQuery.trim();

    if (!pid && !nic && !rfid) {
      setVerifiedPatient(null);
      setErrorText('Enter Patient ID, NIC, or RFID to verify.');
      return;
    }

    setLoadingVerify(true);
    try {
      const pairs: string[] = [];
      if (pid) pairs.push(`patientId=${encodeURIComponent(pid)}`);
      if (nic) pairs.push(`nic=${encodeURIComponent(nic)}`);
      if (rfid) pairs.push(`rfid=${encodeURIComponent(rfid)}`);
      const qs = pairs.join('&');

      const resp = await fetch(`${API_BASE_URL}/patients/lookup?${qs}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const rawText = await resp.text();
      const json = (() => {
        try {
          return rawText ? JSON.parse(rawText) : null;
        } catch {
          return null;
        }
      })();

      if (!resp.ok || !json?.success) {
        throw new Error(json?.message || `Lookup failed (${resp.status})`);
      }

      const d = json.data || {};
      setVerifiedPatient({
        patientId: String(d.patientId || ''),
        userId: String(d.userId || ''),
        fullName: String(d.fullName || ''),
        email: d.email ? String(d.email) : undefined,
        nic: d.nic ? String(d.nic) : undefined,
        healthId: d.healthId ? String(d.healthId) : undefined,
        rfid: d.rfid ? String(d.rfid) : undefined,
        dateOfBirth: d.dateOfBirth ? String(d.dateOfBirth).slice(0, 10) : undefined,
        gender: d.gender ? String(d.gender) : undefined,
        contactInfo: d.contactInfo ? String(d.contactInfo) : undefined,
        address: d.address ? String(d.address) : undefined,
        bloodType: d.bloodType ? String(d.bloodType) : undefined,
        allergies: d.allergies ? String(d.allergies) : undefined,
      });
      setActiveInfoTab('basic');
    } catch (e: any) {
      // Fallback to local list (best-effort) if backend is unavailable
      const pidNorm = normalize(pid);
      const nicNorm = normalize(nic);
      const rfidNorm = normalize(rfid);
      const found = (patients || []).find((p) => {
        const pId = normalize(p.patientId || p.id);
        const pNic = normalize(p.nic);
        const pRfid = normalize(p.rfid || '');
        if (pidNorm && (pId === pidNorm || pId.includes(pidNorm))) return true;
        if (nicNorm && (pNic === nicNorm || pNic.includes(nicNorm))) return true;
        if (rfidNorm && pRfid && (pRfid === rfidNorm || pRfid.includes(rfidNorm))) return true;
        return false;
      });

      if (found) {
        setVerifiedPatient({
          patientId: String(found.id),
          userId: '',
          fullName: found.name,
          email: found.email,
          nic: found.nic,
          healthId: found.patientId,
          rfid: found.rfid,
          dateOfBirth: found.dateOfBirth,
          gender: found.gender,
          contactInfo: found.phone,
          address: found.address,
        });
        setActiveInfoTab('basic');
      } else {
        setVerifiedPatient(null);
        setErrorText(e?.message || 'Patient not found. Check the details and try again.');
      }
    } finally {
      setLoadingVerify(false);
    }
  };

  const verified = useMemo(() => verifiedPatient, [verifiedPatient]);

  const FieldRow = ({ label, value }: { label: string; value?: string | number | null }) => (
    <View style={styles.fieldRow}>
      <RNText style={styles.fieldLabel}>{label}</RNText>
      <RNText style={styles.fieldValue}>{value == null || String(value).trim() === '' ? '—' : String(value)}</RNText>
    </View>
  );

  return (
    <View style={styles.section}>
      {/* Verify Patient Header */}
      <RNText style={styles.sectionTitle}>Patient Records</RNText>

      <View style={[styles.verifyCard, isTablet && styles.verifyCardTablet]}>
        <View style={[styles.verifyRow, isTablet && styles.verifyRowTablet]}>
          <View style={styles.inputBlock}>
            <RNText style={styles.inputLabel}>Patient ID</RNText>
            <TextInput
              style={styles.input}
              placeholder="Enter Patient ID"
              placeholderTextColor="#9CA3AF"
              value={patientIdQuery}
              onChangeText={setPatientIdQuery}
            />
          </View>

          <View style={styles.inputBlock}>
            <RNText style={styles.inputLabel}>National ID (NIC)</RNText>
            <TextInput
              style={styles.input}
              placeholder="Enter NIC"
              placeholderTextColor="#9CA3AF"
              value={nicQuery}
              onChangeText={setNicQuery}
            />
          </View>

          <View style={styles.inputBlock}>
            <RNText style={styles.inputLabel}>RFID</RNText>
            <TextInput
              style={styles.input}
              placeholder="Enter or Scan RFID"
              placeholderTextColor="#9CA3AF"
              value={rfidQuery}
              onChangeText={setRfidQuery}
            />
          </View>
        </View>

        <View style={styles.verifyActions}>
          <TouchableOpacity
            style={[styles.verifyButton, loadingVerify && { opacity: 0.7 }]}
            onPress={onVerify}
            activeOpacity={0.9}
            disabled={loadingVerify}
          >
            {loadingVerify ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
            )}
            <RNText style={styles.verifyButtonText}>{loadingVerify ? 'Verifying...' : 'Verify Patient'}</RNText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setPatientIdQuery('');
              setNicQuery('');
              setRfidQuery('');
              setVerifiedPatient(null);
              setErrorText(null);
              setActiveInfoTab('basic');
            }}
          >
            <RNText style={styles.resetButtonText}>Reset</RNText>
          </TouchableOpacity>
        </View>

        {errorText ? <RNText style={styles.errorText}>{errorText}</RNText> : null}
      </View>

      {verified ? (
        <View style={styles.verifiedContainer}>
          <View style={styles.verifiedHeader}>
            <View style={{ flex: 1 }}>
              <RNText style={styles.verifiedTitle}>Patient Verified Successfully</RNText>
              <RNText style={styles.verifiedSubTitle}>Full medical records access granted</RNText>
            </View>
            <View style={styles.verifiedBadge}>
              <RNText style={styles.verifiedBadgeText}>Verified</RNText>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeInfoTab === 'basic' && styles.tabButtonActive]}
              onPress={() => setActiveInfoTab('basic')}
            >
              <RNText style={[styles.tabText, activeInfoTab === 'basic' && styles.tabTextActive]}>Basic Information</RNText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeInfoTab === 'medical' && styles.tabButtonActive]}
              onPress={() => setActiveInfoTab('medical')}
            >
              <RNText style={[styles.tabText, activeInfoTab === 'medical' && styles.tabTextActive]}>Medical Information</RNText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeInfoTab === 'records' && styles.tabButtonActive]}
              onPress={() => setActiveInfoTab('records')}
            >
              <RNText style={[styles.tabText, activeInfoTab === 'records' && styles.tabTextActive]}>Medical Records</RNText>
            </TouchableOpacity>
          </View>

          {/* Tab content */}
          <View style={styles.detailsCard}>
            {activeInfoTab === 'basic' && (
              <View>
                <FieldRow label="Patient ID" value={verified.healthId || verified.patientId} />
                <FieldRow label="User ID" value={verified.userId} />
                <FieldRow label="Email" value={verified.email} />
                <FieldRow label="RFID" value={verified.rfid} />
              </View>
            )}

            {activeInfoTab === 'medical' && (
              <View>
                <FieldRow label="Full Name" value={verified.fullName} />
                <FieldRow label="NIC" value={verified.nic} />
                <FieldRow label="Date of Birth" value={verified.dateOfBirth} />
                <FieldRow label="Contact" value={verified.contactInfo} />
                <FieldRow label="Gender" value={verified.gender} />
                <FieldRow label="Address" value={verified.address} />
                <FieldRow label="Blood Type" value={verified.bloodType} />
                <FieldRow label="Allergies" value={verified.allergies} />
              </View>
            )}

            {activeInfoTab === 'records' && (
              <View>
                <RNText style={styles.recordsHintTitle}>Medical Records</RNText>

                {recordsLoading ? (
                  <View style={{ paddingVertical: 12 }}>
                    <ActivityIndicator size="small" color="#1E4BA3" />
                    <RNText style={{ marginTop: 8, color: '#6B7280', fontWeight: '600' }}>Loading records...</RNText>
                  </View>
                ) : recordsError ? (
                  <RNText style={styles.recordsErrorText}>{recordsError}</RNText>
                ) : (
                  <>
                    <View style={styles.recordsSectionHeader}>
                      <RNText style={styles.recordsSectionTitle}>Prescriptions</RNText>
                      <RNText style={styles.recordsSectionCount}>{patientPrescriptions.length}</RNText>
                    </View>
                    {patientPrescriptions.length === 0 ? (
                      <RNText style={styles.recordsHintText}>No prescriptions found for this patient.</RNText>
                    ) : (
                      <View style={styles.recordsList}>
                        {patientPrescriptions.slice(0, 20).map((p) => (
                          <View key={p.id} style={styles.recordsRow}>
                            <View style={{ flex: 1 }}>
                              <RNText style={styles.recordsRowTitle} numberOfLines={1}>Prescription #{p.id}</RNText>
                              <RNText style={styles.recordsRowMeta} numberOfLines={1}>{p.issuedDate} • {p.itemsCount} item(s)</RNText>
                            </View>
                            <RNText style={styles.recordsRowBadge} numberOfLines={1}>{String(p.status).toUpperCase()}</RNText>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.recordsDivider} />

                    <View style={styles.recordsSectionHeader}>
                      <RNText style={styles.recordsSectionTitle}>Lab Tests</RNText>
                      <RNText style={styles.recordsSectionCount}>{patientLabTests.length}</RNText>
                    </View>
                    {patientLabTests.length === 0 ? (
                      <RNText style={styles.recordsHintText}>No lab tests found for this patient.</RNText>
                    ) : (
                      <View style={styles.recordsList}>
                        {patientLabTests.slice(0, 20).map((t) => (
                          <View key={t.id} style={styles.recordsRow}>
                            <View style={{ flex: 1 }}>
                              <RNText style={styles.recordsRowTitle} numberOfLines={1}>{t.testName}</RNText>
                              <RNText style={styles.recordsRowMeta} numberOfLines={1}>{t.testType} • {t.requestDate}</RNText>
                            </View>
                            <RNText style={styles.recordsRowBadge} numberOfLines={1}>{String(t.status).toUpperCase()}</RNText>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  verifyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 18,
  },
  verifyCardTablet: {
    padding: 18,
  },
  verifyRow: {
    gap: 12,
  },
  verifyRowTablet: {
    flexDirection: 'row',
    gap: 12,
  },
  inputBlock: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#1F2937',
  },
  verifyActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  verifyButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E4BA3',
    borderRadius: 10,
    height: 44,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  resetButton: {
    paddingHorizontal: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#6B7280',
    fontWeight: '700',
  },
  errorText: {
    marginTop: 10,
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  verifiedContainer: {
  recordsErrorText: {
    fontSize: 13,
    color: '#B91C1C',
    lineHeight: 18,
    fontWeight: '700',
  },
  recordsSectionHeader: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordsSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  recordsSectionCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E4BA3',
  },
  recordsDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 14,
  },
  recordsList: {
    marginTop: 10,
    gap: 8,
  },
  recordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recordsRowTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  recordsRowMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  recordsRowBadge: {
    marginLeft: 10,
    fontSize: 11,
    fontWeight: '900',
    color: '#1E4BA3',
  },
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  verifiedHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  verifiedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  verifiedSubTitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  verifiedBadgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '900',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  tabButtonActive: {
    backgroundColor: '#1E4BA3',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#fff',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 12,
    flexShrink: 1,
    textAlign: 'right',
  },
  recordsHintTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  recordsHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 18,
  },
});

