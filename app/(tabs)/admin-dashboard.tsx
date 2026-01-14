import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
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
import AdminAddUser from '../../components/admin/AdminAddUser';
import AdminAppointments from '../../components/admin/AdminAppointments';
import AdminDoctorsRegistry from '../../components/admin/AdminDoctorsRegistry';
import AdminMessages from '../../components/admin/AdminMessages';
import AdminNotifications from '../../components/admin/AdminNotifications';
import AdminPatients from '../../components/admin/AdminPatients';
import AdminReports from '../../components/admin/AdminReports';
import AdminSettings from '../../components/admin/AdminSettings';
import AdminUserManagement from '../../components/admin/AdminUserManagement';
import { notificationsApi } from '../../src/api/notifications';
import { API_BASE_URL } from '../../src/config/constants';
import { sessionService } from '../../src/services/sessionService';
import { storageService } from '../../src/services/storageService';
// Animation imports removed - dashboard cards don't need animations for better performance

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;
const isTablet = width >= 768;

interface DashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalPharmacists: number;
  totalLabTechnicians: number;
  activeSessions: number;
  pendingApprovals: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  time: string;
  icon: string;
  color: string;
}

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

function notificationToRecentActivity(n: any): RecentActivity {
  const type = String(n?.type || 'system');
  const title = String(n?.title || 'Activity');
  const message = String(n?.message || '');
  const createdAt = String(n?.createdAt || n?.created_at || '');
  const metaEvent = String(n?.metadata?.event || '').toLowerCase();

  const description = message ? `${title} - ${message}` : title;
  const time = createdAt ? formatTimeAgo(createdAt) : '';

  // Keep a simple, readable mapping that matches the existing card UI.
  if (metaEvent.includes('appointment') || type === 'appointment') {
    return { id: String(n?.id), type, description, time, icon: 'calendar-check', color: '#3B82F6' };
  }
  if (metaEvent.includes('prescription') || type === 'prescription') {
    return { id: String(n?.id), type, description, time, icon: 'prescription', color: '#10B981' };
  }
  if (metaEvent.includes('lab') || metaEvent.includes('test') || type === 'lab') {
    return { id: String(n?.id), type, description, time, icon: 'flask', color: '#8B5CF6' };
  }
  if (metaEvent.includes('user') || type === 'user') {
    return { id: String(n?.id), type, description, time, icon: 'account-plus', color: '#10B981' };
  }
  if (type === 'alert') {
    return { id: String(n?.id), type, description, time, icon: 'alert-circle', color: '#F59E0B' };
  }

  return { id: String(n?.id), type, description, time, icon: 'cloud-check', color: '#8B5CF6' };
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [activeNav, setActiveNav] = useState<string>('dashboard');
  const [returnNavAfterAddUser, setReturnNavAfterAddUser] = useState<string>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalPharmacists: 0,
    totalLabTechnicians: 0,
    activeSessions: 0,
    pendingApprovals: 0
  });

  // Slow animations (600-1000ms)
  // ANIMATIONS REMOVED FOR BETTER PERFORMANCE

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [recentActivityLoading, setRecentActivityLoading] = useState(false);

  useEffect(() => {
    loadAdminData();
    refreshUserStats();
    void refreshSystemStatus();
    void refreshRecentActivity();
  }, []);

  const normalizeRole = (roleRaw: unknown) =>
    String(roleRaw ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-+/g, '_');

  const refreshUserStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          Accept: 'application/json',
        },
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
        return;
      }

      const list = Array.isArray(json.data) ? json.data : [];
      const totalUsers = list.length;
      const totalDoctors = list.filter((u: any) => normalizeRole(u?.role) === 'doctor').length;
      const totalPatients = list.filter((u: any) => normalizeRole(u?.role) === 'patient').length;
      const totalPharmacists = list.filter((u: any) => normalizeRole(u?.role) === 'pharmacist').length;
      const totalLabTechnicians = list.filter((u: any) => normalizeRole(u?.role) === 'lab_technician').length;

      setStats((prev) => ({
        ...prev,
        totalUsers,
        totalDoctors,
        totalPatients,
        totalPharmacists,
        totalLabTechnicians,
      }));
    } catch (error) {
      // best-effort; keep previous stats
      console.log('Failed to refresh user stats:', error);
    }
  };

  const refreshSystemStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reports/system-status`, {
        headers: {
          Accept: 'application/json',
        },
      });

      const rawText = await res.text();
      const json = (() => {
        try {
          return rawText ? JSON.parse(rawText) : null;
        } catch {
          return null;
        }
      })();

      if (!res.ok || !json?.success || !json?.data) {
        return;
      }

      const activeSessions = Number(json.data.activeSessions) || 0;
      const pendingApprovals = Number(json.data.pendingApprovals) || 0;

      setStats((prev) => ({
        ...prev,
        activeSessions,
        pendingApprovals,
      }));
    } catch (error) {
      // best-effort; keep previous stats
      console.log('Failed to refresh system status:', error);
    }
  };

  const loadAdminData = async () => {
    try {
      const user = await storageService.getUser();
      setAdminUser(user);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshRecentActivity = async () => {
    setRecentActivityLoading(true);
    try {
      const res = await notificationsApi.list();
      if (!res?.success || !Array.isArray(res.data)) {
        setRecentActivities([]);
        return;
      }

      const mapped = res.data
        .map(notificationToRecentActivity)
        .filter((a) => a.id);

      setRecentActivities(mapped.slice(0, 6));
    } catch {
      // best-effort
      setRecentActivities([]);
    } finally {
      setRecentActivityLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadAdminData(), refreshUserStats(), refreshSystemStatus(), refreshRecentActivity()]);
    setRefreshing(false);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E4BA3ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={require('../../assets/images/Background-image.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.gradientOverlay} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => setMenuOpen(true)}
            >
              <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
            <View>
              <RNText style={styles.greeting}>Welcome Back, Admin</RNText>
              <RNText style={styles.userName}>{adminUser?.fullName || 'Administrator'}</RNText>
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
            {/* Menu Sidebar */}
            <View style={styles.menuContainer}>
              {/* Menu Header */}
              <View style={styles.menuHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
                  <RNText style={styles.menuTitle}>Medi Vault</RNText>
                  <TouchableOpacity onPress={() => setMenuOpen(false)}>
                    <Ionicons name="close" size={28} color="#1F2937" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Menu Items */}
              <ScrollView style={styles.menuContent}>
                <TouchableOpacity
                  style={[styles.menuItem, activeNav === 'dashboard' && styles.menuItemActive]}
                  onPress={() => { setActiveNav('dashboard'); setMenuOpen(false); }}
                >
                  <MaterialCommunityIcons name="view-dashboard" size={24} color="#1F2937" />
                  <RNText style={styles.menuItemText}>Dashboard</RNText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, activeNav === 'users' && styles.menuItemActive]}
                  onPress={() => { setActiveNav('users'); setMenuOpen(false); }}
                >
                  <MaterialCommunityIcons name="account-cog" size={24} color="#1F2937" />
                  <RNText style={styles.menuItemText}>User Management</RNText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, activeNav === 'patients' && styles.menuItemActive]}
                  onPress={() => { setActiveNav('patients'); setMenuOpen(false); }}
                >
                  <MaterialCommunityIcons name="account-heart" size={24} color="#1F2937" />
                  <RNText style={styles.menuItemText}>Patients</RNText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, activeNav === 'doctors' && styles.menuItemActive]}
                  onPress={() => { setActiveNav('doctors'); setMenuOpen(false); }}
                >
                  <MaterialCommunityIcons name="doctor" size={24} color="#1F2937" />
                  <RNText style={styles.menuItemText}>Doctors</RNText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, activeNav === 'appointments' && styles.menuItemActive]}
                  onPress={() => { setActiveNav('appointments'); setMenuOpen(false); }}
                >
                  <MaterialCommunityIcons name="calendar-clock" size={24} color="#1F2937" />
                  <RNText style={styles.menuItemText}>Appointments</RNText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, activeNav === 'messages' && styles.menuItemActive]}
                  onPress={() => { setActiveNav('messages'); setMenuOpen(false); }}
                >
                  <Ionicons name="chatbubbles-outline" size={24} color="#1F2937" />
                  <RNText style={styles.menuItemText}>Messages</RNText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, activeNav === 'notifications' && styles.menuItemActive]}
                  onPress={() => { setActiveNav('notifications'); setMenuOpen(false); }}
                >
                  <Ionicons name="notifications-outline" size={24} color="#1F2937" />
                  <RNText style={styles.menuItemText}>Notifications</RNText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, activeNav === 'reports' && styles.menuItemActive]}
                  onPress={() => { setActiveNav('reports'); setMenuOpen(false); }}
                >
                  <MaterialCommunityIcons name="file-chart" size={24} color="#1F2937" />
                  <RNText style={styles.menuItemText}>Reports</RNText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, activeNav === 'settings' && styles.menuItemActive]}
                  onPress={() => { setActiveNav('settings'); setMenuOpen(false); }}
                >
                  <Ionicons name="settings-outline" size={24} color="#1F2937" />
                  <RNText style={styles.menuItemText}>System Settings</RNText>
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
                  <Ionicons name="log-out-outline" size={24} color="#1F2937" />
                  <RNText style={styles.menuItemText}>Back to Login</RNText>
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

        {activeNav === 'add-user' ? (
          <AdminAddUser 
            onBack={() => setActiveNav(returnNavAfterAddUser)}
            onUserAdded={(user: any) => {
              console.log('New user added:', user);
              void refreshUserStats();
              setActiveNav(returnNavAfterAddUser);
            }}
          />
        ) : activeNav === 'messages' ? (
          <AdminMessages/>
        ) : activeNav === 'notifications' ? (
          <AdminNotifications />
        ) : activeNav === 'users' ? (
          <AdminUserManagement
            onAddUser={() => {
              setReturnNavAfterAddUser('users');
              setActiveNav('add-user');
            }}
            onUsersChanged={() => void refreshUserStats()}
          />
        ) : activeNav === 'patients' ? (
          <AdminPatients />
        ) : activeNav === 'doctors' ? (
          <AdminDoctorsRegistry />
        ) : activeNav === 'appointments' ? (
          <AdminAppointments />
        ) : activeNav === 'reports' ? (
          <AdminReports />
        ) : activeNav === 'settings' ? (
          <AdminSettings />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* Quick Stats Grid - Animations removed for performance */}
            <View style={styles.section}>
            <RNText style={styles.sectionTitle}>Dashboard Overview</RNText>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#3B82F615' }]}>
                  <MaterialCommunityIcons name="account-group" size={28} color="#3B82F6" />
                </View>
                <RNText style={styles.statValue}>{stats.totalUsers.toLocaleString()}</RNText>
                <RNText style={styles.statLabel}>Total Users</RNText>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#10B98115' }]}>
                  <MaterialCommunityIcons name="doctor" size={28} color="#10B981" />
                </View>
                <RNText style={styles.statValue}>{stats.totalDoctors}</RNText>
                <RNText style={styles.statLabel}>Doctors</RNText>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF615' }]}>
                  <MaterialCommunityIcons name="account-heart" size={28} color="#8B5CF6" />
                </View>
                <RNText style={styles.statValue}>{stats.totalPatients.toLocaleString()}</RNText>
                <RNText style={styles.statLabel}>Patients</RNText>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF615' }]}>
                  <MaterialCommunityIcons name="pill" size={28} color="#8B5CF6" />
                </View>
                <RNText style={styles.statValue}>{stats.totalPharmacists.toLocaleString()}</RNText>
                <RNText style={styles.statLabel}>Pharmacists</RNText>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B15' }]}>
                  <MaterialCommunityIcons name="flask" size={28} color="#F59E0B" />
                </View>
                <RNText style={styles.statValue}>{stats.totalLabTechnicians.toLocaleString()}</RNText>
                <RNText style={styles.statLabel}>Lab Technicians</RNText>
              </View>
            </View>
          </View>

          {/* System Status - Animation removed for performance */}
          <View style={styles.section}>
            <View style={styles.systemStatusCard}>
              <View style={styles.systemStatusHeader}>
                <MaterialCommunityIcons name="shield-check" size={24} color="#10B981" />
                <RNText style={styles.systemStatusTitle}>System Status</RNText>
              </View>
              <View style={styles.systemStatusRow}>
                <RNText style={styles.systemStatusLabel}>Active Sessions</RNText>
                <RNText style={styles.systemStatusValue}>{stats.activeSessions}</RNText>
              </View>
              <View style={styles.systemStatusRow}>
                <RNText style={styles.systemStatusLabel}>Pending Approvals</RNText>
                <View style={styles.pendingBadge}>
                  <RNText style={styles.pendingBadgeText}>{stats.pendingApprovals}</RNText>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions - Animation removed for performance */}
          <View style={styles.section}>
            <RNText style={styles.sectionTitle}>Quick Actions</RNText>
            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => {
                  setReturnNavAfterAddUser('users');
                  setActiveNav('add-user');
                }}
              >
                <MaterialCommunityIcons name="account-plus" size={32} color="#3B82F6" />
                <RNText style={styles.actionText}>Add User</RNText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => setActiveNav('doctors')}
              >
                <MaterialCommunityIcons name="doctor" size={32} color="#10B981" />
                <RNText style={styles.actionText}>Manage Doctors</RNText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => setActiveNav('reports')}
              >
                <MaterialCommunityIcons name="file-document" size={32} color="#8B5CF6" />
                <RNText style={styles.actionText}>Reports</RNText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => setActiveNav('settings')}
              >
                <MaterialCommunityIcons name="cog" size={32} color="#F59E0B" />
                <RNText style={styles.actionText}>Settings</RNText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Activity  */}
          <View style={styles.section}>
            <RNText style={styles.sectionTitle}>Recent Activity</RNText>
            {recentActivityLoading && !recentActivities.length ? (
              <View style={styles.activityCard}>
                <View style={[styles.activityIcon, { backgroundColor: '#6B728015' }]}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#6B7280" />
                </View>
                <View style={styles.activityContent}>
                  <RNText style={styles.activityDescription}>Loading recent activity…</RNText>
                  <RNText style={styles.activityTime}>—</RNText>
                </View>
              </View>
            ) : recentActivities.length ? (
              recentActivities.map((activity) => (
                <View key={activity.id} style={styles.activityCard}>
                  <View style={[styles.activityIcon, { backgroundColor: `${activity.color}15` }]}>
                    <MaterialCommunityIcons name={activity.icon as any} size={20} color={activity.color} />
                  </View>
                  <View style={styles.activityContent}>
                    <RNText style={styles.activityDescription}>{activity.description}</RNText>
                    <RNText style={styles.activityTime}>{activity.time}</RNText>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.activityCard}>
                <View style={[styles.activityIcon, { backgroundColor: '#6B728015' }]}>
                  <MaterialCommunityIcons name="bell-off" size={20} color="#6B7280" />
                </View>
                <View style={styles.activityContent}>
                  <RNText style={styles.activityDescription}>No recent activity</RNText>
                  <RNText style={styles.activityTime}>—</RNText>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
        )}

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => setActiveNav('dashboard')}
          >
            <Ionicons
              name={activeNav === 'dashboard' ? 'home' : 'home-outline'}
              size={24}
              color={activeNav === 'dashboard' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            />
            <RNText style={[styles.bottomNavText, activeNav === 'dashboard' && styles.bottomNavTextActive]}>
              Home
            </RNText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => setActiveNav('users')}
          >
            <MaterialCommunityIcons
              name={activeNav === 'users' ? 'account-group' : 'account-group-outline'}
              size={24}
              color={activeNav === 'users' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            />
            <RNText style={[styles.bottomNavText, activeNav === 'users' && styles.bottomNavTextActive]}>
              Users
            </RNText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => setActiveNav('appointments')}
          >
            <MaterialCommunityIcons
              name={activeNav === 'appointments' ? 'calendar-check' : 'calendar-check-outline'}
              size={24}
              color={activeNav === 'appointments' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            />
            <RNText style={[styles.bottomNavText, activeNav === 'appointments' && styles.bottomNavTextActive]}>
              Appointments
            </RNText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={() => setActiveNav('reports')}
          >
            <MaterialCommunityIcons
              name={activeNav === 'reports' ? 'chart-bar' : 'chart-bar'}
              size={24}
              color={activeNav === 'reports' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            />
            <RNText style={[styles.bottomNavText, activeNav === 'reports' && styles.bottomNavTextActive]}>
              Reports
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
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
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
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  systemStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
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
  systemStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  systemStatusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  systemStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  systemStatusLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  systemStatusValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  pendingBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
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
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    gap: 12,
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
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
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
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
    marginHorizontal: 20,
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

