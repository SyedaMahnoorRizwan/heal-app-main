# Heal App – Project Overview

This document explains the overall flow, architecture, and main technologies used in the **Heal** React Native app so that a new developer can quickly understand and work on the project.

---

## 1. Tech Stack

- **Framework & Platform**
  - **React Native 0.81.5** with **Expo ~54**
  - Entry point: `index.js` (uses `registerRootComponent(App)` from Expo)
  - Main app component: `App.js`
- **Language**
  - JavaScript (ES6+)
- **UI & UX**
  - `react-native` core components
  - `react-native-gesture-handler` and `GestureHandlerRootView`
  - `@expo-google-fonts/roboto` + `expo-font` for typography
  - Custom color palette in `colors.json`
  - Reusable UI components under `components/`
- **State & Navigation**
  - No `react-navigation` – navigation is implemented manually in `App.js` via `useState` and a `SCREENS` enum.
  - Screen transitions are based on callbacks passed down to screen components.
- **Backend & Data**
  - **Firebase** (modular v9+)
    - Auth: email/password auth, password reset
    - Firestore: users, appointments, chats, groups, groupChats collections
  - Firebase config in `firebase/config.js`
- **Local Storage & Caching**
  - `@react-native-async-storage/async-storage`
  - `utils/storage.js` – user and chats local storage
  - `utils/cacheService.js` / `utils/cacheInvalidation.js` – app-level caching layer
  - `utils/globalDataStore.js` + `utils/dataInitializer.js` – in-memory global store and background refresh
- **Other Libraries**
  - `react-native-webview`, `react-native-svg`, `react-native-chart-kit` (for charts)
  - `sharp`, `@svgr/cli` (build-time / scripts)

---

## 2. High-Level Architecture

The app is a **multi-role healthcare platform** with three main user roles:

- **Patient**
  - Onboarding, signup, login
  - Home dashboard
  - Mental health content (articles, videos)
  - Appointment booking flow (select specialty → doctor → date & time → package → patient details → payment → confirmation)
  - Community support groups and group chat
- **Doctor**
  - Dashboard with today/upcoming appointments, stats, recent patients
  - Appointment details and chat with patients
  - Community group creation and group chat (Doctor Community)
  - Profile management and availability setup
- **Admin**
  - Admin dashboard (high-level overview, likely management tools)

### Core Concepts

- **App Shell & Router**: `App.js`
  - Maintains the current screen in `currentScreen` state.
  - Holds global UI state related to navigation and selections (selected appointment, chat, article, video, group, etc.).
  - Drives routing via a central `renderScreen()` `switch` statement.
- **Screens**: `screens/`
  - Flat versions for legacy usage (e.g. `screens/LoginScreen.js`)
  - Newer structured versions by feature: `screens/auth/`, `screens/onboarding/`, `screens/doctor/`, `screens/patient/booking/`, `screens/admin/`, etc.
- **Utilities & Services**: `utils/`
  - `auth/` – Firebase authentication wrappers and validation
  - `firebase/` – Firestore data access services (appointments, users, groups, group chats)
  - `storage.js` – local storage for user and chat cache
  - `globalDataStore.js` – singleton in-memory store
  - `dataInitializer.js` – orchestrates initial & background data loads
  - `cacheService.js` & `cacheInvalidation.js` – caching + invalidation strategy
  - `firestoreListener.js` – real-time subscriptions (chats, groups)
  - `messageService.js` & `firebase/groupChatService.js` – sending/deleting chat and group messages
  - `Toast.js` – global toast notification system
  - `articles.js` – static mental-health article content

---

## 3. App Startup & Session Flow

### 3.1 Entry and Root Setup

- `index.js`
  - Imports `'react-native-gesture-handler'`.
  - Uses `registerRootComponent(App)` to register `App.js` as the root component for both Expo Go and native builds.

### 3.2 App Initialization (`App.js`)

Key pieces of state in `App`:

