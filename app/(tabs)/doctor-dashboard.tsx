import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  Modal,
  Platform,
  RefreshControl,
  Text as RNText,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import CreateMedicalRecord from '../../components/doctor/CreateMedicalRecord';
import CreatePrescription from '../../components/doctor/CreatePrescription';
import DAppointments from '../../components/doctor/DAppointments';
import DMessages from '../../components/doctor/DMessages';
import DPatientModals from '../../components/doctor/DPatientModals';
import DPatients from '../../components/doctor/DPatients';
import OrderLabTest from '../../components/doctor/OrderLabTest';
import ManageNotifications from '../../components/lab-technician/ManageNotifications';
import { API_BASE_URL } from '../../src/config/constants';
import { sessionService } from '../../src/services/sessionService';
import { storageService } from '../../src/services/storageService';
// Animation imports removed - dashboard cards don't need animations for better performance

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;
const isTablet = width >= 768;

interface Appointment {
  id: string;
  patientName: string;
  patientNIC?: string;
  patientDbId?: string;
  time: string;
  type: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'cancel_requested';
  cancellationReason?: string;
  cancellationRejectedReason?: string;
  appointment_date?: string;
  created_at?: string;
}

type AppointmentContext = {
  appointmentId: string;
  patientDbId?: string;
  patientName?: string;
  patientNIC?: string;
};

type CompletionArtifacts = {
  prescriptionId?: string;
  labTestIds?: string[];
};

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

interface MedicalRecord {
  diagnosis: string;
  symptoms: string;
  vitalSigns: {
    bloodPressure: string;
    temperature: string;
    heartRate: string;
    weight: string;
  };
}

interface Prescription {
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  notes: string;
}

interface LabTest {
  testName: string;
  testType: string;
  priority: 'routine' | 'urgent' | 'stat';
  instructions: string;
}

interface DashboardStats {
  todayAppointments: number;
  pendingAppointments: number;
  totalPatients: number;
  prescriptionsIssued: number;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'patients' | 'messages' | 'notifications' | 'create-prescription' | 'order-lab-tests' | 'create-medical-record'>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Search & Filter
  // (Patient verification UI manages its own inputs)
  
