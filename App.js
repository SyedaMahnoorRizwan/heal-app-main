import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import colors from './colors.json';
import { ToastContainer } from './utils/Toast';
import InAppNotificationBar from './components/common/InAppNotificationBar';
import { subscribeToUserNotifications } from './utils/notifications';
import Onboarding1 from './screens/Onboarding1';
import Onboarding2 from './screens/Onboarding2';
import SignupAccount from './screens/SignupAccount';
import SignupWizard from './screens/SignupWizard';
import SignupSuccessScreen from './screens/SignupSuccessScreen';
import EmailVerificationScreen from './screens/EmailVerificationScreen';
import LoginScreen from './screens/LoginScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import OtpVerifyScreen from './screens/OtpVerifyScreen';
import OtpVerifiedScreen from './screens/OtpVerifiedScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import ResetDoneScreen from './screens/ResetDoneScreen';
import DoctorHomeScreen from './screens/DoctorHomeScreen';
import PatientHome from './screens/PatientHome';
import AppointmentDetailsScreen from './screens/AppointmentDetailsScreen';
import DoctorAppointmentDetailsScreen from './screens/doctor/AppointmentDetailsScreen';
import MessagesScreen from './screens/MessagesScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/doctor/ProfileScreen';
import SetAvailabilityScreen from './screens/doctor/SetAvailabilityScreen';
import DoctorCommunityScreen from './screens/doctor/CommunityScreen';
import DoctorGroupChatScreen from './screens/doctor/GroupChatScreen';
import ArticleDetailScreen from './screens/ArticleDetailScreen';
import NotificationsScreen from './screens/NotificationsScreen';

import VideoCallScreen from './screens/VideoCallScreen';
import MentalHealthScreen from './screens/MentalHealthScreen';
import MoodTrackingScreen from './screens/MoodTrackingScreen';
import MentalToolkitScreen from './screens/MentalToolkitScreen';
import CommunitySupportScreen from './screens/CommunitySupportScreen';
import PatientGroupChatScreen from './screens/PatientGroupChatScreen';
import VideoScreen from './screens/VideoScreen';
import MenstrualHealthScreen from './screens/MenstrualHealthScreen';
import TrackYourHealthScreen from './screens/TrackYourHealthScreen';
import CalendarScreen from './screens/CalendarScreen';
import LogPeriodScreen from './screens/LogPeriodScreen';
import { ARTICLES } from './utils/articles';
import AdminHomeScreen from './screens/admin/AdminHomeScreen';
import { StorageService } from './utils/storage';
import { firebaseSignout } from './utils/auth/firebaseAuth';
import CacheInvalidation from './utils/cacheInvalidation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureDirectChat } from './utils/chatService';
import SpecialtySelectScreen from './screens/patient/booking/SpecialtySelectScreen';
import DoctorListScreen from './screens/patient/booking/DoctorListScreen';
import DoctorProfileScreen from './screens/patient/booking/DoctorProfileScreen';
import DateTimeSelectScreen from './screens/patient/booking/DateTimeSelectScreen';
import ConfirmAppointmentScreen from './screens/patient/booking/ConfirmAppointmentScreen';
import AppointmentBookedScreen from './screens/patient/booking/AppointmentBookedScreen';
import PackageSelectScreen from './screens/patient/booking/PackageSelectScreen';
import PatientDetailsScreen from './screens/patient/booking/PatientDetailsScreen';
import AppointmentSummaryScreen from './screens/patient/booking/AppointmentSummaryScreen';
import { saveNotificationToFirestore } from './utils/notifications';