- `currentScreen` – which screen is rendered (values from `SCREENS`)
- `currentUser` – logged-in user object (includes `uid`, `email`, `role`, and profile)
- Booking-related state: `selectedSpecialty`, `selectedDoctor`, `selectedDate`, `selectedTime`, `selectedPackage`, `patientDetails`, `paymentMethod`
- Misc state: `selectedAppointment`, `selectedChat`, `selectedArticle`, `prevScreenForArticle`, `selectedGroup`, `selectedVideo`, `signupData`
- `fontsLoaded` – ensures Roboto fonts are loaded before rendering

Initialization logic:

1. **Fonts Loading**
   - `useFonts` loads Roboto fonts.
   - Before fonts are ready, `App` returns `null` (no UI).

2. **Session Check** (inside `useEffect` once fonts are loaded)
   - Calls `StorageService.getUser()` to retrieve persisted user.
   - If a stored user exists:
     - `setCurrentUser(storedUser)`
     - For `Doctor` role:
       - Dynamically imports `utils/dataInitializer`.
       - Calls `DataInitializer.initializeDoctorData(storedUser.uid)`.
       - If initialization succeeds, starts periodic background refresh via `DataInitializer.startBackgroundRefresh(storedUser.uid)`.
       - Sets screen to `SCREENS.DOCTOR_DASHBOARD`.
     - For `Patient` role: sets screen to `SCREENS.PATIENT_HOME`.
     - For `Admin` role: sets screen to `SCREENS.ADMIN_HOME`.
   - If no stored user is found or error occurs:
     - Shows a splash screen for ~2 seconds, then navigates to `SCREENS.ONBOARDING_1`.

3. **Logout Flow**
   - `handleLogout` in `App.js`:
     - `firebaseSignout()` – signs out from Firebase Auth.
     - `StorageService.clearUser()` – removes local user/auth data from AsyncStorage.
     - `CacheInvalidation.clearAllCache()` – clears application-wide cache.
     - Resets `currentUser` and navigates to `SCREENS.LOGIN`.

---

## 4. Navigation & Screen Flow

Navigation is **manual**, controlled by state in `App.js` and callbacks passed into screens.

### 4.1 Screen Registry (`SCREENS`)

`SCREENS` is an object mapping human-readable keys to string IDs, e.g.

- Auth & onboarding: `SPLASH`, `ONBOARDING_1`, `ONBOARDING_2`, `ONBOARDING_3`, `LOGIN`, `FORGOT`, `OTP`, `OTP_VERIFIED`, `RESET_PASSWORD`, `PASSWORD_UPDATED`, `SIGNUP_ACCOUNT`, `SIGNUP_WIZARD`, `SIGNUP_SUCCESS`.
- Main role dashboards: `DOCTOR_DASHBOARD`, `PATIENT_HOME`, `ADMIN_HOME`.
- Doctor tools: `APPOINTMENT_DETAILS`, `MESSAGES`, `CHAT`, `PROFILE`, `SET_AVAILABILITY`, `DOCTOR_COMMUNITY`, `DOCTOR_GROUP_CHAT`.
- Patient mental health & content: `MENTAL_HEALTH`, `MOOD_TRACKING`, `MENTAL_TOOLKIT`, `COMMUNITY_SUPPORT`, `PATIENT_GROUP_CHAT`, `VIDEO`, `ARTICLE_DETAIL`, `NOTIFICATIONS`.
- Patient booking flow: `PATIENT_SPECIALTY_SELECT`, `PATIENT_DOCTOR_LIST`, `PATIENT_DOCTOR_PROFILE`, `PATIENT_DATE_SELECT`, `PATIENT_TIME_SELECT`, `PATIENT_PACKAGE_SELECT`, `PATIENT_PATIENT_DETAILS`, `PATIENT_APPOINTMENT_SUMMARY`, `PATIENT_PAYMENT_METHOD`, `PATIENT_CONFIRM_APPOINTMENT`, `PATIENT_APPOINTMENT_SUCCESS`.

### 4.2 Auth & Onboarding Flow

1. **Splash → Onboarding**
   - On fresh launch (no stored user), show splash screen with logo and tagline, then navigate to `ONBOARDING_1`.
