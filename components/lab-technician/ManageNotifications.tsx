import { notificationsApi } from '@/api/notifications';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ImageBackground,
  Platform,
  Text as RNText,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

type ManageNotificationsProps = {
  embedded?: boolean;
  showBackground?: boolean;
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

export default function ManageNotifications({ embedded = false, showBackground = true }: ManageNotificationsProps) {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const refresh = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await notificationsApi.list();
      if (!res?.success) throw new Error(res?.message || 'Failed to load notifications');
      const mapped = (Array.isArray(res.data) ? res.data : []).map((n: any) => ({
        id: String(n?.id),
        title: String(n?.title || 'Notification'),
        message: String(n?.message || ''),
        createdAt: String(n?.createdAt || ''),
        read: Boolean(n?.read),
      }));
      setNotifications(mapped);
    } catch (e: any) {
      setLoadError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const header = (
    <View style={styles.header}>
      <RNText style={styles.headerTitle}>Notifications</RNText>
      <RNText style={styles.headerSubtitle}>
        {notifications.length} total notifications{unreadCount ? ` • ${unreadCount} unread` : ''}
      </RNText>

      <View style={{ marginTop: 10 }}>
        <TouchableOpacity onPress={refresh} disabled={loading}>
          <RNText style={{ color: '#1E4BA3ff', fontWeight: '700' }}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </RNText>
        </TouchableOpacity>
        {!!loadError && <RNText style={{ marginTop: 6, color: '#EF4444' }}>{loadError}</RNText>}
      </View>
    </View>
  );

  const listItems = (
    <View style={embedded ? styles.embeddedList : styles.notificationsContent}>
      {notifications.length === 0 ? (
        <View style={styles.notificationCard}>
          <View style={[styles.statusIndicator, { backgroundColor: '#6B7280' }]} />
          <View style={styles.notificationContent}>
            <RNText style={styles.testName}>No notifications</RNText>
            <RNText style={styles.recipient}>New notifications will appear here.</RNText>
          </View>
        </View>
      ) : notifications.map((notif) => (
        <View key={notif.id} style={styles.notificationCard}>
          <View style={[styles.statusIndicator, { backgroundColor: notif.read ? '#10B981' : '#F59E0B' }]} />
          <View style={styles.notificationContent}>
            <RNText style={styles.testName}>{notif.title}</RNText>
            <RNText style={styles.recipient}>{notif.message}</RNText>
            <View style={styles.notificationFooter}>
              <Ionicons name={notif.read ? 'checkmark-circle' : 'time'} size={16} color={notif.read ? '#10B981' : '#F59E0B'} />
              <RNText style={styles.statusText}>{notif.read ? 'READ' : 'UNREAD'}</RNText>
              <RNText style={styles.dateText}>{formatTime(notif.createdAt)}</RNText>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  if (embedded) {
    return (
      <View style={styles.embeddedContainer}>
        {header}
        {listItems}
      </View>
    );
  }

  const body = (
    <>
      {header}
      <ScrollView style={styles.notificationsList} contentContainerStyle={styles.notificationsContent}>
        {listItems}
      </ScrollView>
    </>
  );

  if (!showBackground) {
    return <View style={styles.container}>{body}</View>;
  }

  return (
    <ImageBackground source={require('../../assets/images/Background-image.jpg')} style={styles.container} resizeMode="cover">
      {body}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  embeddedContainer: { flex: 1, backgroundColor: 'transparent' },
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }) },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#6B7280' },
  notificationsList: { flex: 1, backgroundColor: 'transparent' },
  notificationsContent: { padding: 16 },
  embeddedList: { padding: 16 },
  notificationCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 3 } }) },
  statusIndicator: { width: 4, borderRadius: 2, marginRight: 12 },
  notificationContent: { flex: 1 },
  testName: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  recipient: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  notificationFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  dateText: { fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' },
});