  // Modals
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showLabTestModal, setShowLabTestModal] = useState(false);
  const [showPatientDashboardModal, setShowPatientDashboardModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const [autoOpenCompleteAppointmentId, setAutoOpenCompleteAppointmentId] = useState<string | null>(null);
  const [prescriptionContext, setPrescriptionContext] = useState<AppointmentContext | null>(null);
  const [labTestContext, setLabTestContext] = useState<AppointmentContext | null>(null);
  const [completionArtifactsByAppointmentId, setCompletionArtifactsByAppointmentId] = useState<Record<string, CompletionArtifacts>>({});
  
  // Stats
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    pendingAppointments: 0,
    totalPatients: 0,
    prescriptionsIssued: 0,
  });

  // ANIMATIONS REMOVED FOR BETTER PERFORMANCE
  // Dashboard elements should not animate on every render

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const shownCancellationRejectionsRef = useRef<Set<string>>(new Set());

  const [patients, setPatients] = useState<Patient[]>([
    {
      id: '1',
      patientId: 'MV-P-001',
      name: 'John Doe',
      nic: '199012345678',
      healthId: 'HID001',
      age: 35,
      gender: 'Male',
      phone: '+94771234567',
      lastVisit: '2024-11-20',
      email: 'john.doe@email.com',
      rfid: 'RFID-001',
      dateOfBirth: '1990-05-15',
      address: 'No 125 / Galle Road, Colombo 03, Sri Lanka',
    },
    {
      id: '2',
      patientId: 'MV-P-002',
      name: 'Jane Smith',
      nic: '199612345678',
      healthId: 'HID002',
      age: 29,
      gender: 'Female',
      phone: '+94779876543',
      lastVisit: '2024-11-22',
      email: 'jane.smith@email.com',
      rfid: 'RFID-002',
      dateOfBirth: '1996-04-01',
      address: 'No 18 / Kandy Road, Kandy, Sri Lanka',
    },
    {
      id: '3',
      patientId: 'MV-P-003',
      name: 'Mike Johnson',
      nic: '199802345678',
      healthId: 'HID003',
      age: 27,
      gender: 'Male',
      phone: '+94774567890',
      lastVisit: '2024-11-25',
      email: 'mike.johnson@email.com',
      rfid: 'RFID-003',
      dateOfBirth: '1998-01-12',
      address: 'No 77 / Main Street, Galle, Sri Lanka',
    },
  ]);

  // Medical Record Form
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord>({
    diagnosis: '',
    symptoms: '',
    vitalSigns: { bloodPressure: '', temperature: '', heartRate: '', weight: '' },
  });

  // Prescription Form
  const [prescription, setPrescription] = useState<Prescription>({
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
    notes: '',
  });

  // Lab Test Form
  const [labTest, setLabTest] = useState<LabTest>({
    testName: '',
    testType: '',
    priority: 'routine',
    instructions: '',
  });

  useEffect(() => {
    loadDashboardData();
  }, []); // Removed animation triggers for better performance

  const formatTime = (timeLike: string) => {
    const t = String(timeLike ?? '').trim();
    if (!t) return '';
    const hhmm = t.slice(0, 5);
    const [hhRaw, mmRaw] = hhmm.split(':');
    const hh = Number(hhRaw);
    const mm = Number(mmRaw);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return t;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12 = ((hh + 11) % 12) + 1;
    return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
  };

  const fetchDoctorAppointments = async (doctorUserId: string | number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments?doctor_id=${encodeURIComponent(String(doctorUserId))}`, {
        headers: { Accept: 'application/json' },
      });

      const rawText = await res.text();
      const json = (() => {
        try {
          return rawText ? JSON.parse(rawText) : null;
        } catch {
          return null;
        }
      })();

      if (!res.ok || !json?.success) return [] as Appointment[];

      const rows = Array.isArray(json.data) ? json.data : [];
      const mapped: Appointment[] = rows.map((a: any) => {
        const patientName = `${String(a?.patient_first_name ?? '').trim()} ${String(a?.patient_last_name ?? '').trim()}`.trim() || 'Patient';
        return {
          id: String(a?.id ?? ''),
          patientName,
          patientNIC: a?.patient_nic ? String(a.patient_nic) : undefined,
          patientDbId: a?.patient_id != null ? String(a.patient_id) : undefined,
          time: formatTime(String(a?.appointment_time ?? '')),
          type: String(a?.reason ?? 'Appointment'),
          status: (String(a?.status ?? 'pending').toLowerCase() as Appointment['status']) || 'pending',
          cancellationReason: a?.cancellation_reason ? String(a.cancellation_reason) : a?.notes ? String(a.notes) : undefined,
          cancellationRejectedReason: a?.cancellation_rejected_reason ? String(a.cancellation_rejected_reason) : undefined,
          appointment_date: a?.appointment_date ? String(a.appointment_date) : undefined,
          created_at: a?.created_at ? String(a.created_at) : undefined,
        };
      });
      setAppointments(mapped);

      return mapped;

    } catch (e) {
      // best-effort
      console.log('Failed to fetch doctor appointments:', e);
      return [] as Appointment[];
    }
  };

  const fetchDoctorPrescriptionsCount = async (doctorUserId: string | number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/prescriptions?doctorId=${encodeURIComponent(String(doctorUserId))}`, {
        headers: { Accept: 'application/json' },
      });

      const rawText = await res.text();
      const json = (() => {
        try {
          return rawText ? JSON.parse(rawText) : null;
        } catch {
          return null;
        }
      })();

      if (!res.ok || !json?.success || !Array.isArray(json?.data)) return 0;
      return json.data.length;
    } catch (e) {
      return 0;
    }
  };

  const updateAppointmentStatus = async (
    appointmentId: string,
    nextStatus: Appointment['status'],
    opts?: { cancellationReason?: string; actualVisitTime?: string; visitNotes?: string }
  ) => {
    try {
      const payload: any = { status: nextStatus, user_id: userInfo?.id };
      if (nextStatus === 'cancel_requested' && opts?.cancellationReason) {
        payload.cancellation_reason = opts.cancellationReason;
      }
      if (nextStatus === 'completed') {
        if (opts?.actualVisitTime) payload.actual_visit_time = String(opts.actualVisitTime);
        if (opts?.visitNotes) payload.visit_notes = String(opts.visitNotes);
      }
      const res = await fetch(`${API_BASE_URL}/appointments/${encodeURIComponent(appointmentId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      const json = (() => {
        try {
          return rawText ? JSON.parse(rawText) : null;
        } catch {
          return null;
        }
      })();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Failed to update appointment');
      }

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? {
                ...a,
                status: nextStatus,
                cancellationReason:
                  nextStatus === 'cancel_requested' ? (opts?.cancellationReason || a.cancellationReason) : a.cancellationReason,
              }
            : a
        )
      );
      setSelectedAppointment((prev) =>
        prev && prev.id === appointmentId
          ? {
              ...prev,
              status: nextStatus,
              cancellationReason:
                nextStatus === 'cancel_requested'
                  ? (opts?.cancellationReason || prev.cancellationReason)
                  : prev.cancellationReason,
            }
          : prev
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update appointment');
    }
  };

  const loadDashboardData = async () => {
    try {
      const user = await storageService.getUser();
      setUserInfo(user);
      if (user?.id != null) {
        const [appts, prescriptionsIssued] = await Promise.all([
          fetchDoctorAppointments(user.id),
          fetchDoctorPrescriptionsCount(user.id),
        ]);

        const today = new Date().toISOString().slice(0, 10);
        const toDateOnly = (v?: string) => {
          if (!v) return '';
          const s = String(v);
          return s.includes('T') ? s.slice(0, 10) : s.slice(0, 10);
        };

        const todayAppointments = appts.filter((a) => toDateOnly(a.appointment_date) === today).length;
        const pendingAppointments = appts.filter((a) => a.status === 'pending').length;
        const totalPatients = new Set(appts.map((a) => a.patientDbId).filter(Boolean)).size;

        setStats({
          todayAppointments,
          pendingAppointments,
          totalPatients,
          prescriptionsIssued,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await sessionService.clearSession();
              router.replace('/(auth)/login' as any);
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientDashboardModal(true);
  };

  const handleCreateMedicalRecord = () => {
    if (!selectedPatient) return;
    setShowMedicalRecordModal(true);
  };

  const handleIssuePrescription = () => {
    if (!selectedPatient) return;
    setShowPrescriptionModal(true);
  };

  const handleOrderLabTest = () => {
    if (!selectedPatient) return;
    setShowLabTestModal(true);
  };

  const saveMedicalRecord = () => {
    if (!medicalRecord.diagnosis || !medicalRecord.symptoms) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    Alert.alert('Success', 'Medical record created successfully');
    setShowMedicalRecordModal(false);
    setMedicalRecord({
      diagnosis: '',
      symptoms: '',
      vitalSigns: { bloodPressure: '', temperature: '', heartRate: '', weight: '' },
    });
  };

  const savePrescription = () => {
    const hasValidMedication = prescription.medications.some(med => 
      med.name && med.dosage && med.frequency && med.duration
    );
    if (!hasValidMedication) {
      Alert.alert('Error', 'Please add at least one medication');
      return;
    }
    Alert.alert('Success', 'Prescription issued with QR code generated');
    setShowPrescriptionModal(false);
    setPrescription({
      medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
      notes: '',
    });
  };

  const saveLabTest = () => {
    if (!labTest.testName || !labTest.testType) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    Alert.alert('Success', 'Lab test ordered successfully');
    setShowLabTestModal(false);
    setLabTest({
      testName: '',
      testType: '',
      priority: 'routine',
      instructions: '',
    });
  };

  const addMedication = () => {
    setPrescription({
      ...prescription,
      medications: [...prescription.medications, { name: '', dosage: '', frequency: '', duration: '' }],
    });
  };

  const updateMedication = (index: number, field: string, value: string) => {
    const updatedMeds = [...prescription.medications];
    updatedMeds[index] = { ...updatedMeds[index], [field]: value };
    setPrescription({ ...prescription, medications: updatedMeds });
  };

  const removeMedication = (index: number) => {
    if (prescription.medications.length > 1) {
      setPrescription({
        ...prescription,
        medications: prescription.medications.filter((_, i) => i !== index),
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E4BA3" />
      </View>
    );
  }

  const renderOverview = () => (
    <>
      {/* Stats Grid - Animations removed for performance */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.whiteCard]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#3B82F615' }]}>
            <MaterialCommunityIcons name="calendar-today" size={28} color="#3B82F6" />
          </View>
          <RNText style={styles.statNumberTransparent}>{stats.todayAppointments}</RNText>
          <RNText style={styles.statLabelTransparent}>Today's Appointments</RNText>
        </View>

        <View style={[styles.statCard, styles.whiteCard]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B15' }]}>
            <Ionicons name="time-outline" size={28} color="#F59E0B" />
          </View>
          <RNText style={styles.statNumberTransparent}>{stats.pendingAppointments}</RNText>
          <RNText style={styles.statLabelTransparent}>Pending</RNText>
        </View>

        <View style={[styles.statCard, styles.whiteCard]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#10B98115' }]}>
            <MaterialCommunityIcons name="account-group" size={28} color="#10B981" />
          </View>
          <RNText style={styles.statNumberTransparent}>{stats.totalPatients}</RNText>
          <RNText style={styles.statLabelTransparent}>Total Patients</RNText>
        </View>

        <View style={[styles.statCard, styles.whiteCard]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF615' }]}>
            <MaterialCommunityIcons name="pill" size={28} color="#8B5CF6" />
          </View>
          <RNText style={styles.statNumberTransparent}>{stats.prescriptionsIssued}</RNText>
          <RNText style={styles.statLabelTransparent}>Prescriptions</RNText>
        </View>
      </View>

      {/* Quick Actions - Animations removed for performance */}
      <View style={styles.section}>
        <RNText style={styles.sectionTitle}>Quick Actions</RNText>
        <View style={styles.quickActionsGrid}>
          <View>
            <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveTab('appointments')}>
              <View style={[styles.statIconContainer, { backgroundColor: '#3B82F615' }]}>
                <MaterialCommunityIcons name="calendar-check" size={32} color="#3B82F6" />
              </View>
              <RNText style={styles.quickActionText}>Appointments</RNText>
            </TouchableOpacity>
          </View>

          <View>
            <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveTab('patients')}>
              <View style={[styles.statIconContainer, { backgroundColor: '#10B98115' }]}>
                <MaterialCommunityIcons name="account-search" size={32} color="#10B981" />
              </View>
              <RNText style={styles.quickActionText}>Search Patients</RNText>
            </TouchableOpacity>
          </View>

          <View>
            <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveTab('create-medical-record')}>
              <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF615' }]}>
                <MaterialCommunityIcons name="clipboard-text" size={32} color="#8B5CF6" />
              </View>
              <RNText style={styles.quickActionText}>Create Medical Record</RNText>
            </TouchableOpacity>
          </View>

          <View>
            <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveTab('create-prescription')}>
              <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B15' }]}>
                <MaterialCommunityIcons name="prescription" size={32} color="#F59E0B" />
              </View>
              <RNText style={styles.quickActionText}>Create Prescription</RNText>
            </TouchableOpacity>
          </View>

          <View>
            <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveTab('order-lab-tests')}>
              <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF615' }]}>
                <MaterialCommunityIcons name="test-tube" size={32} color="#8B5CF6" />
              </View>
              <RNText style={styles.quickActionText}>Order Lab Tests</RNText>
            </TouchableOpacity>
          </View>

          <View>
            <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveTab('messages')}>
              <View style={[styles.statIconContainer, { backgroundColor: '#3B82F615' }]}>
                <MaterialCommunityIcons name="message-text" size={32} color="#3B82F6" />
              </View>
              <RNText style={styles.quickActionText}>Messages</RNText>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Today's Appointments */}
      {/* Today's Appointments - Animation removed for performance */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <RNText style={styles.sectionTitle}>Today's Appointments</RNText>
          <TouchableOpacity onPress={() => setActiveTab('appointments')}>
            <RNText style={styles.viewAllText}>View All</RNText>
          </TouchableOpacity>
        </View>
        {appointments.slice(0, 3).map(appointment => (
          <TouchableOpacity 
            key={appointment.id} 
            style={styles.appointmentCard}
            onPress={() => handleViewAppointment(appointment)}
          >
            <View style={styles.appointmentLeft}>
              <View style={[styles.appointmentStatus, { 
                backgroundColor: appointment.status === 'confirmed' ? '#1E4BA3' : '#F59E0B' 
              }]} />
              <View>
                <RNText style={styles.appointmentPatient}>{appointment.patientName}</RNText>
                <RNText style={styles.appointmentTime}>{appointment.time} • {appointment.type}</RNText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>
    </>
  );







  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={require('../../assets/images/Background-image.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.gradientOverlay} />
        
        {/* Header - Animation removed for performance */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.hamburgerButton} 
              onPress={() => setMenuOpen(true)}
            >
              <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
            <View>
              <RNText style={styles.greeting}>Welcome Back, Doctor</RNText>
              <RNText style={styles.userName}>Dr. {userInfo?.fullName || 'Doctor'}</RNText>
            </View>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={32} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Hamburger Menu Modal */}
        <Modal
          visible={menuOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuOpen(false)}
        >
          <View style={styles.menuOverlay}>
            <View style={styles.menuContainer}>
              <View style={styles.menuHeader}>
                <RNText style={styles.menuTitle}>Medi Vault</RNText>
                <TouchableOpacity onPress={() => setMenuOpen(false)}>
                  <Ionicons name="close" size={28} color="#1F2937" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
                <TouchableOpacity 
                  style={[styles.menuItem, activeTab === 'overview' && styles.menuItemActive]}
                  onPress={() => {
                    setActiveTab('overview');
                    setMenuOpen(false);
                  }}
                >
                  <MaterialCommunityIcons 
                    name="view-dashboard" 
                    size={24} 
                    color="#1F2937" 
                  />
                  <RNText style={styles.menuItemText}>Dashboard</RNText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.menuItem, activeTab === 'appointments' && styles.menuItemActive]}
                  onPress={() => {
                    setActiveTab('appointments');
                    setMenuOpen(false);
                  }}
                >
                  <MaterialCommunityIcons 
                    name="calendar-check" 
                    size={24} 
                    color="#1F2937" 
                  />
                  <RNText style={styles.menuItemText}>Appointments</RNText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.menuItem, activeTab === 'patients' && styles.menuItemActive]}
                  onPress={() => {
                    setActiveTab('patients');
                    setMenuOpen(false);
                  }}
                >
                  <MaterialCommunityIcons 
                    name="account-group" 
                    size={24} 
                    color="#1F2937" 
                  />
                  <RNText style={styles.menuItemText}>Patients</RNText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.menuItem, activeTab === 'create-medical-record' && styles.menuItemActive]}
                  onPress={() => {
                    setActiveTab('create-medical-record');
                    setMenuOpen(false);
                  }}
                >
                  <MaterialCommunityIcons 
                    name="clipboard-text" 
                    size={24} 
                    color="#1F2937" 
                  />
                  <RNText style={styles.menuItemText}>Medical Records</RNText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.menuItem, activeTab === 'create-prescription' && styles.menuItemActive]}
                  onPress={() => {
                    setActiveTab('create-prescription');
                    setMenuOpen(false);
                  }}
                >
                  <MaterialCommunityIcons 
                    name="prescription" 
                    size={24} 
                    color="#1F2937" 
                  />
                  <RNText style={styles.menuItemText}>Prescriptions</RNText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.menuItem, activeTab === 'order-lab-tests' && styles.menuItemActive]}
                  onPress={() => {
                    setActiveTab('order-lab-tests');
                    setMenuOpen(false);
                  }}
                >
                  <MaterialCommunityIcons 
                    name="test-tube" 
                    size={24} 
                    color="#1F2937" 
                  />
                  <RNText style={styles.menuItemText}>Lab Tests</RNText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.menuItem, activeTab === 'messages' && styles.menuItemActive]}
                  onPress={() => {
                    setActiveTab('messages');
                    setMenuOpen(false);
                  }}
                >
                  <Ionicons 
                    name="chatbubbles-outline" 
                    size={24} 
                    color="#1F2937" 
                  />
                  <RNText style={styles.menuItemText}>Messages</RNText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.menuItem, activeTab === 'notifications' && styles.menuItemActive]}
                  onPress={() => {
                    setActiveTab('notifications');
                    setMenuOpen(false);
                  }}
                >
                  <Ionicons 
                    name="notifications-outline" 
                    size={24} 
                    color="#1F2937" 
                  />
                  <RNText style={styles.menuItemText}>Notifications</RNText>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={async () => {
                    setMenuOpen(false);
                    await sessionService.clearSession();
                    router.replace('/(auth)/login' as any);
                  }}
                >
                  <Ionicons name="arrow-back" size={24} color="#1F2937" />
                  <RNText style={styles.menuItemText}>Back to Login</RNText>
                </TouchableOpacity>
              </ScrollView>
            </View>
            <TouchableOpacity 
              style={styles.menuBackdrop}
              activeOpacity={1}
              onPress={() => setMenuOpen(false)}
            />
          </View>
        </Modal>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'create-prescription' && (
            <CreatePrescription
              patientId={prescriptionContext?.patientDbId}
              appointmentId={prescriptionContext?.appointmentId}
              onSaved={(result) => {
                const apptId = prescriptionContext?.appointmentId;
                if (apptId) {
                  setCompletionArtifactsByAppointmentId((prev) => ({
                    ...prev,
                    [apptId]: {
                      ...(prev[apptId] || {}),
                      prescriptionId: result?.id ? String(result.id) : (prev[apptId]?.prescriptionId || undefined),
                    },
                  }));
                }
                setActiveTab('appointments');
                setAutoOpenCompleteAppointmentId(apptId || null);
              }}
            />
          )}
          {activeTab === 'create-medical-record' && <CreateMedicalRecord />}
          {activeTab === 'order-lab-tests' && (
            <OrderLabTest
              patientId={labTestContext?.patientDbId}
              appointmentId={labTestContext?.appointmentId}
              doctorId={userInfo?.id}
              onSaved={(result) => {
                const apptId = labTestContext?.appointmentId;
                const ids = Array.isArray(result?.ids) ? result.ids.map((x: any) => String(x)) : [];
                if (apptId) {
                  setCompletionArtifactsByAppointmentId((prev) => ({
                    ...prev,
                    [apptId]: {
                      ...(prev[apptId] || {}),
                      labTestIds: ids.length ? ids : (prev[apptId]?.labTestIds || undefined),
                    },
                  }));
                }
                setActiveTab('appointments');
                setAutoOpenCompleteAppointmentId(apptId || null);
              }}
            />
          )}
          {activeTab === 'appointments' && (
            <DAppointments
              appointments={appointments}
              selectedAppointment={selectedAppointment}
              showAppointmentModal={showAppointmentModal}
              setShowAppointmentModal={setShowAppointmentModal}
              handleViewAppointment={handleViewAppointment}
              onApprove={(id) => updateAppointmentStatus(id, 'confirmed')}
              onMarkComplete={(id, meta) =>
                updateAppointmentStatus(id, 'completed', {
                  actualVisitTime: meta?.actualVisitTime,
                  visitNotes: meta?.visitNotes,
                })
              }
              onRequestCancel={(id, reason) => updateAppointmentStatus(id, 'cancel_requested', { cancellationReason: reason })}
              completionArtifactsByAppointmentId={completionArtifactsByAppointmentId}
              onOpenCreatePrescription={(ctx) => {
                setPrescriptionContext(ctx);
                setActiveTab('create-prescription');
              }}
              onOpenOrderLabTests={(ctx) => {
                setLabTestContext(ctx);
                setActiveTab('order-lab-tests');
              }}
              onOpenCreateMedicalRecord={() => setActiveTab('create-medical-record')}
              autoOpenCompleteAppointmentId={autoOpenCompleteAppointmentId}
              onAutoOpenCompleteHandled={() => setAutoOpenCompleteAppointmentId(null)}
            />
          )}
          {activeTab === 'patients' && (
            <DPatients
              patients={patients}
            />
          )}
          {activeTab === 'messages' && <DMessages />}
          {activeTab === 'notifications' && <ManageNotifications embedded showBackground={false} />}
        </ScrollView>

        {/* Patient Modals */}
        <DPatientModals
          selectedPatient={selectedPatient}
          showPatientDashboardModal={showPatientDashboardModal}
          setShowPatientDashboardModal={setShowPatientDashboardModal}
          showMedicalRecordModal={showMedicalRecordModal}
          setShowMedicalRecordModal={setShowMedicalRecordModal}
          showPrescriptionModal={showPrescriptionModal}
          setShowPrescriptionModal={setShowPrescriptionModal}
          showLabTestModal={showLabTestModal}
          setShowLabTestModal={setShowLabTestModal}
          medicalRecord={medicalRecord}
          setMedicalRecord={setMedicalRecord}
          prescription={prescription}
          setPrescription={setPrescription}
          labTest={labTest}
          setLabTest={setLabTest}
          handleCreateMedicalRecord={handleCreateMedicalRecord}
          handleIssuePrescription={handleIssuePrescription}
          handleOrderLabTest={handleOrderLabTest}
          saveMedicalRecord={saveMedicalRecord}
          savePrescription={savePrescription}
          saveLabTest={saveLabTest}
          addMedication={addMedication}
          updateMedication={updateMedication}
          removeMedication={removeMedication}
        />

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => setActiveTab('overview')}
          >
            <Ionicons
              name={activeTab === 'overview' ? 'home' : 'home-outline'}
              size={24}
              color={activeTab === 'overview' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            />
            <RNText style={[styles.bottomNavText, activeTab === 'overview' && styles.bottomNavTextActive]}>
              Home
            </RNText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => setActiveTab('appointments')}
          >
            <MaterialCommunityIcons
              name={activeTab === 'appointments' ? 'calendar-check' : 'calendar-check-outline'}
              size={24}
              color={activeTab === 'appointments' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            />
            <RNText style={[styles.bottomNavText, activeTab === 'appointments' && styles.bottomNavTextActive]}>
              Appointments
            </RNText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => setActiveTab('patients')}
          >
            <MaterialCommunityIcons
              name={activeTab === 'patients' ? 'account-group' : 'account-group-outline'}
              size={24}
              color={activeTab === 'patients' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            />
            <RNText style={[styles.bottomNavText, activeTab === 'patients' && styles.bottomNavTextActive]}>
              Patients
            </RNText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => setActiveTab('create-prescription')}
          >
            <MaterialCommunityIcons
              name={activeTab === 'create-prescription' ? 'prescription' : 'prescription'}
              size={24}
              color={activeTab === 'create-prescription' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            />
            <RNText style={[styles.bottomNavText, activeTab === 'create-prescription' && styles.bottomNavTextActive]}>
              Prescribe
            </RNText>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(147, 197, 253, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 20,
    backgroundColor: '#1E4BA3',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  hamburgerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
    marginTop: 4,
  },
  doctorName: {
    fontSize: isSmallScreen ? 22 : 26,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  menuOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    width: 280,
    backgroundColor: '#fff',
    height: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 2, height: 0 },
      },
      android: {
        elevation: 16,
      },
    }),
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#11181C',
  },
  menuContent: {
    flex: 1,
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  menuItemActive: {
    backgroundColor: 'rgba(30, 75, 163, 0.12)',
    borderLeftColor: '#1E4BA3',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  menuItemTextActive: {
    color: '#1F2937',
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
    marginHorizontal: 20,
  },
  navContainer: {
    backgroundColor: '#fff',
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
  navScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginRight: 8,
    gap: 8,
  },
  navItemActive: {
    backgroundColor: '#1E4BA315',
    borderWidth: 1,
    borderColor: '#1E4BA3',
  },
  navText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  navTextActive: {
    color: '#1E4BA3',
    fontWeight: '600',
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    gap: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(30, 75, 163, 0.15)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#1E4BA3',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isSmallScreen ? 12 : 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: isSmallScreen ? '47%' : '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  transparentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(30, 75, 163, 0.4)',
  },
  whiteCard: {
    backgroundColor: '#fff',
  },
  statNumber: {
    fontSize: isSmallScreen ? 28 : 32,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statNumberTransparent: {
    fontSize: isSmallScreen ? 28 : 32,
    fontWeight: '700',
    color: '#1E4BA3',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.95,
  },
  statLabelTransparent: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#1F2937',
    textAlign: 'center',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#1E4BA3',
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: isTablet ? (width - 80) / 3 - 8 : (width - 64) / 3 - 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: isSmallScreen ? 12 : 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
    }),
    minHeight: isSmallScreen ? 100 : 110,
  },
  quickActionText: {
    fontSize: isSmallScreen ? 10 : 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  appointmentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
      android: { elevation: 3 },
    }),
  },
  appointmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  appointmentStatus: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  appointmentPatient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 13,
    color: '#6B7280',
  },
  appointmentNIC: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconButton: {
    padding: 4,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 0,
    height: 50,
    marginBottom: 12,
    fontSize: 15,
    color: '#1F2937',
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
  emptyState: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#1E4BA3',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  bottomNavText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    fontWeight: '500',
  },
  bottomNavTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