2. **Onboarding screens** (`Onboarding1`, `Onboarding2`, `Onboarding3`):
   - Each calls callbacks passed from `App` to advance: `handleNext1`, `handleNext2`, `handleNext3`.
   - After `Onboarding3`, navigate to `LOGIN`.
3. **Login** (`LoginScreen`):
   - `onSignup` → `SIGNUP_ACCOUNT`
   - `onForgotPassword` → `FORGOT`
   - `onLogin(user)` – after successful login via Firebase, passes `user` back to `App`, which then routes based on `user.role`.
4. **Signup**
   - `SignupAccount` collects email/password. On continue:
     - Persists `signupData` in state and AsyncStorage (`@signup_data`) for later use.
     - Navigates to `SIGNUP_WIZARD`.
   - `SignupWizard` collects detailed profile/role info and eventually navigates to `SIGNUP_SUCCESS`.
   - `SignupSuccessScreen` returns to `LOGIN`.
5. **Forgot Password Flow**
   - `ForgotPasswordScreen` → `OtpVerifyScreen` → `OtpVerifiedScreen` → `ResetPasswordScreen` → `ResetDoneScreen`.
   - Back navigation between these screens is handled via callbacks from `App.js`.

### 4.3 Role-Based Dashboards

- **DoctorHomeScreen** (`SCREENS.DOCTOR_DASHBOARD`)
  - Receives `user={currentUser}`.
  - Navigation callbacks:
    - `onViewAppointmentDetails(appointment)` → selects an appointment and switches to `APPOINTMENT_DETAILS`.
    - `onOpenNotifications` → `NOTIFICATIONS`.
    - `onNavigate(tab)` – bottom navigation between `home`, `messages`, `community`, `profile`.
- **PatientHome** (`SCREENS.PATIENT_HOME`)
  - Receives `user={currentUser}`.
  - Actions:
    - View notifications: `NOTIFICATIONS`.
    - Open mental health: `MENTAL_HEALTH`.
    - Open community: `COMMUNITY_SUPPORT`.
    - Open mental health articles/videos: sets `selectedArticle`/`selectedVideo` and goes to `ARTICLE_DETAIL`/`VIDEO`.
    - Book appointment: `PATIENT_SPECIALTY_SELECT`.
    - Logout: `handleLogout`.
- **AdminHomeScreen** (`SCREENS.ADMIN_HOME`)
  - Simple admin dashboard; receives `user` and `onLogout`.

### 4.4 Doctor Tools & Community

- **AppointmentDetailsScreen**
  - Uses `selectedAppointment` from `App` state.
  - Back navigates to `DOCTOR_DASHBOARD`.
- **MessagesScreen / ChatScreen**
  - `MessagesScreen` lists chats for the logged-in user.
  - On chat press, `selectedChat` is set and `SCREENS.CHAT` is shown.
  - `ChatScreen` displays thread using Firestore listeners and `messageService`.
- **ProfileScreen**
  - Allows doctors to update profile info; updates `currentUser` and persists via `StorageService.saveUser`.
  - Can open `SET_AVAILABILITY` screen.
- **SetAvailabilityScreen**
  - Manages doctor working days/time slots.
  - Uses `saveDoctorAvailability` / `getDoctorAvailabilityData` from `firestoreService`.
- **DoctorCommunityScreen & DoctorGroupChatScreen**
  - Doctor can create groups, manage them, and participate in group chats.
  - Backed by:
    - `utils/firebase/groupService.js` – CRUD and membership for groups (`groups` collection).
    - `utils/firebase/groupChatService.js` – sending/deleting messages in `groupChats` collection.
    - `utils/firestoreListener.js` – real-time subscriptions to created/joined groups and group chats.

### 4.5 Patient Mental Health & Community Flows

- **MentalHealthScreen**
  - Entry point to mental health features.
  - Navigation to `MOOD_TRACKING`, `MENTAL_TOOLKIT`, `COMMUNITY_SUPPORT`.
- **MentalToolkitScreen**
  - Displays curated `ARTICLES` and videos from `utils/articles.js`.
  - On article click, sets `selectedArticle` and previous screen, then navigates to `ARTICLE_DETAIL`.
  - On video click, sets `selectedVideo` and navigates to `VIDEO`.