const SCREENS = {
  SPLASH: 'splash',
  ONBOARDING_1: 'onboarding1',
  ONBOARDING_2: 'onboarding2', 
  LOGIN: 'login',
  FORGOT: 'forgot',
  OTP: 'otp',
  OTP_VERIFIED: 'otp_verified',
  RESET_PASSWORD: 'reset_password',
  PASSWORD_UPDATED: 'password_updated',
  SIGNUP_ACCOUNT: 'signup_account',
  SIGNUP_WIZARD: 'signup_wizard',
  EMAIL_VERIFICATION: 'email_verification',
  SIGNUP_SUCCESS: 'signup_success',
  DOCTOR_DASHBOARD: 'doctor_dashboard',
  DOCTOR_COMMUNITY: 'doctor_community',
  DOCTOR_GROUP_CHAT: 'doctor_group_chat',
  PATIENT_HOME: 'patient_home',
  ADMIN_HOME: 'admin_home',
  APPOINTMENT_DETAILS: 'appointment_details',
  MESSAGES: 'messages',
  CHAT: 'chat',
  PROFILE: 'profile',
  SET_AVAILABILITY: 'set_availability',
  ARTICLE_DETAIL: 'article_detail',
  NOTIFICATIONS: 'notifications',
  MENTAL_HEALTH: 'mental_health',
  MOOD_TRACKING: 'mood_tracking',
  MENTAL_TOOLKIT: 'mental_toolkit',
  COMMUNITY_SUPPORT: 'community_support',
  PATIENT_GROUP_CHAT: 'patient_group_chat',
  VIDEO: 'video',
  MENSTRUAL_HEALTH: 'menstrual_health',
  TRACK_YOUR_HEALTH: 'track_your_health',
  CALENDAR_SCREEN: 'calendar_screen',
  PATIENT_SPECIALTY_SELECT: 'patient_specialty_select',
  PATIENT_DOCTOR_LIST: 'patient_doctor_list',
  PATIENT_DOCTOR_PROFILE: 'patient_doctor_profile',
  PATIENT_DATE_TIME_SELECT: 'patient_date_time_select',
  PATIENT_PACKAGE_SELECT: 'patient_package_select',
  PATIENT_PATIENT_DETAILS: 'patient_patient_details',
  PATIENT_APPOINTMENT_SUMMARY: 'patient_appointment_summary',
  PATIENT_CONFIRM_APPOINTMENT: 'patient_confirm_appointment',
  PATIENT_APPOINTMENT_BOOKED: 'patient_appointment_booked',
  PATIENT_APPOINTMENT_DETAILS: 'patient_appointment_details',
  VIDEO_CALL: 'video_call',
  LOG_PERIOD: 'log_period',
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.SPLASH);
  const [navigationStack, setNavigationStack] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [prevScreenForArticle, setPrevScreenForArticle] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGroupTab, setSelectedGroupTab] = useState(null);
  const [selectedAppointmentTab, setSelectedAppointmentTab] = useState(null);
  const [selectedMessagesTab, setSelectedMessagesTab] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [signupData, setSignupData] = useState({});
  const [verificationEmail, setVerificationEmail] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [patientDetails, setPatientDetails] = useState({});
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [bannerNotification, setBannerNotification] = useState(null);
  const [menstrualRefreshKey, setMenstrualRefreshKey] = useState(0);
  const [selectedTrackingDate, setSelectedTrackingDate] = useState(null);
  const lastNotificationIdRef = useRef(null);
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  // Helper function to navigate and track navigation stack
  const navigateTo = (screen) => {
    setNavigationStack(prev => [...prev, currentScreen]);
    setCurrentScreen(screen);
  };

  // Helper function to go back using the stack
  const goBack = () => {
    setNavigationStack(prev => {
      if (prev.length > 0) {
        const newStack = [...prev];
        const previousScreen = newStack.pop();
        setCurrentScreen(previousScreen);
        return newStack;
      }
      return prev;
    });
  };

  useEffect(() => {
    if (fontsLoaded) {
      const checkUserSession = async () => {
        try {
          const storedUser = await StorageService.getUser();
          if (storedUser) {
            setCurrentUser(storedUser);
            
            // Initialize doctor data if doctor role
            if (storedUser.role === 'Doctor') {
              const DataInitializer = require('./utils/dataInitializer').default;
              DataInitializer.initializeDoctorData(storedUser.uid).then((success) => {
                if (success) {
                  DataInitializer.startBackgroundRefresh(storedUser.uid);
                }
              });
              setCurrentScreen(SCREENS.DOCTOR_DASHBOARD);
            } else if (storedUser.role === 'Patient') {
              setCurrentScreen(SCREENS.PATIENT_HOME);
            } else if (storedUser.role === 'Admin') {
              setCurrentScreen(SCREENS.ADMIN_HOME);
            }
          } else {
            // No stored user, go to onboarding
            setTimeout(() => {
              setCurrentScreen(SCREENS.ONBOARDING_1);
            }, 2000);
          }
        } catch (error) {
          console.error('Error checking user session:', error);
          setTimeout(() => {
            setCurrentScreen(SCREENS.ONBOARDING_1);
          }, 2000);
        }
      };
      checkUserSession();
    }
  }, [fontsLoaded]);

  // Subscribe to Firestore notifications to detect new bookings and messages while app is open
  useEffect(() => {
    if (!currentUser?.uid) {
      return undefined;
    }

    // Reset banner and tracking when user changes
    setBannerNotification(null);
    lastNotificationIdRef.current = null;

    let isInitialLoad = true;

    const unsubscribe = subscribeToUserNotifications(currentUser.uid, (notifications) => {
      if (!notifications || notifications.length === 0) {
        return;
      }

      const latest = notifications[0];

      // First snapshot is treated as baseline, do not show banner
      if (isInitialLoad) {
        isInitialLoad = false;
        lastNotificationIdRef.current = latest.id;
        return;
      }

      // Ignore if we've already seen this one
      if (lastNotificationIdRef.current === latest.id) {
        return;
      }

      lastNotificationIdRef.current = latest.id;

      // Appointment events - show banner for both doctor and patient
      if (latest.type === 'appointment_booked' || latest.type === 'appointment_cancelled') {
        setBannerNotification({
          id: latest.id,
          type: latest.type,
          title: latest.title,
          body: latest.body,
          data: latest.data,
        });
        return;
      }

      // Any user - new direct or group message (ignore own messages)
      if (latest.type === 'new_message') {
        const senderId = latest.data?.senderId;
        if (senderId && senderId === currentUser.uid) {
          return;
        }

        // Optionally avoid showing banner if already viewing the same thread
        const kind = latest.data?.kind;
        if (
          kind === 'direct' &&
          currentScreen === SCREENS.CHAT &&
          selectedChat?.id &&
          latest.data?.chatId === selectedChat.id
        ) {
          return;
        }
        if (
          kind === 'group' &&
          ((currentUser.role === 'Doctor' && currentScreen === SCREENS.DOCTOR_GROUP_CHAT) ||
            (currentUser.role === 'Patient' && currentScreen === SCREENS.PATIENT_GROUP_CHAT)) &&
          selectedGroup?.id &&
          latest.data?.groupId === selectedGroup.id
        ) {
          return;
        }

        setBannerNotification({
          id: latest.id,
          type: latest.type,
          title: latest.title,
          body: latest.body,
          data: latest.data,
        });
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser?.uid, currentUser?.role]);

  if (!fontsLoaded) {
    return null;
  }

  const handleNext1 = () => setCurrentScreen(SCREENS.ONBOARDING_2);
  const handleNext2 = () => setCurrentScreen(SCREENS.LOGIN);

  const handleLogin = async (user) => {
    setCurrentUser(user);
    await StorageService.saveUser(user);
    
    if (user.role === 'Doctor') {
      // Initialize doctor data on background immediately after login
      const DataInitializer = require('./utils/dataInitializer').default;
      DataInitializer.initializeDoctorData(user.uid).then((success) => {
        if (success) {
          // Start background refresh
          DataInitializer.startBackgroundRefresh(user.uid);
        }
      });
      setCurrentScreen(SCREENS.DOCTOR_DASHBOARD);
    } else if (user.role === 'Patient') {
      setCurrentScreen(SCREENS.PATIENT_HOME);
    } else if (user.role === 'Admin') {
      setCurrentScreen(SCREENS.ADMIN_HOME);
    }
  };

  const handleLogout = async () => {
    await firebaseSignout();
    await StorageService.clearUser();
    await CacheInvalidation.clearAllCache();
    setCurrentUser(null);
    setCurrentScreen(SCREENS.LOGIN);
  };

  const handleOpenChatFromAppointment = async (appointment) => {
    // Doctor-side: open chat with patient from upcoming appointments
    try {
      if (!currentUser?.uid || !appointment?.patientId) {
        return;
      }
      const doctorName = currentUser.profile?.name || currentUser.name || 'Doctor';
      const patientName = appointment.patientName || 'Patient';

      const chatData = await ensureDirectChat(
        currentUser.uid,
        appointment.patientId,
        doctorName,
        patientName
      );

      if (!chatData) return;

      const problemSnippet = appointment.patientProblem || '';
      const appointmentContext = problemSnippet
        ? `Problem: ${problemSnippet}`
        : `Appointment on ${appointment.date} at ${appointment.slot}`;

      setSelectedChat({
        id: chatData.id,
        patientName,
        patientImage: require('./assets/images/people/people-1.png'),
        ...chatData,
        appointmentContext,
      });
      navigateTo(SCREENS.CHAT);
    } catch (error) {
      console.error('Error opening chat from appointment:', error);
    }
  };

  const handlePatientOpenChatFromAppointment = async (appointment) => {
    // Patient-side: open chat with doctor from booked appointments
    try {
      if (!currentUser?.uid || !appointment?.doctorId) {
        return;
      }
      const patientName = currentUser.profile?.name || currentUser.name || 'Patient';
      const doctorName = appointment.doctorName || selectedDoctor?.name || 'Doctor';

      const chatData = await ensureDirectChat(
        appointment.doctorId,
        currentUser.uid,
        doctorName,
        patientName,
      );

      if (!chatData) return;

      const problemSnippet = appointment.patientProblem || '';
      const appointmentContext = problemSnippet
        ? `Problem: ${problemSnippet}`
        : `Appointment on ${appointment.date} at ${appointment.slot}`;

      setSelectedChat({
        id: chatData.id,
        patientName: doctorName,
        patientImage: require('./assets/images/people/people-1.png'),
        ...chatData,
        appointmentContext,
      });
      navigateTo(SCREENS.CHAT);
    } catch (error) {
      console.error('Error opening patient chat from appointment:', error);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case SCREENS.SPLASH:
        return (
          <View style={styles.container}>
            <Image 
              source={require('./assets/images/logo/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>Health is a right not a privilege</Text>
            <StatusBar style="auto" />
          </View>
        );
      case SCREENS.ONBOARDING_1:
        return <Onboarding1 onNext={handleNext1} />;
      case SCREENS.ONBOARDING_2:
        return <Onboarding2 onNext={handleNext2} />;
      case SCREENS.LOGIN:
        return (
          <LoginScreen 
            onSignup={() => setCurrentScreen(SCREENS.SIGNUP_ACCOUNT)}
            onForgotPassword={() => setCurrentScreen(SCREENS.FORGOT)}
            onLogin={handleLogin}
            onEmailVerification={(email) => {
              setVerificationEmail(email);
              setCurrentScreen(SCREENS.EMAIL_VERIFICATION);
            }}
          />
        );
      case SCREENS.FORGOT:
        return (
          <ForgotPasswordScreen 
            onBack={() => setCurrentScreen(SCREENS.LOGIN)}
          />
        );
      case SCREENS.OTP:
        return (
          <OtpVerifyScreen 
            onBack={() => setCurrentScreen(SCREENS.FORGOT)}
            onVerified={() => setCurrentScreen(SCREENS.OTP_VERIFIED)}
            onResend={() => console.log('Resend OTP')}
          />
        );
      case SCREENS.OTP_VERIFIED:
        return (
          <OtpVerifiedScreen 
            onBack={() => setCurrentScreen(SCREENS.OTP)}
            onResetPassword={() => setCurrentScreen(SCREENS.RESET_PASSWORD)}
          />
        );
      case SCREENS.RESET_PASSWORD:
        return (
          <ResetPasswordScreen 
            onBack={() => setCurrentScreen(SCREENS.OTP_VERIFIED)}
            onUpdated={() => setCurrentScreen(SCREENS.PASSWORD_UPDATED)}
          />
        );
      case SCREENS.PASSWORD_UPDATED:
        return <ResetDoneScreen onBackToLogin={() => setCurrentScreen(SCREENS.LOGIN)} />;
      case SCREENS.SIGNUP_ACCOUNT:
        return (
          <SignupAccount 
            onLogin={() => {
              setSignupData({});
              setCurrentScreen(SCREENS.LOGIN);
            }}
            onContinue={async (data) => {
              const cleanData = { email: data.email, password: data.password };
              console.log('💾 App.js: Saving signup data:', cleanData);
              
              // Save to both state and AsyncStorage
              setSignupData(cleanData);
              await AsyncStorage.setItem('@signup_data', JSON.stringify(cleanData));
              
              setCurrentScreen(SCREENS.SIGNUP_WIZARD);
            }}
          />
        );
      case SCREENS.SIGNUP_WIZARD:
        console.log('📱 Rendering SignupWizard with signupData:', signupData);
        return (
          <SignupWizard 
            signupData={signupData}
            onBackToAccount={() => {
              console.log('Going back to signup account');
              setCurrentScreen(SCREENS.SIGNUP_ACCOUNT);
            }}
            onFinished={(email) => {
              console.log('🎯 App.js: onFinished called with email:', email);
              console.log('🎯 App.js: Setting verificationEmail to:', email);
              setVerificationEmail(email);
              setSignupData({});
              console.log('🎯 App.js: Navigating to EMAIL_VERIFICATION screen');
              setCurrentScreen(SCREENS.EMAIL_VERIFICATION);
            }}
          />
        );
      case SCREENS.EMAIL_VERIFICATION:
        console.log('🎯 Rendering EmailVerificationScreen with email:', verificationEmail);
        return (
          <EmailVerificationScreen 
            email={verificationEmail}
            onBack={() => setCurrentScreen(SCREENS.LOGIN)}
            onVerified={() => {
              setVerificationEmail('');
              setCurrentScreen(SCREENS.SIGNUP_SUCCESS);
            }}
          />
        );
      case SCREENS.SIGNUP_SUCCESS:
        return (
          <SignupSuccessScreen onDone={() => setCurrentScreen(SCREENS.LOGIN)} />
        );
      case SCREENS.DOCTOR_DASHBOARD:
        return (
          <DoctorHomeScreen 
            user={currentUser} 
            onViewAppointmentDetails={(appointment) => {
              setSelectedAppointment(appointment);
              navigateTo(SCREENS.APPOINTMENT_DETAILS);
            }}
            onOpenNotifications={() => navigateTo(SCREENS.NOTIFICATIONS)}
            onOpenChat={handleOpenChatFromAppointment}
            onNavigate={(tab) => {
              if (tab === 'home') {
                navigateTo(SCREENS.DOCTOR_DASHBOARD);
              } else if (tab === 'messages') {
                navigateTo(SCREENS.MESSAGES);
              } else if (tab === 'community') {
                navigateTo(SCREENS.DOCTOR_COMMUNITY);
              } else if (tab === 'profile') {
                navigateTo(SCREENS.PROFILE);
              }
            }}
          />
        );
      case SCREENS.PATIENT_HOME:
        return (
          <PatientHome
            user={currentUser}
            onOpenNotifications={() => navigateTo(SCREENS.NOTIFICATIONS)}
            onOpenMentalHealth={() => navigateTo(SCREENS.MENTAL_HEALTH)}
            onOpenArticle={(id) => { setSelectedArticle(ARTICLES.find(a => a.id === id)); setPrevScreenForArticle(SCREENS.PATIENT_HOME); navigateTo(SCREENS.ARTICLE_DETAIL); }}
            onBookAppointment={() => navigateTo(SCREENS.PATIENT_SPECIALTY_SELECT)}
            onLogout={handleLogout}
            onViewAppointmentDetails={(apt) => {
              setSelectedAppointment(apt);
              setSelectedAppointmentTab('profile');
              navigateTo(SCREENS.PATIENT_APPOINTMENT_DETAILS);
            }}
            onOpenGroupChat={(group) => {
              setSelectedGroup(group);
              setSelectedGroupTab('community');
              navigateTo(SCREENS.PATIENT_GROUP_CHAT);
            }}
            activeTabProp={selectedGroupTab || selectedAppointmentTab || selectedMessagesTab}
            onOpenChat={(chat) => {
              // Remember that we came from the Messages tab
              setSelectedMessagesTab('messages');
              setSelectedChat(chat);
              navigateTo(SCREENS.CHAT);
            }}
            onOpenMenstrualHealth={() => navigateTo(SCREENS.MENSTRUAL_HEALTH)}
            onOpenVideoCall={(appointmentId) => {
              setSelectedAppointment({ id: appointmentId });
              navigateTo(SCREENS.VIDEO_CALL);
            }}
            onUpdateUser={(updatedUser) => setCurrentUser(updatedUser)}
          />
        );
      case SCREENS.DOCTOR_COMMUNITY:
        return (
          <DoctorCommunityScreen
            user={currentUser}
            onGroupChatPress={(group) => {
              setSelectedGroup(group);
              navigateTo(SCREENS.DOCTOR_GROUP_CHAT);
            }}
            onNavigate={(tab) => {
              if (tab === 'home') {
                navigateTo(SCREENS.DOCTOR_DASHBOARD);
              } else if (tab === 'messages') {
                navigateTo(SCREENS.MESSAGES);
              } else if (tab === 'community') {
                navigateTo(SCREENS.DOCTOR_COMMUNITY);
              } else if (tab === 'profile') {
                navigateTo(SCREENS.PROFILE);
              }
            }}
          />
        );
      case SCREENS.DOCTOR_GROUP_CHAT:
        return (
          <DoctorGroupChatScreen
            user={currentUser}
            group={selectedGroup}
            onBack={() => goBack()}
          />
        );
      case SCREENS.ADMIN_HOME:
        return (
          <AdminHomeScreen
            user={currentUser}
            onLogout={handleLogout}
          />
        );
      case SCREENS.APPOINTMENT_DETAILS:
        // Render doctor-specific appointment details screen for doctors
        // and patient-specific screen for patients
        if (currentUser?.role === 'Doctor') {
          return (
            <DoctorAppointmentDetailsScreen
              appointment={selectedAppointment}
              user={currentUser}
              onBack={() => goBack()}
              onJoinCall={(appt) => { setSelectedAppointment(appt); navigateTo(SCREENS.VIDEO_CALL); }}
              onMessagePatient={async (appointment) => {
                try {
                  // Use the ensureDirectChat function to properly create/get the chat
                  const { ensureDirectChat } = await import('./utils/chatService');
                  const doctorName = currentUser.profile?.name || currentUser.name || 'Doctor';
                  const patientName = appointment.patientName || 'Patient';
                  
                  const chatData = await ensureDirectChat(
                    currentUser.uid,
                    appointment.patientId,
                    doctorName,
                    patientName
                  );
                  
                  if (!chatData) {
                    console.error('Failed to create/get chat');
                    return;
                  }
                  
                  const problemSnippet = appointment.patientProblem || '';
                  const appointmentContext = problemSnippet
                    ? `Problem: ${problemSnippet}`
                    : `Appointment on ${appointment.date} at ${appointment.slot}`;
                  
                  setSelectedChat({
                    id: chatData.id,
                    patientName,
                    patientImage: appointment.patientImage || require('./assets/images/people/people-1.png'),
                    ...chatData,
                    appointmentContext,
                  });
                  navigateTo(SCREENS.CHAT);
                } catch (error) {
                  console.error('Error opening chat from appointment:', error);
                }
              }}
            />
          );
        } else {
          return (
            <AppointmentDetailsScreen
              appointment={selectedAppointment}
              user={currentUser}
              onBack={() => goBack()}
              onJoinCall={(appt) => { setSelectedAppointment(appt); navigateTo(SCREENS.VIDEO_CALL); }}
              onMessagePatient={async (appointment) => {
                try {
                  // Use the ensureDirectChat function to properly create/get the chat
                  const { ensureDirectChat } = await import('./utils/chatService');
                  const patientName = currentUser.profile?.name || currentUser.name || 'Patient';
                  const doctorName = appointment.doctorName || 'Doctor';
                  
                  const chatData = await ensureDirectChat(
                    appointment.doctorId,
                    currentUser.uid,
                    doctorName,
                    patientName
                  );
                  
                  if (!chatData) {
                    console.error('Failed to create/get chat');
                    return;
                  }
                  
                  const problemSnippet = appointment.patientProblem || '';
                  const appointmentContext = problemSnippet
                    ? `Problem: ${problemSnippet}`
                    : `Appointment on ${appointment.date} at ${appointment.slot}`;
                  
                  setSelectedChat({
                    id: chatData.id,
                    patientName: doctorName,
                    patientImage: appointment.patientImage || require('./assets/images/people/people-1.png'),
                    ...chatData,
                    appointmentContext,
                  });
                  navigateTo(SCREENS.CHAT);
                } catch (error) {
                  console.error('Error opening chat from appointment:', error);
                }
              }}
            />
          );
        }
      case SCREENS.ARTICLE_DETAIL:
        return (
          <ArticleDetailScreen
            article={selectedArticle}
            onBack={() => setCurrentScreen(prevScreenForArticle || SCREENS.PATIENT_HOME)}
          />
        );
      case SCREENS.NOTIFICATIONS:
        return (
          <NotificationsScreen 
            user={currentUser}
            userRole={currentUser?.role}
            onBack={() => {
              // Navigate back based on user role instead of using generic goBack()
              if (currentUser?.role === 'Doctor') {
                setCurrentScreen(SCREENS.DOCTOR_DASHBOARD);
              } else if (currentUser?.role === 'Patient') {
                setCurrentScreen(SCREENS.PATIENT_HOME);
              } else if (currentUser?.role === 'Admin') {
                setCurrentScreen(SCREENS.ADMIN_HOME);
              } else {
                goBack();
              }
            }} 
          />
        );
      case SCREENS.MENTAL_HEALTH:
        return (
          <MentalHealthScreen 
            onBack={() => goBack()}
            onOpenMoodTracking={() => navigateTo(SCREENS.MOOD_TRACKING)}
            onOpenToolkit={() => navigateTo(SCREENS.MENTAL_TOOLKIT)}
            onOpenCommunitySupport={() => navigateTo(SCREENS.COMMUNITY_SUPPORT)}
          />
        );
      case SCREENS.MENTAL_TOOLKIT:
        return (
          <MentalToolkitScreen 
            onBack={() => goBack()}
            onOpenArticle={(id) => { setSelectedArticle(ARTICLES.find(a => a.id === id)); setPrevScreenForArticle(SCREENS.MENTAL_TOOLKIT); navigateTo(SCREENS.ARTICLE_DETAIL); }}
            onOpenVideo={(video) => { setSelectedVideo(video); navigateTo(SCREENS.VIDEO); }}
          />
        );
      case SCREENS.MOOD_TRACKING:
        return (
          <MoodTrackingScreen 
            onBack={() => goBack()}
            onOpenArticle={(id) => { setSelectedArticle(ARTICLES.find(a => a.id === id)); setPrevScreenForArticle(SCREENS.MOOD_TRACKING); navigateTo(SCREENS.ARTICLE_DETAIL); }}
          />
        );
      case SCREENS.COMMUNITY_SUPPORT:
        return (
          <CommunitySupportScreen
            user={currentUser}
            onBack={() => goBack()}
            onOpenGroupChat={(group) => {
              setSelectedGroup(group);
              navigateTo(SCREENS.PATIENT_GROUP_CHAT);
            }}
          />
        );
      case SCREENS.MENSTRUAL_HEALTH:
        return (
          <MenstrualHealthScreen
            key={`menstrual-${menstrualRefreshKey}`}
            user={currentUser}
            onBack={() => goBack()}
            onLogPeriod={() => navigateTo(SCREENS.LOG_PERIOD)}
            onTrackSymptoms={(date) => {
              setSelectedTrackingDate(date);
              navigateTo(SCREENS.TRACK_YOUR_HEALTH);
            }}
          />
        );
      case SCREENS.TRACK_YOUR_HEALTH:
        return (
          <TrackYourHealthScreen
            key={`track-health-${menstrualRefreshKey}-${selectedTrackingDate}`}
            user={currentUser}
            selectedDate={selectedTrackingDate}
            onBack={() => {
              setMenstrualRefreshKey(prev => prev + 1);
              setSelectedTrackingDate(null);
              goBack();
            }}
            onOpenCalendar={() => {
              setMenstrualRefreshKey(prev => prev + 1);
              setSelectedTrackingDate(null);
              goBack();
            }}
          />
        );
      case SCREENS.CALENDAR_SCREEN:
        return (
          <CalendarScreen
            key={`calendar-${menstrualRefreshKey}`}
            user={currentUser}
            onBack={() => goBack()}
          />
        );
      case SCREENS.LOG_PERIOD:
        return (
          <LogPeriodScreen
            user={currentUser}
            onBack={() => {
              setMenstrualRefreshKey(prev => prev + 1);
              goBack();
            }}
            onOpenTrackHealth={() => navigateTo(SCREENS.TRACK_YOUR_HEALTH)}
          />
        );
      case SCREENS.PATIENT_GROUP_CHAT:
        return (
          <PatientGroupChatScreen
            user={currentUser}
            group={selectedGroup}
            onBack={() => {
              setSelectedGroupTab('community');
              goBack();
              // Reset tab after a brief delay to allow the transition
              setTimeout(() => setSelectedGroupTab(null), 100);
            }}
          />
        );
      case SCREENS.VIDEO:
        return (
          <VideoScreen
            video={selectedVideo}
            onBack={() => goBack()}
          />
        );
      case SCREENS.MESSAGES:
        return (
          <MessagesScreen
            user={currentUser}
            onChatPress={(chat) => {
              setSelectedChat(chat);
              navigateTo(SCREENS.CHAT);
            }}
            onNavigate={(tab) => {
              if (tab === 'home') {
                if (currentUser?.role === 'Doctor') {
                  navigateTo(SCREENS.DOCTOR_DASHBOARD);
                } else if (currentUser?.role === 'Patient') {
                  navigateTo(SCREENS.PATIENT_HOME);
                }
              } else if (tab === 'messages') {
                navigateTo(SCREENS.MESSAGES);
              } else if (tab === 'community') {
                if (currentUser?.role === 'Doctor') {
                  navigateTo(SCREENS.DOCTOR_COMMUNITY);
                }
              } else if (tab === 'profile') {
                navigateTo(SCREENS.PROFILE);
              }
            }}
          />
        );
      case SCREENS.CHAT:
        return (
          <ChatScreen
            user={currentUser}
            chat={selectedChat}
            onBack={() => {
              if (currentUser?.role === 'Patient') {
                if (selectedChat?.openedFromBooking) {
                  // Chat launched directly after booking: go back to patient home
                  setSelectedChat(null);
                  setCurrentScreen(SCREENS.PATIENT_HOME);
                } else {
                  // Normal flow: go back to where we came from (Messages tab)
                  goBack();
                  setSelectedMessagesTab('messages');
                  setTimeout(() => setSelectedMessagesTab(null), 200);
                }
              } else {
                goBack();
              }
            }}
          />
        );
      case SCREENS.PROFILE:
        return (
          <ProfileScreen
            user={currentUser}
            onNavigate={(tab) => {
              if (tab === 'home') {
                navigateTo(SCREENS.DOCTOR_DASHBOARD);
              } else if (tab === 'messages') {
                navigateTo(SCREENS.MESSAGES);
              } else if (tab === 'community') {
                navigateTo(SCREENS.DOCTOR_COMMUNITY);
              } else if (tab === 'profile') {
                navigateTo(SCREENS.PROFILE);
              } else if (tab === 'availability') {
                navigateTo(SCREENS.SET_AVAILABILITY);
              }
            }}
            onSaveProfile={(profileData) => {
              // TODO: Update user profile with profileData
              console.log('Profile saved:', profileData);
              setCurrentUser({ ...currentUser, profile: { ...currentUser.profile, ...profileData }, email: profileData.email });
            }}
            onUpdateUser={(updatedUser) => {
              setCurrentUser(updatedUser);
              StorageService.saveUser(updatedUser);
            }}
            onLogout={handleLogout}
          />
        );
      case SCREENS.SET_AVAILABILITY:
        return (
          <SetAvailabilityScreen
            user={currentUser}
            onBack={() => setCurrentScreen(SCREENS.PROFILE)}
            onSaveAvailability={(availability) => {
              // Update user availability in state
              setCurrentUser({ ...currentUser, availability });
              // Switch back to profile to show updated availability
              setCurrentScreen(SCREENS.PROFILE);
            }}
          />
        );
      case SCREENS.PATIENT_SPECIALTY_SELECT:
        return (
          <SpecialtySelectScreen
            onBack={() => goBack()}
            onSelectSpecialty={(specialty) => {
              setSelectedSpecialty(specialty);
              navigateTo(SCREENS.PATIENT_DOCTOR_LIST);
            }}
          />
        );
      case SCREENS.PATIENT_DOCTOR_LIST:
        return (
          <DoctorListScreen
            specialty={selectedSpecialty}
            onBack={() => goBack()}
            onSelectDoctor={(doctor) => {
              setSelectedDoctor(doctor);
              navigateTo(SCREENS.PATIENT_DOCTOR_PROFILE);
            }}
          />
        );
      case SCREENS.PATIENT_DOCTOR_PROFILE:
        return (
          <DoctorProfileScreen
            doctor={selectedDoctor}
            onBack={() => goBack()}
            onBookAppointment={() => navigateTo(SCREENS.PATIENT_DATE_TIME_SELECT)}
          />
        );
      case SCREENS.PATIENT_DATE_TIME_SELECT:
        return (
          <DateTimeSelectScreen
            doctor={selectedDoctor}
            onBack={() => goBack()}
            onSelectDateTime={({ date, time }) => {
              setSelectedDate(date);
              setSelectedTime(time);
              navigateTo(SCREENS.PATIENT_PACKAGE_SELECT);
            }}
          />
        );
      case SCREENS.PATIENT_PACKAGE_SELECT:
        return (
          <PackageSelectScreen
            doctor={selectedDoctor}
            onBack={() => goBack()}
            onSelectPackage={(pkg) => {
              setSelectedPackage(pkg);
              navigateTo(SCREENS.PATIENT_PATIENT_DETAILS);
            }}
          />
        );
      case SCREENS.PATIENT_PATIENT_DETAILS:
        return (
          <PatientDetailsScreen
            user={currentUser}
            isBookingForOther={selectedPackage?.isBookingForOther}
            initialDetails={patientDetails}
            onBack={() => goBack()}
            onNext={(details) => {
              setPatientDetails(details);
              navigateTo(SCREENS.PATIENT_APPOINTMENT_SUMMARY);
            }}
          />
        );
      case SCREENS.PATIENT_APPOINTMENT_SUMMARY:
        return (
          <AppointmentSummaryScreen
            doctor={selectedDoctor}
            date={selectedDate}
            time={selectedTime}
            pkg={selectedPackage}
            patientDetails={patientDetails}
            onBack={() => goBack()}
            onProceed={() => navigateTo(SCREENS.PATIENT_CONFIRM_APPOINTMENT)}
          />
        );
      case SCREENS.PATIENT_CONFIRM_APPOINTMENT:
        return (
          <ConfirmAppointmentScreen
            doctor={selectedDoctor}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            pkg={selectedPackage}
            patientDetails={patientDetails}
            patientId={currentUser?.uid}
            user={currentUser}
            onBack={() => goBack()}
            onConfirm={() => {
              setIsRescheduling(false);
              navigateTo(SCREENS.PATIENT_APPOINTMENT_BOOKED);
            }}
            onCancel={async () => {
              // Save an in-app notification for the patient about the cancelled booking draft
              try {
                if (currentUser?.uid && selectedDate && selectedTime) {
                  const dateStr = selectedDate.toISOString().split('T')[0];
                  const doctorName = selectedDoctor?.name || 'Doctor';

                  await saveNotificationToFirestore(
                    currentUser.uid,
                    'appointment_cancelled',
                    'Appointment cancelled',
                    `Your appointment booking with ${doctorName} on ${dateStr} at ${selectedTime} was cancelled.`,
                    {
                      doctorId: selectedDoctor?.uid || null,
                      doctorName,
                      date: dateStr,
                      slot: selectedTime,
                      isDraftCancellation: true,
                    },
                  );
                }
              } catch (e) {
                console.error('Failed to create cancellation notification:', e);
              }

              // Reset all booking data and go back to patient home
              setSelectedSpecialty(null);
              setSelectedDoctor(null);
              setSelectedDate(null);
              setSelectedTime(null);
              setSelectedPackage(null);
              setPatientDetails({});
              setIsRescheduling(false);
              setCurrentScreen(SCREENS.PATIENT_HOME);
            }}
          />
        );
      case SCREENS.PATIENT_APPOINTMENT_BOOKED:
        return (
          <AppointmentBookedScreen
            onClose={() => {
              // Reset all booking data and go back home
              setSelectedSpecialty(null);
              setSelectedDoctor(null);
              setSelectedDate(null);
              setSelectedTime(null);
              setSelectedPackage(null);
              setPatientDetails({});
              setIsRescheduling(false);
              setCurrentScreen(SCREENS.PATIENT_HOME);
            }}
            onMessage={async () => {
              if (!currentUser || !selectedDoctor) {
                // Fallback: just go home if we somehow lost context
                setSelectedSpecialty(null);
                setSelectedDoctor(null);
                setSelectedDate(null);
                setSelectedTime(null);
                setSelectedPackage(null);
                setPatientDetails({});
                setIsRescheduling(false);
                setCurrentScreen(SCREENS.PATIENT_HOME);
                return;
              }

              try {
                const patientName = currentUser.profile?.name || currentUser.name || 'Patient';
                const doctorName = selectedDoctor.name || 'Doctor';

                const chatData = await ensureDirectChat(
                  selectedDoctor.uid,
                  currentUser.uid,
                  doctorName,
                  patientName,
                );

                if (!chatData) {
                  // If chat creation fails, just return to home
                  setSelectedSpecialty(null);
                  setSelectedDoctor(null);
                  setSelectedDate(null);
                  setSelectedTime(null);
                  setSelectedPackage(null);
                  setPatientDetails({});
                  setIsRescheduling(false);
                  setCurrentScreen(SCREENS.PATIENT_HOME);
                  return;
                }

                const appointmentContext =
                  selectedDate && selectedTime
                    ? `Appointment on ${selectedDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })} at ${selectedTime}`
                    : null;

                setSelectedChat({
                  id: chatData.id,
                  patientName: doctorName,
                  patientImage: require('./assets/images/people/people-1.png'),
                  ...chatData,
                  appointmentContext,
                  openedFromBooking: true,
                });

                // Clear booking context and go to chat
                setSelectedSpecialty(null);
                setSelectedDoctor(null);
                setSelectedDate(null);
                setSelectedTime(null);
                setSelectedPackage(null);
                setPatientDetails({});
                setIsRescheduling(false);
                setCurrentScreen(SCREENS.CHAT);
              } catch (e) {
                console.error('Error opening chat from booked screen:', e);
                // On error, still clear state and return home
                setSelectedSpecialty(null);
                setSelectedDoctor(null);
                setSelectedDate(null);
                setSelectedTime(null);
                setSelectedPackage(null);
                setPatientDetails({});
                setIsRescheduling(false);
                setCurrentScreen(SCREENS.PATIENT_HOME);
              }
            }}
          />
        );
      case SCREENS.PATIENT_APPOINTMENT_DETAILS:
        return (
          <AppointmentDetailsScreen
            appointment={selectedAppointment}
            onBack={() => {
              setSelectedAppointmentTab('profile');
              goBack();
              setTimeout(() => setSelectedAppointmentTab(null), 100);
            }}
            onJoinCall={(appt) => { setSelectedAppointment(appt); navigateTo(SCREENS.VIDEO_CALL); }}
            onOpenChat={handlePatientOpenChatFromAppointment}
          />
        );
      case SCREENS.VIDEO_CALL:
        return (
          <VideoCallScreen
            appointment={selectedAppointment}
            user={currentUser}
            onBack={() => goBack()}
          />
        );
      default:
        return null;
    }
  };

  const handleBannerPress = (notification) => {
    if (!notification) return;

    const { type, data } = notification;

    // Appointment banner: keep behaviour of opening Notifications for doctors
    if (type === 'appointment_booked' && currentUser?.role === 'Doctor') {
      navigateTo(SCREENS.NOTIFICATIONS);
      return;
    }

    // Message banners: deep-link into the relevant chat or group
    if (type === 'new_message' && data) {
      const kind = data.kind;

      if (kind === 'direct' && data.chatId) {
        // If already on this chat, nothing extra to do
        if (currentScreen === SCREENS.CHAT && selectedChat?.id === data.chatId) {
          return;
        }

        setSelectedChat({
          id: data.chatId,
          // For both doctor and patient, show the sender as the chat header name
          patientName: data.senderName || 'User',
          patientImage: require('./assets/images/people/people-1.png'),
        });
        navigateTo(SCREENS.CHAT);
        return;
      }

      if (kind === 'group' && data.groupId) {
        if (currentUser?.role === 'Doctor') {
          if (currentScreen === SCREENS.DOCTOR_GROUP_CHAT && selectedGroup?.id === data.groupId) {
            return;
          }
          setSelectedGroup({
            id: data.groupId,
            groupName: data.groupName || 'Group',
            groupImage: data.groupImage || '',
          });
          navigateTo(SCREENS.DOCTOR_GROUP_CHAT);
          return;
        }

        if (currentUser?.role === 'Patient') {
          if (currentScreen === SCREENS.PATIENT_GROUP_CHAT && selectedGroup?.id === data.groupId) {
            return;
          }
          setSelectedGroup({
            id: data.groupId,
            name: data.groupName || 'Group',
            image: data.groupImage || '',
            type: data.type || 'Support Group',
          });
          navigateTo(SCREENS.PATIENT_GROUP_CHAT);
          return;
        }
      }
    }
  };

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom', 'left', 'right']}>
          {renderScreen()}
          <StatusBar style="auto" />
          <InAppNotificationBar
            notification={bannerNotification}
            userRole={currentUser?.role}
            onHide={() => setBannerNotification(null)}
            onPress={handleBannerPress}
          />
          <ToastContainer />
        </SafeAreaView>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 280,
    height: 280,
    marginBottom: 30,
  },
  tagline: {
    fontSize: 20,
    fontFamily: 'Roboto_500Medium',
    color: colors.primary,
    textAlign: 'center',
  },
});
