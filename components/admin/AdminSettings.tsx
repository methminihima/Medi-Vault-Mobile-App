import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    ImageBackground,
    Platform,
    Text as RNText,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View
} from 'react-native';

export default function AdminSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleBackup = () => {
    Alert.alert(
      'Backup Database',
      'Are you sure you want to backup the database?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Backup', onPress: () => Alert.alert('Success', 'Database backup completed successfully') }
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Success', 'Cache cleared successfully') }
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to default values. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => Alert.alert('Success', 'Settings reset to defaults') }
      ]
    );
  };

  return (
    <ImageBackground
      source={require('../../assets/images/Background-image.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Header */}
      <View style={styles.header}>
        <RNText style={styles.headerTitle}>System Settings</RNText>
        <RNText style={styles.headerSubtitle}>Configure system preferences and options</RNText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* General Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cog" size={20} color="#1E4BA3ff" />
            <RNText style={styles.sectionTitle}>General Settings</RNText>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <RNText style={styles.settingLabel}>Maintenance Mode</RNText>
                <RNText style={styles.settingDescription}>Temporarily disable system access</RNText>
              </View>
              <Switch
                value={maintenanceMode}
                onValueChange={setMaintenanceMode}
                trackColor={{ false: '#E5E7EB', true: '#1E4BA3ff' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <RNText style={styles.settingLabel}>Dark Mode</RNText>
                <RNText style={styles.settingDescription}>Enable dark theme interface</RNText>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#E5E7EB', true: '#1E4BA3ff' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <RNText style={styles.settingLabel}>Auto Backup</RNText>
                <RNText style={styles.settingDescription}>Automatically backup data daily</RNText>
              </View>
              <Switch
                value={autoBackup}
                onValueChange={setAutoBackup}
                trackColor={{ false: '#E5E7EB', true:'#1E4BA3ff' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="bell" size={20} color="#FF9500" />
            <RNText style={styles.sectionTitle}>Notifications</RNText>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <RNText style={styles.settingLabel}>Push Notifications</RNText>
                <RNText style={styles.settingDescription}>Receive system notifications</RNText>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E5E7EB', true: '#1E4BA3ff'}}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <RNText style={styles.settingLabel}>Email Notifications</RNText>
                <RNText style={styles.settingDescription}>Send alerts via email</RNText>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: '#E5E7EB', true: '#1E4BA3ff' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <RNText style={styles.settingLabel}>SMS Notifications</RNText>
                <RNText style={styles.settingDescription}>Send alerts via SMS</RNText>
              </View>
              <Switch
                value={smsNotifications}
                onValueChange={setSmsNotifications}
                trackColor={{ false: '#E5E7EB', true: '#1E4BA3ff' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="shield-check" size={20} color="#34C759" />
            <RNText style={styles.sectionTitle}>Security</RNText>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <RNText style={styles.settingLabel}>Two-Factor Authentication</RNText>
                <RNText style={styles.settingDescription}>Add extra layer of security</RNText>
              </View>
              <Switch
                value={twoFactorAuth}
                onValueChange={setTwoFactorAuth}
                trackColor={{ false: '#E5E7EB', true:'#1E4BA3ff' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <RNText style={styles.settingLabel}>Change Password</RNText>
                <RNText style={styles.settingDescription}>Update your account password</RNText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <RNText style={styles.settingLabel}>Session Timeout</RNText>
                <RNText style={styles.settingDescription}>30 minutes</RNText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* System Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="information" size={20} color="#5856D6" />
            <RNText style={styles.sectionTitle}>System Information</RNText>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <RNText style={styles.infoLabel}>System Version</RNText>
              <RNText style={styles.infoValue}>v2.5.1</RNText>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <RNText style={styles.infoLabel}>Database Size</RNText>
              <RNText style={styles.infoValue}>2.4 GB</RNText>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <RNText style={styles.infoLabel}>Last Backup</RNText>
              <RNText style={styles.infoValue}>2 hours ago</RNText>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <RNText style={styles.infoLabel}>Server Status</RNText>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <RNText style={styles.statusText}>Online</RNText>
              </View>
            </View>
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="database" size={20} color="#FF3B30" />
            <RNText style={styles.sectionTitle}>Data Management</RNText>
          </View>

          <View style={styles.actionCard}>
            <TouchableOpacity style={styles.actionButton} onPress={handleBackup}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#007AFF15' }]}>
                <MaterialCommunityIcons name="backup-restore" size={24} color='#1E4BA3ff' />
              </View>
              <View style={styles.actionInfo}>
                <RNText style={styles.actionLabel}>Backup Database</RNText>
                <RNText style={styles.actionDescription}>Create a backup of all data</RNText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionButton} onPress={handleClearCache}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#FF950015' }]}>
                <MaterialCommunityIcons name="cached" size={24} color="#FF9500" />
              </View>
              <View style={styles.actionInfo}>
                <RNText style={styles.actionLabel}>Clear Cache</RNText>
                <RNText style={styles.actionDescription}>Free up storage space</RNText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#34C75915' }]}>
                <MaterialCommunityIcons name="file-export" size={24} color="#34C759" />
              </View>
              <View style={styles.actionInfo}>
                <RNText style={styles.actionLabel}>Export Data</RNText>
                <RNText style={styles.actionDescription}>Download system data</RNText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#5856D615' }]}>
                <MaterialCommunityIcons name="file-import" size={24} color="#5856D6" />
              </View>
              <View style={styles.actionInfo}>
                <RNText style={styles.actionLabel}>Import Data</RNText>
                <RNText style={styles.actionDescription}>Upload data to system</RNText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="alert" size={20} color="#FF3B30" />
            <RNText style={[styles.sectionTitle, { color: '#FF3B30' }]}>Danger Zone</RNText>
          </View>

          <View style={styles.dangerCard}>
            <TouchableOpacity style={styles.dangerButton} onPress={handleResetSettings}>
              <View style={styles.dangerInfo}>
                <RNText style={styles.dangerLabel}>Reset All Settings</RNText>
                <RNText style={styles.dangerDescription}>Restore default configuration</RNText>
              </View>
              <Ionicons name="refresh" size={20} color="#FF3B30" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.dangerButton}>
              <View style={styles.dangerInfo}>
                <RNText style={styles.dangerLabel}>Clear All Data</RNText>
                <RNText style={styles.dangerDescription}>Permanently delete all records</RNText>
              </View>
              <Ionicons name="trash" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <View style={styles.aboutCard}>
            <RNText style={styles.aboutTitle}>MediVault Admin System</RNText>
            <RNText style={styles.aboutText}>
              Comprehensive healthcare management platform for efficient hospital operations.
            </RNText>
            <RNText style={styles.aboutVersion}>Version 2.5.1 (Build 2025.12.02)</RNText>
            <RNText style={styles.aboutCopyright}>© 2025 MediVault. All rights reserved.</RNText>
          </View>
        </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  settingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  dangerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    ...Platform.select({
      ios: {
        shadowColor: '#FF3B30',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  dangerInfo: {
    flex: 1,
  },
  dangerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 2,
  },
  dangerDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  aboutCard: {
    backgroundColor: '#a2e7f8ff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  aboutVersion: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  aboutCopyright: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

