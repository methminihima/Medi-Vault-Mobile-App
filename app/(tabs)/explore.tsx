import { navigationService } from '@/services/navigationService';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text as RNText, StyleSheet, TouchableOpacity, View } from 'react-native';
import ManageNotifications from '../../components/lab-technician/ManageNotifications';
import AppointmentsView from '../../components/shared/AppointmentsView';

export default function ExploreScreen() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'appointments' | 'notifications'>('appointments');

  const goToLogin = async () => {
    try {
      await navigationService.logout();
    } catch {
      // best-effort logout
    }

    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={[styles.toggleButton, activeSection === 'appointments' && styles.toggleButtonActive]}
            onPress={() => setActiveSection('appointments')}
            activeOpacity={0.8}
          >
            <RNText style={[styles.toggleText, activeSection === 'appointments' && styles.toggleTextActive]}>Appointments</RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, activeSection === 'notifications' && styles.toggleButtonActive]}
            onPress={() => setActiveSection('notifications')}
            activeOpacity={0.8}
          >
            <RNText style={[styles.toggleText, activeSection === 'notifications' && styles.toggleTextActive]}>Notifications</RNText>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.backToLoginButton} onPress={goToLogin} activeOpacity={0.8}>
          <RNText style={styles.backToLoginText}>Back to Login</RNText>
        </TouchableOpacity>
      </View>
      {activeSection === 'appointments' ? (
        <AppointmentsView userRole="patient" />
      ) : (
        <ManageNotifications showBackground={false} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 13,
  },
  toggleTextActive: {
    color: '#fff',
  },
  backToLoginButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backToLoginText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

