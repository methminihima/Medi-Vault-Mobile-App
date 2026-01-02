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
    View
} from 'react-native';

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

  // Basic mapping for icons/colors in the existing UI style.
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

export default function AdminNotifications() {
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

  const filteredNotifications = useMemo(() => notifications.filter(notif => {
    if (activeTab === 'unread') return !notif.read;
    if (activeTab === 'system') return notif.type === 'system' || notif.type === 'alert';
    return true;
  }), [notifications, activeTab]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const systemCount = notifications.filter(n => n.type === 'system' || n.type === 'alert').length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/Background-image.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <RNText style={styles.headerTitle}>Notifications</RNText>
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Ionicons name="checkmark-done" size={20} color="#007AFF" />
            <RNText style={styles.markAllText}>Mark All Read</RNText>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
          <TouchableOpacity onPress={refresh} disabled={loading}>
            <RNText style={{ color: '#007AFF', fontWeight: '600' }}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </RNText>
          </TouchableOpacity>
          {!!loadError && <RNText style={{ color: '#EF4444', marginTop: 6 }}>{loadError}</RNText>}
        </View>

        {/* Stats */}
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

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <RNText style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              All ({notifications.length})
            </RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'unread' && styles.tabActive]}
            onPress={() => setActiveTab('unread')}
          >
            <RNText style={[styles.tabText, activeTab === 'unread' && styles.tabTextActive]}>
              Unread ({unreadCount})
            </RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'system' && styles.tabActive]}
            onPress={() => setActiveTab('system')}
          >
            <RNText style={[styles.tabText, activeTab === 'system' && styles.tabTextActive]}>
              System ({systemCount})
            </RNText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationUnread
                ]}
                onPress={() => !notification.read && markAsRead(notification.id)}
              >
                <View style={styles.notificationContent}>
                  <View style={[styles.notificationIcon, { backgroundColor: `${notification.color}15` }]}>
                    <Ionicons name={notification.icon as any} size={24} color={notification.color} />
                  </View>

                  <View style={styles.notificationBody}>
                    <View style={styles.notificationHeader}>
                      <RNText style={styles.notificationTitle}>{notification.title}</RNText>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                    <RNText style={styles.notificationDescription} numberOfLines={2}>
                      {notification.description}
                    </RNText>
                    <View style={styles.notificationFooter}>
                      <View style={styles.notificationMeta}>
                        <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                        <RNText style={styles.notificationTime}>{notification.time}</RNText>
                      </View>
                      <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(notification.priority)}15` }]}>
                        <RNText style={[styles.priorityText, { color: getPriorityColor(notification.priority) }]}>
                          {notification.priority.toUpperCase()}
                        </RNText>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.notificationActions}>
                  {!notification.read && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => markAsRead(notification.id)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={20} color="#007AFF" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => deleteNotification(notification.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    paddingBottom: 12,
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#007AFF15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 13,
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
    padding: 16,
  },
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  notificationUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    backgroundColor: '#F0F9FF',
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBody: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  notificationDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
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
  },
});