- **MoodTrackingScreen**
  - Mood tracking UI; can open article details.
- **CommunitySupportScreen** & **PatientGroupChatScreen**
  - Patients can browse available groups, join them, and chat.
  - Uses same `groups` / `groupChats` collections as doctor community but with patient-specific UX.

### 4.6 Patient Appointment Booking Flow

The booking flow is a multi-step wizard controlled entirely from `App.js` state:

1. **SpecialtySelectScreen** (`PATIENT_SPECIALTY_SELECT`)
   - User chooses a specialty.
   - Sets `selectedSpecialty` and navigates to `PATIENT_DOCTOR_LIST`.
2. **DoctorListScreen**
   - Uses `getDoctorsBySpecialty` from `firestoreService` to fetch doctors with given specialization.
   - On doctor selection, sets `selectedDoctor` and navigates to `PATIENT_DOCTOR_PROFILE`.
3. **DoctorProfileScreen**
   - Shows doctor profile; from here user proceeds to `PATIENT_DATE_SELECT`.
4. **DateSelectScreen**
   - Uses `getDoctorAvailability` and `getBookedSlots` to show available dates/slots.
   - On date selection, sets `selectedDate` and goes to `PATIENT_TIME_SELECT`.
5. **TimeSelectScreen**
   - Shows available time slots (generated from doctor’s availability minus booked slots).
   - On time selection, sets `selectedTime` and goes to `PATIENT_PACKAGE_SELECT`.
6. **PackageSelectScreen**
   - User selects appointment package; sets `selectedPackage` and goes to `PATIENT_PATIENT_DETAILS`.
7. **PatientDetailsScreen**
   - Collects patient information; saves into `patientDetails` and goes to `PATIENT_APPOINTMENT_SUMMARY`.
8. **AppointmentSummaryScreen**
   - Shows full summary (doctor, date, time, package, patient details).
   - On proceed, goes to `PATIENT_PAYMENT_METHOD`.
9. **PaymentMethodScreen**
   - User selects payment method; stored in `paymentMethod` and navigates to `PATIENT_CONFIRM_APPOINTMENT`.
10. **ConfirmAppointmentScreen**
    - Calls `createAppointment` from `firestoreService` with all step data.
    - On success, navigates to `PATIENT_APPOINTMENT_SUCCESS`.
11. **AppointmentSuccessScreen**
    - Displays confirmation and returns to `PATIENT_HOME`.

---

## 5. Firebase Integration Details

### 5.1 Configuration (`firebase/config.js`)

- Uses Firebase v9 modular API:
  - `initializeApp(firebaseConfig)`
  - `getAuth(app)` → exported as `auth`
  - `getFirestore(app)` → exported as `db`
- Other modules import `auth` and `db` to interact with Firebase.

> Note: The Firebase config currently contains hard-coded keys from the Firebase console. In production, this should be managed via environment variables or a safer configuration mechanism as much as possible for your platform.

### 5.2 Auth Layer (`utils/auth/firebaseAuth.js`)

Provides a high-level API around Firebase Auth and user profile storage in Firestore:

- **`firebaseSignup(email, password, profileData)`**
  - Creates a user via `createUserWithEmailAndPassword`.
  - Updates user display name with `updateProfile`.
  - Writes a user document to `users` collection with additional metadata and default stats.
  - For doctor role, initializes an empty availability object.
- **`firebaseLogin(email, password)`**
  - Signs in via `signInWithEmailAndPassword`.
  - Loads `users/{uid}` document and returns a combined user object including profile.
- **`firebaseSendPasswordReset(email)`**
  - Sends password reset email via `sendPasswordResetEmail`.
- **`firebaseSignout()`**
  - Calls `signOut(auth)`.
- **`onAuthStateChange(callback)`**
  - Wraps `onAuthStateChanged` and enriches Firebase user with the Firestore profile.
- **`getCurrentUserToken()`**
  - Returns the current user’s ID token if available.

