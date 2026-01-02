import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text as RNText,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;

interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: 'doctor' | 'patient';
  read: boolean;
}

interface Chat {
  id: string;
  patientName: string;
  patientNIC: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: Message[];
}

export default function DMessages() {
  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      patientName: 'John Doe',
      patientNIC: '123456789V',
      lastMessage: 'Thank you doctor, I will take the medications as prescribed.',
      timestamp: '10:30 AM',
      unreadCount: 2,
      messages: [
        {
          id: 'm1',
          text: 'Hello Doctor, I have been experiencing some headaches.',
          timestamp: '10:15 AM',
          sender: 'patient',
          read: true,
        },
        {
          id: 'm2',
          text: 'Hello John. How long have you been experiencing these headaches?',
          timestamp: '10:20 AM',
          sender: 'doctor',
          read: true,
        },
        {
          id: 'm3',
          text: 'About 3 days now. They are worse in the morning.',
          timestamp: '10:25 AM',
          sender: 'patient',
          read: true,
        },
        {
          id: 'm4',
          text: 'I recommend you take some rest and drink plenty of water. I will prescribe some medication for you.',
          timestamp: '10:28 AM',
          sender: 'doctor',
          read: true,
        },
        {
          id: 'm5',
          text: 'Thank you doctor, I will take the medications as prescribed.',
          timestamp: '10:30 AM',
          sender: 'patient',
          read: false,
        },
      ],
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      patientNIC: '987654321V',
      lastMessage: 'When can I schedule my next appointment?',
      timestamp: 'Yesterday',
      unreadCount: 0,
      messages: [
        {
          id: 'm1',
          text: 'Good morning Doctor!',
          timestamp: 'Yesterday 2:30 PM',
          sender: 'patient',
          read: true,
        },
        {
          id: 'm2',
          text: 'Good morning Jane! How are you feeling?',
          timestamp: 'Yesterday 2:35 PM',
          sender: 'doctor',
          read: true,
        },
        {
          id: 'm3',
          text: 'Much better, thanks! When can I schedule my next appointment?',
          timestamp: 'Yesterday 2:40 PM',
          sender: 'patient',
          read: true,
        },
      ],
    },
  ]);

  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const filteredChats = chats.filter((chat) =>
    chat.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.patientNIC.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenChat = (chat: Chat) => {
    // Mark messages as read
    const updatedChats = chats.map((c) =>
      c.id === chat.id
        ? {
            ...c,
            unreadCount: 0,
            messages: c.messages.map((m) => ({ ...m, read: true })),
          }
        : c
    );
    setChats(updatedChats);
    setSelectedChat({ ...chat, unreadCount: 0 });
    setShowChatModal(true);
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedChat) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      text: messageText.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
      sender: 'doctor',
      read: true,
    };

    const updatedChat = {
      ...selectedChat,
      messages: [...selectedChat.messages, newMessage],
      lastMessage: newMessage.text,
      timestamp: 'Just now',
    };

    setSelectedChat(updatedChat);
    setChats((prev) =>
      prev.map((chat) => (chat.id === selectedChat.id ? updatedChat : chat))
    );
    setMessageText('');
  };

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedMessages([]);
    setShowOptionsMenu(false);
  };

  const toggleMessageSelection = (messageId: string) => {
    if (selectedMessages.includes(messageId)) {
      setSelectedMessages(selectedMessages.filter((id) => id !== messageId));
    } else {
      setSelectedMessages([...selectedMessages, messageId]);
    }
  };

  const handleDeleteSelectedMessages = () => {
    if (!selectedChat || selectedMessages.length === 0) return;

    Alert.alert(
      'Delete Messages',
      `Are you sure you want to delete ${selectedMessages.length} message(s)?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedMessages = selectedChat.messages.filter(
              (msg) => !selectedMessages.includes(msg.id)
            );

            // Update last message if the deleted message was the last one
            const lastMsg = updatedMessages[updatedMessages.length - 1];
            const updatedChat = {
              ...selectedChat,
              messages: updatedMessages,
              lastMessage: lastMsg ? lastMsg.text : 'No messages',
              timestamp: lastMsg ? lastMsg.timestamp : '',
            };

            setSelectedChat(updatedChat);
            setChats((prev) =>
              prev.map((chat) => (chat.id === selectedChat.id ? updatedChat : chat))
            );
            setSelectedMessages([]);
            setIsDeleteMode(false);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Chat List */}
      <View style={styles.section}>
        <RNText style={styles.sectionTitle}>Patient Messages</RNText>

        {filteredChats.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="message-outline" size={48} color="#9CA3AF" />
            <RNText style={styles.emptyText}>
              {searchQuery ? 'No chats found' : 'No messages yet'}
            </RNText>
            <RNText style={styles.emptySubtext}>
              {searchQuery
                ? 'Try searching with a different name or NIC'
                : 'Start a conversation with your patients'}
            </RNText>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredChats.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                style={styles.chatCard}
                onPress={() => handleOpenChat(chat)}
              >
                <View style={styles.chatAvatar}>
                  <MaterialCommunityIcons name="account" size={28} color="#1E4BA3" />
                </View>

                <View style={styles.chatContent}>
                  <View style={styles.chatHeader}>
                    <RNText style={styles.chatName}>{chat.patientName}</RNText>
                    <RNText style={styles.chatTime}>{chat.timestamp}</RNText>
                  </View>
                  <View style={styles.chatFooter}>
                    <RNText
                      style={[
                        styles.chatMessage,
                        chat.unreadCount > 0 && styles.chatMessageUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {chat.lastMessage}
                    </RNText>
                    {chat.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <RNText style={styles.unreadText}>{chat.unreadCount}</RNText>
                      </View>
                    )}
                  </View>
                  <RNText style={styles.chatNIC}>NIC: {chat.patientNIC}</RNText>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Chat Modal */}
      <Modal
        visible={showChatModal}
        animationType="slide"
        onRequestClose={() => setShowChatModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Chat Header */}
          <View style={styles.chatModalHeader}>
            {isDeleteMode ? (
              <>
                <TouchableOpacity
                  onPress={toggleDeleteMode}
                  style={styles.backButton}
                >
                  <Ionicons name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.chatHeaderInfo}>
                  <RNText style={styles.chatHeaderName}>
                    {selectedMessages.length} selected
                  </RNText>
                </View>
                <TouchableOpacity
                  onPress={handleDeleteSelectedMessages}
                  style={styles.deleteButton}
                  disabled={selectedMessages.length === 0}
                >
                  <Ionicons
                    name="trash"
                    size={24}
                    color={selectedMessages.length > 0 ? '#EF4444' : '#9CA3AF'}
                  />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => {
                    setShowChatModal(false);
                    setIsDeleteMode(false);
                    setSelectedMessages([]);
                  }}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.chatHeaderInfo}>
                  <RNText style={styles.chatHeaderName}>{selectedChat?.patientName}</RNText>
                  <RNText style={styles.chatHeaderNIC}>NIC: {selectedChat?.patientNIC}</RNText>
                </View>
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => setShowOptionsMenu(!showOptionsMenu)}
                >
                  <Ionicons name="ellipsis-vertical" size={24} color="#1F2937" />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Options Menu */}
          {showOptionsMenu && !isDeleteMode && (
            <View style={styles.optionsMenu}>
              <TouchableOpacity
                style={styles.optionsMenuItem}
                onPress={toggleDeleteMode}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <RNText style={styles.optionsMenuText}>Delete Messages</RNText>
              </TouchableOpacity>
            </View>
          )}

          {/* Messages */}
          <FlatList
            data={selectedChat?.messages || []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  if (isDeleteMode && item.sender === 'doctor') {
                    toggleMessageSelection(item.id);
                  }
                }}
                activeOpacity={isDeleteMode && item.sender === 'doctor' ? 0.7 : 1}
              >
                <View
                  style={[
                    styles.messageBubble,
                    item.sender === 'doctor'
                      ? styles.messageBubbleDoctor
                      : styles.messageBubblePatient,
                    isDeleteMode && selectedMessages.includes(item.id) && styles.messageBubbleSelected,
                  ]}
                >
                  {isDeleteMode && item.sender === 'doctor' && (
                    <View style={styles.checkboxContainer}>
                      <View
                        style={[
                          styles.checkbox,
                          selectedMessages.includes(item.id) && styles.checkboxSelected,
                        ]}
                      >
                        {selectedMessages.includes(item.id) && (
                          <Ionicons name="checkmark" size={16} color="#1E4BA3" />
                        )}
                      </View>
                    </View>
                  )}
                  <RNText
                    style={[
                      styles.messageText,
                      item.sender === 'doctor' && styles.messageTextDoctor,
                      isDeleteMode && item.sender === 'doctor' && styles.messageTextWithCheckbox,
                    ]}
                  >
                    {item.text}
                  </RNText>
                  <RNText
                    style={[
                      styles.messageTime,
                      item.sender === 'doctor' && styles.messageTimeDoctor,
                    ]}
                  >
                    {item.timestamp}
                  </RNText>
                </View>
              </TouchableOpacity>
            )}
          />

          {/* Message Input */}
          <View style={styles.messageInputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="attach" size={24} color="#6B7280" />
            </TouchableOpacity>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !messageText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!messageText.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={messageText.trim() ? '#fff' : '#9CA3AF'}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: isSmallScreen ? 14 : 15,
    color: '#1F2937',
  },
  section: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  chatTime: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#9CA3AF',
  },
  chatFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatMessage: {
    flex: 1,
    fontSize: isSmallScreen ? 13 : 14,
    color: '#6B7280',
  },
  chatMessageUnread: {
    fontWeight: '600',
    color: '#1F2937',
  },
  chatNIC: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#1E4BA3',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: isSmallScreen ? 10 : 11,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  chatModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: isSmallScreen ? 16 : 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  chatHeaderNIC: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#6B7280',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  optionsMenu: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    minWidth: 180,
  },
  optionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  optionsMenuText: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '500',
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
    position: 'relative',
  },
  messageBubbleDoctor: {
    alignSelf: 'flex-end',
    backgroundColor: '#1E4BA3',
    borderBottomRightRadius: 4,
  },
  messageBubblePatient: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageBubbleSelected: {
    opacity: 0.7,
    borderWidth: 2,
    borderColor: '#1E4BA3',
  },
  checkboxContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  messageText: {
    fontSize: isSmallScreen ? 14 : 15,
    color: '#1F2937',
    lineHeight: 20,
  },
  messageTextDoctor: {
    color: '#fff',
  },
  messageTextWithCheckbox: {
    paddingLeft: 32,
  },
  messageTime: {
    fontSize: isSmallScreen ? 10 : 11,
    color: '#6B7280',
    marginTop: 4,
  },
  messageTimeDoctor: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  attachButton: {
    padding: 8,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: isSmallScreen ? 14 : 15,
    color: '#1F2937',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#1E4BA3',
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});


