# HEAL App - Community & Messaging Features Summary

## 1. MESSAGES SCREEN (Doctor & Patient - Both roles have this)

### Status: **REAL - Connected to Database** ✅

**What's Happening:**
- Uses real-time Firebase listener `subscribeToUserChats()` 
- Fetches all chats where the user is a participant
- Queries `chats` collection with: `where('participantIds', 'array-contains', userId)`
- Data is cached locally via `StorageService.saveChats()`

**Data Flow:**
```
Firebase chats collection 
  ↓ (real-time listener)
MessagesScreen component 
  ↓ (processes & filters)
ChatListItem display
```

**Chat Data Structure (from DB):**
```javascript
{
  id: "chat_doc_id",
  participantIds: ["user1_uid", "user2_uid"],
  participantNames: ["Dr. Smith", "Patient John"],
  lastMessage: "How are you doing?",
  lastMessageTime: Timestamp,
  messages: [
    { sender: "uid", text: "...", timestamp: Timestamp },
    ...
  ]
}
```

**Features:**
- Search functionality (client-side filtering)
- Tabs: "All" chats vs "Unread" chats
- Real-time updates when new messages arrive
- Local caching for offline access

---

## 2. DOCTOR COMMUNITY SCREEN

### Status: **DUMMY - Hardcoded Data** ❌

**What's Happening:**
- Uses hardcoded array `DUMMY_GROUP_CHATS` (lines 17-58)
- Groups are static with no database connection
- "Add Group" modal exists but doesn't save to DB
- When user clicks "Add Group" → `handleAddGroup()` just logs to console

**Dummy Data:**
```javascript
DUMMY_GROUP_CHATS = [
  {
    id: '1',
    groupName: 'Healing Circle',
    groupImage: require('../../assets/images/people/people-1.png'),
    lastMessage: 'Kevin: Hello everyone doing fine...',
    time: '16:14',
    unreadCount: 0,
  },
  // ... 4 more dummy groups
]
```

**Features NOT Working:**
- ❌ Cannot create new groups
- ❌ Cannot join existing groups
- ❌ Groups don't persist
- ❌ No messages stored/retrieved

**To-Do:**
- [ ] Create Firestore collection: `groups`
- [ ] Implement group creation
- [ ] Add real-time listener for doctor's groups
- [ ] Connect AddGroupModal to save to DB

---

## 3. PATIENT COMMUNITY SUPPORT SCREEN

### Status: **DUMMY - Hardcoded Data** ❌

**What's Happening:**
- Creates dummy groups in `useEffect()` on mount
- No database queries
- Has "Your Groups" section (hardcoded 4 groups)
- Has "Suggested Groups" section (same 4 groups)
- "Join" button doesn't do anything - just logs to console

**Dummy Data Generation:**
```javascript
const dummyGroups = [
  {
    id: 'group_001',
    name: 'Healing Circle',
    type: 'Support Room',
    therapist: 'Dr. Sarah Adams | Psychologist',
    description: '...',
    image: GROUP_IMAGES[0],
  },
  // ... 3 more
]
```

**Features NOT Working:**
- ❌ Cannot join suggested groups
- ❌ "Your Groups" doesn't reflect actual user groups
- ❌ No real therapist/moderator assignments
- ❌ Groups are same for all patients

---

## SUMMARY TABLE

| Feature | Doctor Community | Patient Community | Messages |
|---------|------------------|------------------|----------|
| Data Source | Dummy (hardcoded) | Dummy (hardcoded) | **Real (Firebase)** ✅ |
| Real-time Updates | ❌ No | ❌ No | ✅ Yes |
| Database Connected | ❌ No | ❌ No | ✅ Yes |
| Create/Join | ❌ Logs only | ❌ Logs only | N/A |
| Caching | ❌ No | ❌ No | ✅ Yes |
| Participant Matching | N/A | N/A | ✅ Queries by userId |

---

## NEEDED DATABASE SCHEMA

### For Groups (when implemented):

```javascript
// Collection: groups
{
  id: "auto-generated",
  name: "Healing Circle",
  type: "Support Room",  // Support Room, Wellness Group, Meditation Group, Mental Health Circle
  description: "...",
  moderatorId: "doctor_uid",
  image: "url or base64",
  members: ["uid1", "uid2", "uid3"],  // array of participant UIDs
  createdAt: Timestamp,
  updatedAt: Timestamp,
}

// Collection: groupChats (similar to chats but for groups)
{
  groupId: "group_id",
  messages: [
    { sender: "uid", name: "Dr. Smith", text: "...", timestamp: Timestamp },
    ...
  ],
  lastMessage: "...",
  lastMessageTime: Timestamp,
}
```

---

## NEXT STEPS

### Immediate Priorities:
1. **Messages** - Already working ✅, just ensure full functionality
2. **Doctor Community** - Replace dummy data with real groups from DB
3. **Patient Community** - Connect to groups collection, show only joined groups + suggestions
4. **Group Chats** - Implement real group messaging (separate from 1-1 chats)