### 5.3 Firestore Services (`utils/firebase/*`)

- **`firestoreService.js`** – core data access:
  - User profile: `getUserProfile`, `updateUserProfile`.
  - User lists by role: `getAllDoctors`, `getAllPatients`.
  - Validation: `checkEmailExists`.
  - Doctor discovery: `getDoctorsBySpecialty`.
  - Availability & scheduling: `getDoctorAvailability`, `getBookedSlots`, `saveDoctorAvailability`, `getDoctorAvailabilityData`.
  - Appointment lifecycle: `createAppointment`, `getDoctorAppointments`, `getPatientAppointments`, `getTodaysAppointments`, `getUpcomingAppointments`.
  - Stats: `calculateDoctorStats`, `calculatePatientStats`.

- **`groupService.js`** – community group management:
  - `createGroup`, `updateGroup`, `deleteGroup`.
  - Membership: `joinGroup`, `leaveGroup`.
  - Queries: `getUserCreatedGroups`, `getUserJoinedGroups`, `getAvailableGroups`, `getGroupById`.
  - Group chat initialization: `initializeGroupChat` (sets up `groupChats/{groupId}` document).

- **`groupChatService.js`** – group messaging:
  - `sendGroupMessage` and `deleteGroupMessage` for `groupChats` documents.

### 5.4 Real-time Listeners (`utils/firestoreListener.js`)

Encapsulates Firestore `onSnapshot` subscriptions:

- `subscribeToChat(chatId, onUpdate)` – single chat document.
- `subscribeToUserChats(userId, onUpdate)` – all chats where user is a participant.
- `subscribeToGroupChat(groupId, onUpdate)` – real-time messages for a specific group.
- `subscribeToUserGroups(userId, onUpdate)` – groups user joined.
- `subscribeToCreatedGroups(userId, onUpdate)` – groups created by the doctor.
- `unsubscribeFromListener(unsubscribe)` – convenience wrapper to safely unsubscribe.

### 5.5 Messaging (`utils/messageService.js` & `utils/firebase/groupChatService.js`)

- **One-to-one / consultation chats**: `messageService.js`
  - `sendMessage(chatId, senderId, senderName, text)` – appends to `chats/{chatId}.messages` and updates `lastMessage*` fields.
  - `deleteMessage(chatId, messageId)` – removes a specific message from the messages array.
- **Group chats**: `groupChatService.js`
  - Same logic but operates on `groupChats/{groupId}`.

---

## 6. State, Caching, and Performance

### 6.1 Local Storage (`utils/storage.js`)

- Stores logged-in user and chat cache via AsyncStorage.
- Methods:
  - `saveUser`, `getUser`, `clearUser`, `isUserLoggedIn`.
  - `saveChats`, `getCachedChats`, `clearChatsCache` using per-user cache keys.

### 6.2 Global In-Memory Store (`utils/globalDataStore.js`)

Acts as a lightweight global store for frequently accessed data.

- Keeps structured data for:
  - `doctor`: `todayAppointments`, `upcomingAppointments`, `recentPatients`, `profile`, `availability`, `bookedSlots`, `stats`.
  - `patient`: `appointments`, `profile`.
- Supports **subscriptions**:
  - `subscribe(key, callback)` – where key is a dot path, e.g., `doctor.todayAppointments`.
  - `_notifySubscribers(key)` – internal method to call registered callbacks when data changes.
- Provides getter/setter methods for all major subtrees.
- Tracks `lastUpdated` timestamps and a per-role `isLoading` flag.

### 6.3 Data Initialization & Background Refresh (`utils/dataInitializer.js`)

- **`initializeDoctorData(doctorId)`**
  - Runs multiple Firestore requests in parallel:
    - Today’s appointments, upcoming appointments, recent patients, doctor profile, stats.
  - Enriches appointments with patient profile data (`enrichAppointmentsWithPatientData`).
  - Stores all results in `globalDataStore`.
  - Loads today’s availability and booked slots and stores them.
- **Background refresh**
  - `startBackgroundRefresh(doctorId, intervals)` sets up three intervals:
    - Appointments every 60s
    - Availability every 5 min
    - Stats every 5 min
  - Returns a cleanup function (not currently used in `App.js` but available for future use).

