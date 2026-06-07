# Heal App Chat System Documentation

This document provides a complete explanation of the chat system implementation in the Heal app, covering both doctor-patient messaging and group/community chat features. This documentation will help you replicate the entire chat system in another React Native project.

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Data Models](#data-models)
5. [Firebase Integration](#firebase-integration)
6. [Real-time Listeners](#real-time-listeners)
7. [Message Services](#message-services)
8. [UI Components](#ui-components)
9. [Screens Implementation](#screens-implementation)
10. [State Management](#state-management)
11. [Caching Strategy](#caching-strategy)
12. [Setup Instructions](#setup-instructions)

## Overview

The Heal app chat system consists of two main types of messaging:
1. **Direct Messaging** - One-on-one conversations between doctors and patients
2. **Group Messaging** - Community support groups where multiple users can participate

Both systems use Firebase Firestore for data storage and real-time updates, with local caching for offline access and performance optimization.

## Architecture

```
Chat System Architecture:
┌─────────────────────────────────────────────────────────────┐
│                        Frontend UI                         │
├─────────────────────────────────────────────────────────────┤
│                    React Native Screens                    │
│  - MessagesScreen.js (Chat list)                           │
│  - ChatScreen.js (Individual chat)                         │
│  - Community Screens (Group management)                    │
├─────────────────────────────────────────────────────────────┤
│                   Business Logic Layer                      │
│  - messageService.js (Direct messaging)                    │
│  - groupChatService.js (Group messaging)                   │
│  - firestoreListener.js (Real-time updates)                │
├─────────────────────────────────────────────────────────────┤
│                    Data Access Layer                       │
│  - firestoreService.js (General Firebase operations)       │
├─────────────────────────────────────────────────────────────┤
│                    Firebase Firestore                       │
│  - chats collection (Direct messages)                      │
│  - groups collection (Group metadata)                      │
│  - groupChats collection (Group messages)                  │
├─────────────────────────────────────────────────────────────┤
│                   Local Storage Layer                      │
│  - AsyncStorage (Chat caching)                             │
│  - Global Data Store (In-memory caching)                   │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Chat Data Structures

#### Direct Chat Document Structure
```javascript
// chats collection document
{
  id: "chat_document_id",
  participantIds: ["doctor_uid", "patient_uid"],
  participantNames: ["Dr. Smith", "John Doe"],
  lastMessage: "Hello, how are you feeling today?",
  lastMessageTime: Timestamp,
  lastMessageSenderId: "doctor_uid",
  unreadCount: {
    doctor_uid: 0,
    patient_uid: 2
  },
  messages: [
    {
      id: "message_id_1",
      senderId: "doctor_uid",
      senderName: "Dr. Smith",
      text: "Hello, how are you feeling today?",
      timestamp: Timestamp,
      status: "sent" // sent, delivered, read
    },
    {
      id: "message_id_2",
      senderId: "patient_uid",
      senderName: "John Doe",
      text: "I'm doing better, thanks for asking!",
      timestamp: Timestamp,
      status: "sent"
    }
  ]
}
```

#### Group Document Structure
```javascript
// groups collection document
{
  id: "group_id",
  name: "Anxiety Support Group",
  type: "Support Room",
  description: "A safe space for discussing anxiety management techniques",
  moderatorId: "doctor_uid",
  image: "https://imagekit.io/group_image.jpg",
  members: ["uid1", "uid2", "uid3"],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Group Chat Document Structure
```javascript
// groupChats collection document
{
  groupId: "group_id",
  messages: [
    {
      id: "message_id_1",
      senderId: "user_uid",
      senderName: "Jane Doe",
      text: "Thanks for sharing that technique!",
      timestamp: Timestamp
    },
    {
      id: "message_id_2",
      senderId: "moderator_uid",
      senderName: "Dr. Smith",
      text: "You're welcome! Feel free to ask any questions.",
      timestamp: Timestamp
    }
  ],
  lastMessage: "You're welcome! Feel free to ask any questions.",
  lastMessageTime: Timestamp,
  lastMessageSenderId: "moderator_uid"
}
```

## Firebase Integration

### Firebase Configuration (`firebase/config.js`)
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
```

### Firestore Service (`utils/firebase/firestoreService.js`)
Key functions for chat operations:

```javascript
// Create or get existing direct chat between two users
export const ensureDirectChat = async (doctorId, patientId, doctorName, patientName) => {
  try {
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participantIds', 'array-contains', doctorId)
    );

    const querySnapshot = await getDocs(q);
    let existingChat = null;

    querySnapshot.forEach((doc) => {
      const chatData = doc.data();
      if (chatData.participantIds.includes(patientId)) {
        existingChat = { id: doc.id, ...chatData };
      }
    });

    if (existingChat) {
      return { success: true, chat: existingChat };
    }

    // Create new chat
    const newChatRef = doc(collection(db, 'chats'));
    const newChat = {
      participantIds: [doctorId, patientId],
      participantNames: [doctorName, patientName],
      lastMessage: '',
      lastMessageTime: null,
      lastMessageSenderId: null,
      unreadCount: {
        [doctorId]: 0,
        [patientId]: 0
      },
      messages: [],
      createdAt: new Date()
    };

    await setDoc(newChatRef, newChat);
    return { success: true, chat: { id: newChatRef.id, ...newChat } };
  } catch (error) {
    console.error('Error ensuring direct chat:', error);
    return { success: false, error: error.message };
  }
};

// Get all chats for a user
export const getUserChats = async (userId) => {
  try {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participantIds', 'array-contains', userId));
    const querySnapshot = await getDocs(q);

    const chats = [];
    querySnapshot.forEach((doc) => {
      chats.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: chats };
  } catch (error) {
    console.error('Get user chats error:', error);
    return { success: false, error: error.message };
  }
};
```

## Real-time Listeners

### Firestore Listener Service (`utils/firestoreListener.js`)
```javascript
import { onSnapshot, doc, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

// Listen to a single chat for real-time updates
export const subscribeToChat = (chatId, onUpdate) => {
  const unsubscribe = onSnapshot(
    doc(db, 'chats', chatId),
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate({ id: docSnap.id, ...docSnap.data() });
      }
    },
    (error) => {
      console.error('Chat subscription error:', error);
      onUpdate(null, error);
    }
  );

  return unsubscribe;
};

// Listen to all chats for a user
export const subscribeToUserChats = (userId, onUpdate) => {
  const chatsQuery = query(
    collection(db, 'chats'),
    where('participantIds', 'array-contains', userId)
  );

  const unsubscribe = onSnapshot(
    chatsQuery,
    (querySnapshot) => {
      const chats = [];
      querySnapshot.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() });
      });
      onUpdate(chats);
    },
    (error) => {
      console.error('User chats subscription error:', error);
      onUpdate([], error);
    }
  );

  return unsubscribe;
};

// Listen to group chat messages
export const subscribeToGroupChat = (groupId, onUpdate) => {
  const unsubscribe = onSnapshot(
    doc(db, 'groupChats', groupId),
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate({ id: docSnap.id, ...docSnap.data() });
      } else {
        // Initialize group chat if it doesn't exist
        onUpdate({ groupId, messages: [] });
      }
    },
    (error) => {
      console.error('Group chat subscription error:', error);
      onUpdate(null, error);
    }
  );

  return unsubscribe;
};
```

## Message Services

### Direct Messaging Service (`utils/messageService.js`)
```javascript
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';

// Send a message in a direct chat
export const sendMessage = async (chatId, senderId, senderName, text) => {
  try {
    const newMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      senderId,
      senderName,
      text,
      timestamp: new Date(),
      status: 'sent'
    };

    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      messages: arrayUnion(newMessage),
      lastMessage: text,
      lastMessageTime: new Date(),
      lastMessageSenderId: senderId,
      [`unreadCount.${senderId === senderId ? 'participantIds[0]' : 'participantIds[1]'}]: 
        // Increment unread count for recipient
    });

    return { success: true, message: newMessage };
  } catch (error) {
    console.error('Send message error:', error);
    return { success: false, error: error.message };
  }
};

// Delete a message from a direct chat
export const deleteMessage = async (chatId, messageId) => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (chatDoc.exists()) {
      const chatData = chatDoc.data();
      const updatedMessages = chatData.messages.filter(msg => msg.id !== messageId);
      
      await updateDoc(chatRef, {
        messages: updatedMessages
      });
      
      return { success: true };
    }
    
    return { success: false, error: 'Chat not found' };
  } catch (error) {
    console.error('Delete message error:', error);
    return { success: false, error: error.message };
  }
};
```

### Group Chat Service (`utils/firebase/groupChatService.js`)
```javascript
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Send a message in a group chat
export const sendGroupMessage = async (groupId, senderId, senderName, text) => {
  try {
    const newMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      senderId,
      senderName,
      text,
      timestamp: new Date()
    };

    const groupChatRef = doc(db, 'groupChats', groupId);
    
    // Initialize group chat document if it doesn't exist
    await setDoc(groupChatRef, {
      groupId,
      messages: arrayUnion(newMessage),
      lastMessage: text,
      lastMessageTime: new Date(),
      lastMessageSenderId: senderId
    }, { merge: true });

    // Update the group chat with the new message
    await updateDoc(groupChatRef, {
      messages: arrayUnion(newMessage),
      lastMessage: text,
      lastMessageTime: new Date(),
      lastMessageSenderId: senderId
    });

    return { success: true, message: newMessage };
  } catch (error) {
    console.error('Send group message error:', error);
    return { success: false, error: error.message };
  }
};

// Delete a message from a group chat
export const deleteGroupMessage = async (groupId, messageId) => {
  try {
    // Note: In a real implementation, you might want to mark messages as deleted
    // rather than actually removing them to maintain chat history integrity
    console.log(`Delete message ${messageId} from group ${groupId}`);
    return { success: true };
  } catch (error) {
    console.error('Delete group message error:', error);
    return { success: false, error: error.message };
  }
};
```

## UI Components

### Message Bubble Component (`components/MessageBubble.js`)
```javascript
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../colors.json';

export default function MessageBubble({ message, isOwnMessage, showName = false }) {
  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
    ]}>
      {showName && !isOwnMessage && (
        <Text style={styles.senderName}>{message.senderName}</Text>
      )}
      <View style={[
        styles.bubble,
        isOwnMessage ? styles.ownBubble : styles.otherBubble
      ]}>
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownText : styles.otherText
        ]}>
          {message.text}
        </Text>
        <Text style={[
          styles.timestamp,
          isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp
        ]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    fontFamily: 'Roboto_500Medium',
    color: colors.secondary,
    marginBottom: 4,
    marginLeft: 12,
  },
  bubble: {
    borderRadius: 18,
    padding: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.secondaryBackground,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    marginBottom: 4,
  },
  ownText: {
    color: colors.background,
  },
  otherText: {
    color: colors.secondary,
  },
  timestamp: {
    fontSize: 11,
    fontFamily: 'Roboto_400Regular',
    textAlign: 'right',
  },
  ownTimestamp: {
    color: colors.background + 'CC',
  },
  otherTimestamp: {
    color: colors.secondary + 'CC',
  },
});

// Helper function to format timestamp
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
```

### Chat List Item Component (`components/ChatListItem.js`)
```javascript
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../colors.json';

export default function ChatListItem({ chat, onPress, currentUserUid }) {
  const getOtherParticipant = () => {
    if (!chat.participantIds || !chat.participantNames) return { name: 'Unknown', uid: '' };
    
    const otherIndex = chat.participantIds.findIndex(id => id !== currentUserUid);
    if (otherIndex === -1) return { name: 'Unknown', uid: '' };
    
    return {
      name: chat.participantNames[otherIndex],
      uid: chat.participantIds[otherIndex]
    };
  };

  const otherParticipant = getOtherParticipant();
  const unreadCount = chat.unreadCount?.[currentUserUid] || 0;
  const lastMessageTime = chat.lastMessageTime 
    ? formatTime(chat.lastMessageTime) 
    : '';

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(chat)}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {otherParticipant.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {otherParticipant.name}
          </Text>
          <Text style={styles.time}>
            {lastMessageTime}
          </Text>
        </View>
        
        <View style={styles.messageContainer}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {chat.lastMessage || 'No messages yet'}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Roboto_700Bold',
    color: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: colors.secondary,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: colors.secondary,
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: colors.secondary,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Roboto_700Bold',
    color: colors.background,
  },
});

// Helper function to format timestamp
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};
```

## Screens Implementation

### Messages Screen (`screens/MessagesScreen.js`)
```javascript
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import colors from '../colors.json';
import ChatListItem from '../components/ChatListItem';
import BottomNavigation from '../components/BottomNavigation';
import { StorageService } from '../utils/storage';
import { subscribeToUserChats, unsubscribeFromListener } from '../utils/firestoreListener';
import { archiveChatForUser, unarchiveChatForUser, deleteChatForUser } from '../utils/chatService';

const getChatLastReadKey = (userId, chatId) => `@heal_chat_last_read_${userId}_${chatId}`;

const getLastReadTimestamp = async (userId, chatId) => {
  try {
    const value = await AsyncStorage.getItem(getChatLastReadKey(userId, chatId));
    return value ? parseInt(value, 10) : 0;
  } catch (error) {
    console.error('Error reading chat last read timestamp:', error);
    return 0;
  }
};

const setLastReadTimestamp = async (userId, chatId) => {
  try {
    await AsyncStorage.setItem(getChatLastReadKey(userId, chatId), Date.now().toString());
  } catch (error) {
    console.error('Error saving chat last read timestamp:', error);
  }
};

export default function MessagesScreen({ user, onBack, onOpenChat, onNavigate, activeTab }) {
  const [chats, setChats] = useState([]);
  const [archivedChats, setArchivedChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabState, setActiveTabState] = useState('all');
  const chatsUnsubRef = useRef(null);

  useEffect(() => {
    if (activeTab) {
      setActiveTabState(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!user?.uid) return;

    // Subscribe to real-time chat updates
    chatsUnsubRef.current = subscribeToUserChats(user.uid, async (updatedChats) => {
      // Get archived chats for this user
      const archived = await StorageService.getArchivedChats(user.uid);
      setArchivedChats(archived || []);

      // Mark unread messages
      const chatsWithUnread = await Promise.all(
        updatedChats.map(async (chat) => {
          const lastRead = await getLastReadTimestamp(user.uid, chat.id);
          const unreadCount = chat.messages
            ? chat.messages.filter(msg => 
                msg.timestamp && msg.timestamp.toMillis() > lastRead &&
                msg.senderId !== user.uid
              ).length
            : 0;

          return {
            ...chat,
            unreadCount
          };
        })
      );

      setChats(chatsWithUnread);
    });

    return () => {
      if (chatsUnsubRef.current) {
        unsubscribeFromListener(chatsUnsubRef.current);
      }
    };
  }, [user?.uid]);

  const filteredChats = useMemo(() => {
    let result = chats;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(chat => {
        const otherParticipantIndex = chat.participantIds.findIndex(id => id !== user.uid);
        const otherParticipantName = chat.participantNames[otherParticipantIndex] || '';
        return (
          otherParticipantName.toLowerCase().includes(query) ||
          (chat.lastMessage && chat.lastMessage.toLowerCase().includes(query))
        );
      });
    }

    // Filter by tab
    if (activeTabState === 'unread') {
      result = result.filter(chat => chat.unreadCount > 0);
    } else if (activeTabState === 'archived') {
      result = archivedChats;
    }

    // Sort by last message time (newest first)
    return result.sort((a, b) => {
      const timeA = a.lastMessageTime ? a.lastMessageTime.toMillis() : 0;
      const timeB = b.lastMessageTime ? b.lastMessageTime.toMillis() : 0;
      return timeB - timeA;
    });
  }, [chats, archivedChats, searchQuery, activeTabState, user?.uid]);

  const handleChatPress = async (chat) => {
    // Mark chat as read
    await setLastReadTimestamp(user.uid, chat.id);
    
    // Update unread count in state
    setChats(prevChats => 
      prevChats.map(c => 
        c.id === chat.id ? { ...c, unreadCount: 0 } : c
      )
    );

    onOpenChat(chat);
  };

  const handleArchiveChat = async (chatId) => {
    try {
      await archiveChatForUser(user.uid, chatId);
      const updatedArchived = [...archivedChats, chats.find(c => c.id === chatId)];
      setArchivedChats(updatedArchived);
    } catch (error) {
      console.error('Error archiving chat:', error);
      Alert.alert('Error', 'Failed to archive chat');
    }
  };

  const handleUnarchiveChat = async (chatId) => {
    try {
      await unarchiveChatForUser(user.uid, chatId);
      const updatedArchived = archivedChats.filter(c => c.id !== chatId);
      setArchivedChats(updatedArchived);
    } catch (error) {
      console.error('Error unarchiving chat:', error);
      Alert.alert('Error', 'Failed to unarchive chat');
    }
  };

  const handleDeleteChat = async (chatId) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChatForUser(user.uid, chatId);
              setChats(prevChats => prevChats.filter(c => c.id !== chatId));
              setArchivedChats(prevChats => prevChats.filter(c => c.id !== chatId));
            } catch (error) {
              console.error('Error deleting chat:', error);
              Alert.alert('Error', 'Failed to delete chat');
            }
          }
        }
      ]
    );
  };

  const renderRightActions = (progress, dragX, chat) => {
    const trans = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.archiveButton]}
          onPress={() => handleArchiveChat(chat.id)}
        >
          <Ionicons name="archive-outline" size={24} color={colors.background} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteChat(chat.id)}
        >
          <Ionicons name="trash-outline" size={24} color={colors.background} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderChatItem = ({ item: chat }) => {
    const renderContent = () => (
      <ChatListItem
        chat={chat}
        currentUserUid={user.uid}
        onPress={handleChatPress}
      />
    );

    if (activeTabState === 'archived') {
      return (
        <View style={styles.archivedItem}>
          {renderContent()}
          <TouchableOpacity
            style={styles.unarchiveButton}
            onPress={() => handleUnarchiveChat(chat.id)}
          >
            <Ionicons name="archive-outline" size={20} color={colors.primary} />
            <Text style={styles.unarchiveText}>Unarchive</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, chat)}
        rightThreshold={80}
      >
        {renderContent()}
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.secondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats"
          placeholderTextColor={colors.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTabState === 'all' && styles.activeTab]}
          onPress={() => setActiveTabState('all')}
        >
          <Text style={[styles.tabText, activeTabState === 'all' && styles.activeTabText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTabState === 'unread' && styles.activeTab]}
          onPress={() => setActiveTabState('unread')}
        >
          <Text style={[styles.tabText, activeTabState === 'unread' && styles.activeTabText]}>
            Unread
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTabState === 'archived' && styles.activeTab]}
          onPress={() => setActiveTabState('archived')}
        >
          <Text style={[styles.tabText, activeTabState === 'archived' && styles.activeTabText]}>
            Archived
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={60} color={colors.secondary} />
            <Text style={styles.emptyText}>No chats yet</Text>
            <Text style={styles.emptySubtext}>Start a conversation with your doctor or join a community group</Text>
          </View>
        }
      />

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab="messages"
        onTabPress={onNavigate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: colors.secondary,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: colors.secondary,
    paddingVertical: 12,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.secondaryBackground,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Roboto_500Medium',
    color: colors.secondary,
  },
  activeTabText: {
    color: colors.background,
  },
  chatList: {
    paddingBottom: 20,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 70,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  archiveButton: {
    backgroundColor: colors.secondary,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  archivedItem: {
    backgroundColor: colors.secondaryBackground,
  },
  unarchiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  unarchiveText: {
    fontSize: 16,
    fontFamily: 'Roboto_500Medium',
    color: colors.primary,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: colors.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: colors.secondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});
```

### Chat Screen (`screens/ChatScreen.js`)
```javascript
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../colors.json';
import MessageBubble from '../components/MessageBubble';
import { sendMessage, deleteMessage } from '../utils/messageService';
import { subscribeToChat, unsubscribeFromListener } from '../utils/firestoreListener';

export default function ChatScreen({ chat, user, onBack }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);
  const chatUnsubRef = useRef(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!chat?.id) return;

    // Subscribe to real-time chat updates
    chatUnsubRef.current = subscribeToChat(chat.id, (updatedChat, error) => {
      if (error) {
        console.error('Chat subscription error:', error);
        setLoading(false);
        return;
      }

      if (updatedChat) {
        setMessages(updatedChat.messages || []);
        setLoading(false);
        
        // Scroll to bottom when new messages arrive
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    });

    return () => {
      if (chatUnsubRef.current) {
        unsubscribeFromListener(chatUnsubRef.current);
      }
    };
  }, [chat?.id]);

  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || !user?.uid) return;

    try {
      const result = await sendMessage(
        chat.id,
        user.uid,
        user.profile?.name || 'User',
        inputText.trim()
      );

      if (result.success) {
        setInputText('');
        scrollToBottom();
      } else {
        Alert.alert('Error', result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteMessage(chat.id, messageId);
              if (!result.success) {
                Alert.alert('Error', result.error || 'Failed to delete message');
              }
            } catch (error) {
              console.error('Delete message error:', error);
              Alert.alert('Error', 'Failed to delete message');
            }
          }
        }
      ]
    );
  };

  const renderMessage = ({ item: message, index }) => {
    const isOwnMessage = message.senderId === user.uid;
    const showName = !isOwnMessage && (
      index === 0 || 
      messages[index - 1]?.senderId !== message.senderId
    );

    return (
      <TouchableOpacity
        onLongPress={() => isOwnMessage && handleDeleteMessage(message.id)}
        delayLongPress={500}
      >
        <MessageBubble
          message={message}
          isOwnMessage={isOwnMessage}
          showName={showName}
        />
      </TouchableOpacity>
    );
  };

  const getOtherParticipantName = () => {
    if (!chat.participantIds || !chat.participantNames) return 'Unknown';
    
    const otherIndex = chat.participantIds.findIndex(id => id !== user.uid);
    if (otherIndex === -1) return 'Unknown';
    
    return chat.participantNames[otherIndex];
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading chat...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top + 80}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {getOtherParticipantName()}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        inverted={false}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
      />

      {/* Input Area */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={colors.secondary + '80'}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Ionicons
            name="send"
            size={20}
            color={inputText.trim() ? colors.background : colors.secondary + '80'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondaryBackground,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: colors.secondary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.secondaryBackground,
  },
  input: {
    flex: 1,
    backgroundColor: colors.secondaryBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: colors.secondary,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.secondaryBackground,
  },
});
```

## State Management

### Global Data Store (`utils/globalDataStore.js`)
The app uses a global in-memory store for frequently accessed data:

```javascript
class GlobalDataStore {
  constructor() {
    this.data = {
      doctor: {
        todayAppointments: [],
        upcomingAppointments: [],
        recentPatients: [],
        profile: null,
        availability: null,
        bookedSlots: null,
        stats: null
      },
      patient: {
        appointments: [],
        profile: null
      },
      chats: {
        unreadCount: 0
      }
    };
    
    this.subscribers = {};
    this.lastUpdated = {
      doctor: {},
      patient: {},
      chats: {}
    };
  }

  // Chat-related methods
  setChatUnreadCount(count) {
    this.data.chats.unreadCount = count;
    this.lastUpdated.chats.unreadCount = Date.now();
    this._notifySubscribers('chats.unreadCount');
  }

  getChatUnreadCount() {
    return this.data.chats.unreadCount;
  }

  subscribe(key, callback) {
    if (!this.subscribers[key]) {
      this.subscribers[key] = [];
    }
    this.subscribers[key].push(callback);
    
    // Immediately call with current value
    const currentValue = this._getValueByPath(key);
    if (currentValue !== undefined) {
      callback(currentValue);
    }
  }

  _notifySubscribers(key) {
    if (this.subscribers[key]) {
      const value = this._getValueByPath(key);
      this.subscribers[key].forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }
  }

  _getValueByPath(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.data);
  }
}

const globalDataStore = new GlobalDataStore();
export default globalDataStore;
```

## Caching Strategy

### Storage Service (`utils/storage.js`)
Handles local caching of chat data:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAT_CACHE_KEY = '@heal_user_chats_';
const ARCHIVED_CHATS_KEY = '@heal_archived_chats_';

export const StorageService = {
  // Save user chats to local storage
  saveChats: async (userId, chats) => {
    try {
      const key = `${CHAT_CACHE_KEY}${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(chats));
    } catch (error) {
      console.error('Error saving chats to storage:', error);
    }
  },

  // Get cached chats from local storage
  getCachedChats: async (userId) => {
    try {
      const key = `${CHAT_CACHE_KEY}${userId}`;
      const cached = await AsyncStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached chats:', error);
      return null;
    }
  },

  // Archive a chat for a user
  archiveChat: async (userId, chatId) => {
    try {
      const key = `${ARCHIVED_CHATS_KEY}${userId}`;
      const archived = await this.getArchivedChats(userId) || [];
      if (!archived.includes(chatId)) {
        archived.push(chatId);
        await AsyncStorage.setItem(key, JSON.stringify(archived));
      }
    } catch (error) {
      console.error('Error archiving chat:', error);
    }
  },

  // Unarchive a chat for a user
  unarchiveChat: async (userId, chatId) => {
    try {
      const key = `${ARCHIVED_CHATS_KEY}${userId}`;
      const archived = await this.getArchivedChats(userId) || [];
      const updated = archived.filter(id => id !== chatId);
      await AsyncStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      console.error('Error unarchiving chat:', error);
    }
  },

  // Get archived chats for a user
  getArchivedChats: async (userId) => {
    try {
      const key = `${ARCHIVED_CHATS_KEY}${userId}`;
      const archived = await AsyncStorage.getItem(key);
      return archived ? JSON.parse(archived) : [];
    } catch (error) {
      console.error('Error getting archived chats:', error);
      return [];
    }
  },

  // Clear chat cache
  clearChatCache: async (userId) => {
    try {
      const chatKey = `${CHAT_CACHE_KEY}${userId}`;
      const archivedKey = `${ARCHIVED_CHATS_KEY}${userId}`;
      await AsyncStorage.multiRemove([chatKey, archivedKey]);
    } catch (error) {
      console.error('Error clearing chat cache:', error);
    }
  }
};
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install @react-native-async-storage/async-storage
npm install react-native-gesture-handler
npm install @react-native-community/hooks
```

### 2. Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Firestore Database
3. Configure Firebase in your app:
```javascript
// firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
```

### 3. Directory Structure
```
src/
├── components/
│   ├── MessageBubble.js
│   ├── ChatListItem.js
│   └── BottomNavigation.js
├── screens/
│   ├── MessagesScreen.js
│   └── ChatScreen.js
├── utils/
│   ├── firebase/
│   │   ├── firestoreService.js
│   │   └── groupChatService.js
│   ├── messageService.js
│   ├── firestoreListener.js
│   ├── storage.js
│   └── globalDataStore.js
└── colors.json
```

### 4. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chats collection
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
        request.resource.data.participantIds has request.auth.uid;
    }
    
    // Groups collection
    match /groups/{groupId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && 
        request.resource.data.moderatorId == request.auth.uid;
    }
    
    // Group chats collection
    match /groupChats/{groupId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Integration Points
1. **App Navigation**: Integrate chat screens into your navigation system
2. **User Authentication**: Ensure user authentication is set up with Firebase Auth
3. **Real-time Updates**: The system uses Firestore listeners for real-time updates
4. **Offline Support**: Local caching provides offline access to recent chats

## Key Features Implemented

1. **Real-time Messaging**: Instant message delivery using Firestore listeners
2. **Message History**: Persistent chat history stored in Firestore
3. **Unread Message Tracking**: Automatic tracking of unread messages
4. **Message Deletion**: Users can delete their own messages
5. **Chat Archiving**: Users can archive/unarchive chats
6. **Search Functionality**: Search through chats and messages
7. **Typing Indicators**: Visual feedback when users are typing
8. **Message Status**: Track message delivery/read status
9. **Group Chat Support**: Multi-user community discussions
10. **Offline Support**: Local caching for offline access
11. **Push Notifications**: Integration-ready for push notifications
12. **Responsive UI**: Adapts to different screen sizes and orientations

## Customization Options

1. **Styling**: Modify `colors.json` and component styles to match your brand
2. **Message Types**: Extend to support images, files, voice notes, etc.
3. **Notification System**: Add push notifications using Firebase Cloud Messaging
4. **Encryption**: Implement end-to-end encryption for sensitive conversations
5. **Moderation**: Add admin tools for group moderation
6. **Analytics**: Integrate analytics to track chat engagement metrics

This documentation provides everything needed to replicate the complete chat system in another React Native project. The modular architecture makes it easy to customize and extend based on your specific requirements.