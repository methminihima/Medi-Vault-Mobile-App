import { notificationsApi } from '@/api/notifications';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ImageBackground,
    Platform,
    Text as RNText,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

type PatientNotificationsProps = {
  showBackground?: boolean;
  onMenu?: () => void;
};

interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  color: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

function toPresentation(n: any): Notification {
  const type = String(n?.type || 'system');
  const title = String(n?.title || 'Notification');
  const description = String(n?.message || '');
  const read = Boolean(n?.read);
  const time = formatTime(String(n?.createdAt || ''));

  const metaEvent = String(n?.metadata?.event || '');

  // Keep the same visual mapping style as admin.
  if (type === 'user' || metaEvent === 'user_created') {
    return {
      id: String(n?.id),
      type,
      title,
      description,
      time,
      read,
      priority: 'medium',
      icon: 'person-add',
      color: '#007AFF',
    };
  }

  if (type === 'system' || metaEvent === 'account_created') {
    return {
      id: String(n?.id),
      type,
      title,
      description,
      time,
      read,
      priority: 'low',
      icon: 'construct',
      color: '#5856D6',
    };
  }

  // Appointment/lab/prescription style default.
  return {
    id: String(n?.id),
    type,
    title,
    description,
    time,
    read,
    priority: 'low',
    icon: 'alert-circle',
    color: '#FF3B30',
  };
}

export default function PatientNotifications({ showBackground = true, onMenu }: PatientNotificationsProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'system'>('all');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await notificationsApi.list();
      if (!res?.success) throw new Error(res?.message || 'Failed to load notifications');
      const mapped = (Array.isArray(res.data) ? res.data : []).map(toPresentation);
      setNotifications(mapped);
    } catch (e: any) {
      setLoadError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return undefined;
    }, [refresh])
  );

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationsApi.delete(id);
    } catch {
      // ignore
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notif) => {
        if (activeTab === 'unread') return !notif.read;
        if (activeTab === 'system') return notif.type === 'system' || notif.type === 'alert';
        return true;
      }),
    [notifications, activeTab]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;
  const systemCount = notifications.filter((n) => n.type === 'system' || n.type === 'alert').length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#FF3B30';
      case 'medium':
        return '#FF9500';
      case 'low':
      default:
        return '#6B7280';
    }
  };

  const content = (
    <>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleRow}>
            {!!onMenu && (
              <TouchableOpacity onPress={onMenu} style={styles.menuIconButton}>
                <Ionicons name="menu" size={24} color="#1F2937" />
              </TouchableOpacity>
            )}
            <RNText style={styles.headerTitle}>Notifications</RNText>
          </View>
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Ionicons name="checkmark-done" size={20} color="#007AFF" />
            <RNText style={styles.markAllText}>Mark All Read</RNText>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
          <TouchableOpacity onPress={refresh} disabled={loading}>
            <RNText style={{ color: '#007AFF', fontWeight: '600' }}>{loading ? 'Refreshing…' : 'Refresh'}</RNText>
          </TouchableOpacity>
          {!!loadError && <RNText style={{ color: '#EF4444', marginTop: 6 }}>{loadError}</RNText>}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <RNText style={styles.statValue}>{notifications.length}</RNText>
            <RNText style={styles.statLabel}>Total</RNText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <RNText style={[styles.statValue, { color: '#FF3B30' }]}>{unreadCount}</RNText>
            <RNText style={styles.statLabel}>Unread</RNText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <RNText style={[styles.statValue, { color: '#5856D6' }]}>{systemCount}</RNText>
            <RNText style={styles.statLabel}>System</RNText>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'all' && styles.tabActive]} onPress={() => setActiveTab('all')}>
            <RNText style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All ({notifications.length})</RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'unread' && styles.tabActive]}
            onPress={() => setActiveTab('unread')}
          >
            <RNText style={[styles.tabText, activeTab === 'unread' && styles.tabTextActive]}>Unread ({unreadCount})</RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'system' && styles.tabActive]}
            onPress={() => setActiveTab('system')}
          >
            <RNText style={[styles.tabText, activeTab === 'system' && styles.tabTextActive]}>System ({systemCount})</RNText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-off" size={64} color="#9CA3AF" />
            <RNText style={styles.emptyTitle}>No Notifications</RNText>
            <RNText style={styles.emptyText}>
              {activeTab === 'unread'
                ? "You're all caught up! No unread notifications."
                : activeTab === 'system'
                ? 'No system notifications at this time.'
                : 'No notifications to display.'}
            </RNText>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {filteredNotifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[styles.notificationCard, !notification.read && styles.notificationUnread]}
                onPress={() => !notification.read && markAsRead(notification.id)}
                activeOpacity={0.85}
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.iconContainer}>
                    <View style={[styles.iconBackground, { backgroundColor: `${notification.color}20` }]}>
                      <Ionicons name={notification.icon as any} size={24} color={notification.color} />
                    </View>
                  </View>
                  <View style={styles.notificationInfo}>
                    <View style={styles.notificationTitleRow}>
                      <RNText style={styles.notificationTitle} numberOfLines={1}>
                        {notification.title}
                      </RNText>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                    <RNText style={styles.notificationTime}>{notification.time}</RNText>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteNotification(notification.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <RNText style={styles.notificationDescription}>{notification.description}</RNText>

                <View style={styles.notificationFooter}>
                  <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(notification.priority)}20` }]}>
                    <RNText style={[styles.priorityText, { color: getPriorityColor(notification.priority) }]}>
                      {notification.priority.toUpperCase()}
                    </RNText>
                  </View>
                  <RNText style={styles.readStatus}>{notification.read ? 'READ' : 'UNREAD'}</RNText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );

  if (!showBackground) {
    return <View style={styles.container}>{content}</View>;
  }

  return (
    <ImageBackground
      source={require('../../assets/images/Background-image.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      {content}
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  menuIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  markAllText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    paddingVertical: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 15,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  notificationsList: {
    gap: 16,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  notificationUnread: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  deleteButton: {
    padding: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  readStatus: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
});