### 6.4 Cache Service & Invalidation

- **`cacheService.js`**
  - Generic cache with TTL using AsyncStorage.
  - Supports `set`, `get`, `getOrFetch`, `invalidate`, `invalidatePattern`, `clear`, `getStats`, `prefetch`.
- **`cacheInvalidation.js`**
  - Higher-level invalidation strategies:
    - `invalidateDoctorData`, `invalidateDoctorAppointments`, `invalidateDoctorAvailability`, `invalidateDoctorProfile`, `invalidateTodayCache`, `invalidatePatientData`, `softInvalidate`, `clearAllCache`.
  - Used in `App.js` `handleLogout()` to clear all cache on logout.

---

## 7. Notifications & Toasts

- **`Toast.js`**
  - Implements a global toast notification system using an internal `toastInstance`.
  - `Toast.show(message, type, duration)` can be called from anywhere after `ToastContainer` is mounted.
  - `ToastContainer` is rendered once at the root inside `App` and handles animations and message queue.
  - Types: primarily `error` or success; type decides background color.

- **`NotificationsScreen`**
  - Screen for user notifications, opened from both doctor and patient flows.

---

## 8. Components Overview (`components/`)

- **Common components (`components/common`)**
  - `NextButton`, `OnboardingScreen` – used in onboarding & step-based flows.
- **Doctor components (`components/doctor`)**
  - `AddGroupModal`, `GroupAvatar`, `GroupChatListItem`, `ChatListItem`, `MessageBubble`, `PatientAvatar`, `ReportMessageModal`, `ScheduleCard`, `SessionCard`.
  - Provide building blocks for the doctor dashboard, community, and messaging UI.
- **Other components**
  - `AdminBottomNavigation`, `BottomNavigation`, `PatientBottomNavigation` – role-specific bottom navigation bars.
  - `ChatListItem`, `MessageBubble`, `PatientAvatar`, `ScheduleCard`, `SessionCard` outside subfolders for shared or legacy usage.

---

## 9. Scripts & Supporting Files

- **Scripts (`scripts/`)**
  - `findAllAppointments.js`, `fixUndefinedPatientNames.js`, `checkDoctorAppointments.js` executed by npm scripts:
    - `npm run check:appointments`
    - `npm run fix:patient-names`
    - `npm run check:doctor`
  - These are maintenance/admin scripts for the Firestore data.
- **Other docs**
  - `FEATURE_SUMMARY.md`, `FIX_SUMMARY.md`, `SEED_DATABASE.md`, `TEST_USERS.md`, `guidelines.md` – additional project-specific documentation.

---

## 10. How to Explain This Project to Another Developer

> **Short pitch**: Heal is an Expo-based React Native app for doctors, patients, and admins that uses Firebase (Auth + Firestore) for authentication, scheduling, messaging, and community features. Navigation is handled manually in `App.js` via a screen enum and state. A set of utilities manage data access, caching, and global state to make doctor and patient dashboards fast.

**Key points to emphasize:**

1. **Single entry point & manual router**
   - `App.js` is the central hub. All navigation, role-based routing, and cross-screen state live there.
2. **Firebase-centric backend**
   - Authentication, user profiles, appointments, chats, groups, and group chats are all modeled as Firestore collections.
3. **Global data strategy**
   - `globalDataStore` + `dataInitializer` keep high-frequency data (like doctor appointments and stats) in memory with background refresh.
   - `cacheService` and `cacheInvalidation` manage persistence and invalidation for more expensive queries.
4. **Rich patient experience**
   - Appointment booking wizard, mental health content (articles + videos), mood tracking, and community support groups.
5. **Doctor tooling**
   - Dashboards with stats, today/upcoming appointments, recent patients, group/community features, and availability management.

If a new developer understands `App.js`, `utils/firebase/*`, `utils/auth/firebaseAuth.js`, `utils/dataInitializer.js`, and `utils/globalDataStore.js`, they will have a good grasp of the entire system.
