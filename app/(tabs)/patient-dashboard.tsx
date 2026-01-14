// app/(tabs)/patient-dashboard.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import PatientBookAppointment from "../../components/patient/patientBookAppoinment";
import PatientFindDoctor from "../../components/patient/patientFindDoctor";
import PatientLabReport from "../../components/patient/patientLabReport";
import PatientNotifications from "../../components/patient/PatientNotifications";
import PatientPrescription from "../../components/patient/patientPrescription";
import { notificationsApi } from "../../src/api/notifications";
import { API_BASE_URL } from "../../src/config/constants";
import { sessionService } from "../../src/services/sessionService";
import { storageService } from "../../src/services/storageService";

type DashboardStats = {
  upcomingAppointments: number;
  activePrescriptions: number;
  pendingLabTests: number;
  unreadNotifications: number;
  totalAppointments: number;
  medicalRecords: number;
  labTests: number;
};

type LabTest = {
  id: string;
  title: string;
  testType: string;
  doctor: string;
  date: string;
  status: string;
  urgency: string;
};

type Prescription = {
  id: string;
  prescriptionId: string;
  doctor: string;
  status: string;
  scannedAt: string;
};

type ActiveView = 
  | "dashboard" 
  | "appointments" 
  | "prescriptions" 
  | "labReports" 
  | "findDoctor" 
  | "notifications"
  | "medicalRecords" 
  | "profile";

