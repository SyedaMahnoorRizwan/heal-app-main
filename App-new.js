import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image } from 'react-native';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import colors from './colors.json';

// Onboarding Screens
import Onboarding1 from './screens/onboarding/Onboarding1';
import Onboarding2 from './screens/onboarding/Onboarding2';
import Onboarding3 from './screens/onboarding/Onboarding3';

// Auth Screens
import SignupAccount from './screens/auth/SignupAccount';
import SignupWizard from './screens/auth/SignupWizard';
import SignupSuccessScreen from './screens/auth/SignupSuccessScreen';
import LoginScreen from './screens/auth/LoginScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';
import OtpVerifyScreen from './screens/auth/OtpVerifyScreen';
import OtpVerifiedScreen from './screens/auth/OtpVerifiedScreen';
import ResetPasswordScreen from './screens/auth/ResetPasswordScreen';
import ResetDoneScreen from './screens/auth/ResetDoneScreen';

// Doctor Screens
import DoctorHomeScreen from './screens/doctor/DoctorHomeScreen';
import AppointmentDetailsScreen from './screens/doctor/AppointmentDetailsScreen';
import MessagesScreen from './screens/doctor/MessagesScreen';
import ChatScreen from './screens/doctor/ChatScreen';

// Patient Screens
import PatientHome from './screens/PatientHome';

const SCREENS = {
  SPLASH: 'splash',
  ONBOARDING_1: 'onboarding1',
  ONBOARDING_2: 'onboarding2', 
  ONBOARDING_3: 'onboarding3',
  LOGIN: 'login',
  FORGOT: 'forgot',
  OTP: 'otp',
  OTP_VERIFIED: 'otp_verified',
  RESET_PASSWORD: 'reset_password',
  PASSWORD_UPDATED: 'password_updated',
  SIGNUP_ACCOUNT: 'signup_account',
  SIGNUP_WIZARD: 'signup_wizard',
  SIGNUP_SUCCESS: 'signup_success',
  DOCTOR_DASHBOARD: 'doctor_dashboard',
  PATIENT_HOME: 'patient_home',
  APPOINTMENT_DETAILS: 'appointment_details',
  MESSAGES: 'messages',
  CHAT: 'chat',
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.SPLASH);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Auto navigate from splash to onboarding after 2 seconds
      const timer = setTimeout(() => {
        setCurrentScreen(SCREENS.ONBOARDING_1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const handleNext1 = () => setCurrentScreen(SCREENS.ONBOARDING_2);
  const handleNext2 = () => setCurrentScreen(SCREENS.ONBOARDING_3);
  const handleNext3 = () => setCurrentScreen(SCREENS.LOGIN);

  const handleLogin = (user) => {
    setCurrentUser(user);
    if (user.role === 'Doctor') {
      setCurrentScreen(SCREENS.DOCTOR_DASHBOARD);
    } else if (user.role === 'Patient') {
      setCurrentScreen(SCREENS.PATIENT_HOME);
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
      case SCREENS.ONBOARDING_3:
        return <Onboarding3 onNext={handleNext3} />;
      case SCREENS.LOGIN:
        return (
          <LoginScreen 
            onSignup={() => setCurrentScreen(SCREENS.SIGNUP_ACCOUNT)}
            onForgotPassword={() => setCurrentScreen(SCREENS.FORGOT)}
            onLogin={handleLogin}
          />
        );
      case SCREENS.FORGOT:
        return (
          <ForgotPasswordScreen 
            onBack={() => setCurrentScreen(SCREENS.LOGIN)}
            onSendOtp={() => setCurrentScreen(SCREENS.OTP)}
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
            onLogin={() => setCurrentScreen(SCREENS.LOGIN)}
            onContinue={() => setCurrentScreen(SCREENS.SIGNUP_WIZARD)}
          />
        );
      case SCREENS.SIGNUP_WIZARD:
        return (
          <SignupWizard 
            onBackToAccount={() => setCurrentScreen(SCREENS.SIGNUP_ACCOUNT)}
            onFinished={() => setCurrentScreen(SCREENS.SIGNUP_SUCCESS)}
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
              setCurrentScreen(SCREENS.APPOINTMENT_DETAILS);
            }}
            onNavigateToMessages={() => setCurrentScreen(SCREENS.MESSAGES)}
          />
        );
      case SCREENS.PATIENT_HOME:
        return <PatientHome user={currentUser} />;
      case SCREENS.APPOINTMENT_DETAILS:
        return (
          <AppointmentDetailsScreen 
            appointment={selectedAppointment}
            onBack={() => setCurrentScreen(SCREENS.DOCTOR_DASHBOARD)}
          />
        );
      case SCREENS.MESSAGES:
        return (
          <MessagesScreen
            onChatPress={(chat) => {
              setSelectedChat(chat);
              setCurrentScreen(SCREENS.CHAT);
            }}
            onNavigate={(tab) => {
              if (tab === 'home') {
                setCurrentScreen(SCREENS.DOCTOR_DASHBOARD);
              }
            }}
          />
        );
      case SCREENS.CHAT:
        return (
          <ChatScreen
            chat={selectedChat}
            onBack={() => setCurrentScreen(SCREENS.MESSAGES)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderScreen()}
      <StatusBar style="auto" />
    </>
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

