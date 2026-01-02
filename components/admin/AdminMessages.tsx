import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ImageBackground,
    Platform,
    Text as RNText,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface Message {
  id: string;
  sender: string;
  senderRole: string;
  subject: string;
  preview: string;
  time: string;
  isRead: boolean;
  avatar: string;
  priority: 'high' | 'normal' | 'low';
}

export default function AdminMessages() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'sent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [messages] = useState<Message[]>([
    {
      id: '1',
      sender: 'Dr. Sarah Johnson',
      senderRole: 'Cardiologist',
      subject: 'Patient Transfer Request',
      preview: 'I need to transfer a patient to the cardiology department...',
      time: '10 minutes ago',
      isRead: false,
      avatar: 'doctor',
      priority: 'high'
    },
    {
      id: '2',
      sender: 'John Smith',
      senderRole: 'Patient',
      subject: 'Appointment Rescheduling',
      preview: 'Could you please help me reschedule my appointment...',
      time: '1 hour ago',
      isRead: false,
      avatar: 'account',
      priority: 'normal'
    },
    {
      id: '3',
      sender: 'Pharmacy Department',
      senderRole: 'Staff',
      subject: 'Medication Stock Alert',
      preview: 'Running low on essential medications, immediate restock needed...',
      time: '2 hours ago',
      isRead: true,
      avatar: 'pill',
      priority: 'high'
    },
    {
      id: '4',
      sender: 'Dr. Michael Chen',
      senderRole: 'Neurologist',
      subject: 'Equipment Request',
      preview: 'Requesting approval for new diagnostic equipment...',
      time: '5 hours ago',
      isRead: true,
      avatar: 'doctor',
      priority: 'normal'
    },
    {
      id: '5',
      sender: 'Lab Department',
      senderRole: 'Staff',
      subject: 'Test Results Ready',
      preview: 'Multiple test results are ready for review and approval...',
      time: '1 day ago',
      isRead: true,
      avatar: 'flask',
      priority: 'low'
    },
    {
      id: '6',
      sender: 'Emma Wilson',
      senderRole: 'Patient',
      subject: 'Medical Records Request',
      preview: 'I need access to my medical records from last year...',
      time: '1 day ago',
      isRead: true,
      avatar: 'account',
      priority: 'normal'
    }
  ]);

  const filteredMessages = messages.filter(message => {
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'unread' ? !message.isRead :
      activeTab === 'sent' ? false : true;
    
    const matchesSearch = 
      searchQuery === '' ||
      message.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.preview.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const unreadCount = messages.filter(m => !m.isRead).length;

  const getAvatarColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'cardiologist':
      case 'neurologist':
      case 'doctor':
        return '#10B981';
      case 'patient':
        return '#3B82F6';
      case 'staff':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'normal':
        return '#3B82F6';
      case 'low':
        return '#6B7280';
      default:
        return '#6B7280';
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
          <RNText style={styles.headerTitle}>Messages</RNText>
          <TouchableOpacity style={styles.composeButton}>
            <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
            <RNText style={styles.composeButtonText}>New Message</RNText>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <RNText style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              All Messages
            </RNText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'unread' && styles.tabActive]}
            onPress={() => setActiveTab('unread')}
          >
            <RNText style={[styles.tabText, activeTab === 'unread' && styles.tabTextActive]}>
              Unread
            </RNText>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <RNText style={styles.badgeText}>{unreadCount}</RNText>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'sent' && styles.tabActive]}
            onPress={() => setActiveTab('sent')}
          >
            <RNText style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}>
              Sent
            </RNText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      <ScrollView 
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="message-outline" size={64} color="#D1D5DB" />
            <RNText style={styles.emptyText}>No messages found</RNText>
            <RNText style={styles.emptySubtext}>
              {activeTab === 'unread' 
                ? 'All caught up! No unread messages.'
                : activeTab === 'sent'
                ? 'No sent messages yet.'
                : searchQuery
                ? 'Try adjusting your search.'
                : 'Your inbox is empty.'}
            </RNText>
          </View>
        ) : (
          filteredMessages.map((message) => (
            <TouchableOpacity key={message.id} style={styles.messageCard} activeOpacity={0.7}>
              <View style={styles.messageLeft}>
                <View style={[styles.avatarContainer, { backgroundColor: `${getAvatarColor(message.senderRole)}15` }]}>
                  <MaterialCommunityIcons 
                    name={message.avatar as any} 
                    size={24} 
                    color={getAvatarColor(message.senderRole)} 
                  />
                </View>
              </View>

              <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                  <View style={styles.messageSenderInfo}>
                    <RNText style={[styles.messageSender, !message.isRead && styles.messageUnread]}>
                      {message.sender}
                    </RNText>
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(message.priority) }]} />
                  </View>
                  <RNText style={styles.messageTime}>{message.time}</RNText>
                </View>

                <RNText style={styles.messageRole}>{message.senderRole}</RNText>
                <RNText style={[styles.messageSubject, !message.isRead && styles.messageUnread]}>
                  {message.subject}
                </RNText>
                <RNText style={styles.messagePreview} numberOfLines={2}>
                  {message.preview}
                </RNText>

                <View style={styles.messageFooter}>
                  {!message.isRead && (
                    <View style={styles.unreadIndicator}>
                      <RNText style={styles.unreadIndicatorText}>NEW</RNText>
                    </View>
                  )}
                  {message.priority === 'high' && (
                    <View style={styles.priorityBadge}>
                      <MaterialCommunityIcons name="alert" size={12} color="#EF4444" />
                      <RNText style={styles.priorityBadgeText}>High Priority</RNText>
                    </View>
                  )}
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Quick Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="email" size={20} color="#3B82F6" />
          <RNText style={styles.statText}>{messages.length} Total</RNText>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="email-open" size={20} color="#10B981" />
          <RNText style={styles.statText}>{messages.filter(m => m.isRead).length} Read</RNText>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
          <RNText style={styles.statText}>{messages.filter(m => m.priority === 'high').length} Priority</RNText>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
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
  composeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E4BA3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  composeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#1E4BA315',
    borderWidth: 1,
    borderColor: '#1E4BA3',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#1E4BA3',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  messagesList: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  messagesContent: {
    padding: 16,
  },
  messageCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
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
  messageLeft: {
    marginRight: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageSenderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  messageSender: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  messageUnread: {
    fontWeight: '700',
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  messageTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  messageRole: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  messageSubject: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadIndicator: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unreadIndicatorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  priorityBadgeText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
});