export default function PatientDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [patientUser, setPatientUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    upcomingAppointments: 0,
    activePrescriptions: 1,
    pendingLabTests: 6,
    unreadNotifications: 0,
    totalAppointments: 5,
    medicalRecords: 0,
    labTests: 6,
  });
  const [recentLabTests, setRecentLabTests] = useState<LabTest[]>([]);
  const [activePrescriptions, setActivePrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    loadDashboardData();
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      const user = await storageService.getUser();
      setPatientUser(user);
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      const user = await storageService.getUser();
      const patientId = user?.id != null ? String(user.id) : '';

      // Fetch notifications (best-effort)
      try {
        const notifRes = await notificationsApi.list();
        if (notifRes?.success && Array.isArray(notifRes.data)) {
          const unread = notifRes.data.filter((n: any) => !n?.read).length;
          setStats((prev) => ({
            ...prev,
            unreadNotifications: unread,
          }));
        }
      } catch {
        // ignore
      }

      // Fetch lab tests
      try {
        const labUrl = patientId
          ? `${API_BASE_URL}/lab-tests?patientId=${encodeURIComponent(patientId)}`
          : `${API_BASE_URL}/lab-tests`;
        const labResponse = await fetch(labUrl);
        const labJson = await labResponse.json();

        if (labJson?.success && Array.isArray(labJson.data)) {
          const list = labJson.data;
          const pendingTests = list.filter((t: any) => String(t?.status ?? '').toLowerCase() === 'pending');

          const fmt = (v: any) => {
            if (!v) return '';
            const d = new Date(v);
            if (Number.isNaN(d.getTime())) return String(v);
            return d.toISOString().split('T')[0];
          };

          const mappedRecent = list.slice(0, 3).map((t: any) => {
            const isAbnormal = Boolean(t?.is_abnormal);
            const priority = String(t?.priority ?? '').toLowerCase();
            const urgency = isAbnormal ? 'abnormal' : priority || 'normal';

            return {
              id: String(t?.id ?? ''),
              title: String(t?.test_name ?? 'Lab Test'),
              testType: String(t?.test_type ?? ''),
              doctor: String(t?.doctor_name ?? t?.doctor_id ?? 'Unknown'),
              date: fmt(t?.request_date ?? t?.created_at),
              status: String(t?.status ?? 'pending'),
              urgency: String(urgency),
            };
          });

          setRecentLabTests(mappedRecent);
          setStats(prev => ({
            ...prev,
            pendingLabTests: pendingTests.length,
            labTests: list.length,
          }));
        }
      } catch {
        // ignore
      }

      // Fetch prescriptions
      try {
        const url = patientId
          ? `${API_BASE_URL}/prescriptions?patientId=${encodeURIComponent(patientId)}`
          : `${API_BASE_URL}/prescriptions`;
        const presResponse = await fetch(url);
        const presJson = await presResponse.json();

        if (presJson?.success && Array.isArray(presJson.data)) {
          const list = presJson.data;
          const fmt = (v: any) => {
            if (!v) return '';
            const d = new Date(v);
            if (Number.isNaN(d.getTime())) return String(v);
            return d.toISOString().split('T')[0];
          };

          const mapped = list.slice(0, 1).map((p: any) => ({
            id: String(p?.id ?? ''),
            prescriptionId: String(p?.qr_code ?? p?.id ?? '').slice(0, 32),
            doctor: String(p?.doctor_name ?? p?.doctor_id ?? 'Unknown'),
            status: String(p?.status ?? 'active'),
            scannedAt: fmt(p?.created_at ?? p?.prescription_date ?? p?.date_issued),
          }));

          setActivePrescriptions(mapped);
          setStats(prev => ({
            ...prev,
            activePrescriptions: list.length,
          }));
        }
      } catch {
        // ignore
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await sessionService.clearSession();
          router.replace('/(auth)/landing-page' as any);
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#2ECC71';
      case 'pending': return '#9CA3AF';
      case 'in_progress': return '#3B82F6';
      case 'approved': return '#10B981';
      default: return '#9CA3AF';
    }
  };

  const renderMenuModal = () => (
    <Modal
      visible={menuOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setMenuOpen(false)}
    >
      <View style={styles.menuOverlay}>
        {/* Menu Sidebar */}
        <View style={styles.menuContainer}>
          {/* Menu Header */}
          <View style={styles.menuHeader}>
            <View style={styles.menuHeaderTop}>
              <Text style={styles.menuTitle}>Medi Vault</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)}>
                <Ionicons name="close" size={28} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <View style={styles.menuUserInfo}>
              <Text style={styles.menuUserName}>{patientUser?.fullName || 'Patient'}</Text>
              <Text style={styles.menuUserRole}>Patient</Text>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.menuItem, activeView === 'dashboard' && styles.menuItemActive]}
              onPress={() => { setActiveView('dashboard'); setMenuOpen(false); }}
            >
              <MaterialCommunityIcons name="view-dashboard" size={24} color="#1F2937" />
              <Text style={styles.menuItemText}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, activeView === 'findDoctor' && styles.menuItemActive]}
              onPress={() => { setActiveView('findDoctor'); setMenuOpen(false); }}
            >
              <MaterialCommunityIcons name="doctor" size={24} color="#1F2937" />
              <Text style={styles.menuItemText}>Find Doctors</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, activeView === 'appointments' && styles.menuItemActive]}
              onPress={() => { setActiveView('appointments'); setMenuOpen(false); }}
            >
              <MaterialCommunityIcons name="calendar-check" size={24} color="#1F2937" />
              <Text style={styles.menuItemText}>My Appointments</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, activeView === 'prescriptions' && styles.menuItemActive]}
              onPress={() => { setActiveView('prescriptions'); setMenuOpen(false); }}
            >
              <MaterialCommunityIcons name="prescription" size={24} color="#1F2937" />
              <Text style={styles.menuItemText}>Prescriptions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, activeView === 'labReports' && styles.menuItemActive]}
              onPress={() => { setActiveView('labReports'); setMenuOpen(false); }}
            >
              <MaterialCommunityIcons name="test-tube" size={24} color="#1F2937" />
              <Text style={styles.menuItemText}>Lab Results</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, activeView === 'notifications' && styles.menuItemActive]}
              onPress={() => { setActiveView('notifications'); setMenuOpen(false); }}
            >
              <Ionicons name="notifications-outline" size={24} color="#1F2937" />
              <Text style={styles.menuItemText}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, activeView === 'medicalRecords' && styles.menuItemActive]}
              onPress={() => { setActiveView('medicalRecords'); setMenuOpen(false); }}
            >
              <MaterialCommunityIcons name="clipboard-text" size={24} color="#1F2937" />
              <Text style={styles.menuItemText}>Medical Records</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, activeView === 'profile' && styles.menuItemActive]}
              onPress={() => { setActiveView('profile'); setMenuOpen(false); }}
            >
              <Ionicons name="person-outline" size={24} color="#1F2937" />
              <Text style={styles.menuItemText}>My Profile</Text>
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
              <Text style={styles.menuItemText}>Back to Login</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Backdrop */}
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        />
      </View>
    </Modal>
  );

  // Render different views based on activeView
  const renderContent = () => {
    switch (activeView) {
      case "appointments":
        return <PatientBookAppointment onMenu={() => setMenuOpen(true)} />;
      case "prescriptions":
        return <PatientPrescription onMenu={() => setMenuOpen(true)} />;
      case "labReports":
        return <PatientLabReport onMenu={() => setMenuOpen(true)} />;
      case "findDoctor":
        return <PatientFindDoctor onMenu={() => setMenuOpen(true)} />;
      case "notifications":
        return <PatientNotifications showBackground={false} onMenu={() => setMenuOpen(true)} />;
      case "medicalRecords":
        return (
          <View style={styles.root}>
            <View style={styles.header}>
              <Text style={styles.welcomeText}>Medical Records</Text>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text>Medical Records - Coming Soon</Text>
            </View>
          </View>
        );
      case "profile":
        return (
          <View style={styles.root}>
            <View style={styles.header}>
              <Text style={styles.welcomeText}>My Profile</Text>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text>Profile - Coming Soon</Text>
            </View>
          </View>
        );
      case "dashboard":
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={require('../../assets/images/Background-image.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.gradientOverlay} />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => setMenuOpen(true)}
            >
              <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.welcomeText}>Welcome back!</Text>
              <Text style={styles.subtitleText}>{patientUser?.fullName || 'Patient'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setActiveView('notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statCard} onPress={() => setActiveView("appointments")}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Upcoming Appointments</Text>
              <View style={[styles.statIconContainer, { backgroundColor: '#3B82F615' }]}>
                <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
              </View>
            </View>
            <Text style={styles.statValue}>{stats.upcomingAppointments}</Text>
            <Text style={styles.statSubtext}>Click to view details</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => setActiveView("prescriptions")}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Active Prescriptions</Text>
              <View style={[styles.statIconContainer, { backgroundColor: '#10B98115' }]}>
                <MaterialCommunityIcons name="prescription" size={20} color="#10B981" />
              </View>
            </View>
            <Text style={styles.statValue}>{stats.activePrescriptions}</Text>
            <Text style={styles.statSubtext}>Click to view details</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => setActiveView("labReports")}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Pending Lab Tests</Text>
              <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF615' }]}>
                <MaterialCommunityIcons name="flask-outline" size={20} color="#8B5CF6" />
              </View>
            </View>
            <Text style={styles.statValue}>{stats.pendingLabTests}</Text>
            <Text style={styles.statSubtext}>Click to view details</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => setActiveView('notifications')}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Unread Notifications</Text>
              <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B15' }]}>
                <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
              </View>
            </View>
            <Text style={styles.statValue}>{stats.unreadNotifications}</Text>
            <Text style={styles.statSubtext}>Click to view details</Text>
          </TouchableOpacity>
        </View>

        {/* Health Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="file-document-outline" size={20} color="#1F2937" />
            <Text style={styles.sectionTitle}>Health Summary</Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Appointments</Text>
              <Text style={styles.summaryValue}>{stats.totalAppointments}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Medical Records</Text>
              <Text style={styles.summaryValue}>{stats.medicalRecords}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Lab Tests</Text>
              <Text style={styles.summaryValue}>{stats.labTests}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="lightning-bolt-outline" size={20} color="#1F2937" />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsScroll}>
            <TouchableOpacity style={[styles.actionButton, styles.actionButtonPrimary]} onPress={() => setActiveView("findDoctor")}>
              <MaterialCommunityIcons name="account-multiple" size={18} color="#fff" />
              <Text style={styles.actionButtonTextPrimary}>Find Doctors</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => setActiveView("appointments")}>
              <Ionicons name="calendar-outline" size={18} color="#374151" />
              <Text style={styles.actionButtonText}>My Appointments</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => setActiveView("prescriptions")}>
              <MaterialCommunityIcons name="prescription" size={18} color="#374151" />
              <Text style={styles.actionButtonText}>Prescriptions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => setActiveView("labReports")}>
              <MaterialCommunityIcons name="flask-outline" size={18} color="#374151" />
              <Text style={styles.actionButtonText}>Lab Results</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="document-text-outline" size={18} color="#374151" />
              <Text style={styles.actionButtonText}>Medical Records</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={20} color="#1F2937" />
              <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No upcoming appointments</Text>
            <TouchableOpacity style={styles.bookButton} onPress={() => setActiveView("appointments")}>
              <Text style={styles.bookButtonText}>Book an Appointment</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Lab Tests */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="flask-outline" size={20} color="#1F2937" />
              <Text style={styles.sectionTitle}>Recent Lab Tests</Text>
            </View>
            <TouchableOpacity onPress={() => setActiveView("labReports")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#10B981" style={{ marginVertical: 20 }} />
          ) : (
            recentLabTests.map((test) => (
              <View key={test.id} style={styles.labTestCard}>
                <View style={styles.labTestHeader}>
                  <Text style={styles.labTestTitle}>{test.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(test.status) }]}>
                    <Text style={styles.statusBadgeText}>{test.status}</Text>
                  </View>
                </View>
                <Text style={styles.labTestMeta}>{test.testType} • Dr. {test.doctor}</Text>
                <View style={styles.labTestFooter}>
                  <Text style={styles.labTestDate}>{test.date}</Text>
                  {test.urgency === 'high' && (
                    <View style={styles.urgencyBadge}>
                      <Text style={styles.urgencyBadgeText}>High Priority</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Active Prescriptions */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="prescription" size={20} color="#1F2937" />
              <Text style={styles.sectionTitle}>Active Prescriptions</Text>
            </View>
            <TouchableOpacity onPress={() => setActiveView("prescriptions")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#10B981" style={{ marginVertical: 20 }} />
          ) : (
            activePrescriptions.map((prescription) => (
              <View key={prescription.id} style={styles.prescriptionCard}>
                <View style={styles.prescriptionHeader}>
                  <Text style={styles.prescriptionId}>{prescription.prescriptionId}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.statusBadgeText}>active</Text>
                  </View>
                </View>
                <Text style={styles.prescriptionDoctor}>Dr. {prescription.doctor}</Text>
                <View style={styles.prescriptionFooter}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text style={styles.prescriptionDate}>Scanned: {prescription.scannedAt}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
        </ImageBackground>
      </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {renderMenuModal()}

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(243, 244, 246, 0.96)',
  },
  root: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: "#1E4BA3",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  viewAllText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "500",
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#E0F2FE",
    padding: 16,
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#374151",
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
  },
  actionsScroll: {
    flexDirection: "row",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonPrimary: {
    backgroundColor: "#10B981",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  actionButtonTextPrimary: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  emptyState: {
    backgroundColor: "#fff",
    padding: 40,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 20,
  },
  bookButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  labTestCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  labTestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  labTestTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },
  labTestMeta: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },
  labTestFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labTestDate: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  urgencyBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyBadgeText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },
  prescriptionCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  prescriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  prescriptionId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  prescriptionDoctor: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },
  prescriptionFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  prescriptionDate: {
    fontSize: 12,
    color: "#6B7280",
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
        shadowRadius: 10,
        shadowOffset: { width: 2, height: 0 },
      },
      android: { elevation: 16 },
    }),
  },
  menuHeader: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#11181C',
  },
  menuUserInfo: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  menuUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  menuUserRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
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
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
    marginHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});