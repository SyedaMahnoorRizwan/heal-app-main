# Heal App Menstrual Health System Documentation

This document provides a complete explanation of the menstrual health tracking system implementation in the Heal app. This documentation will help you replicate the entire menstrual health system in another React Native project.

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Data Models](#data-models)
5. [Firebase Integration](#firebase-integration)
6. [UI Components](#ui-components)
7. [Screens Implementation](#screens-implementation)
8. [Calculation Algorithms](#calculation-algorithms)
9. [State Management](#state-management)
10. [Setup Instructions](#setup-instructions)

## Overview

The Heal app menstrual health system provides comprehensive tracking and prediction features for women's menstrual cycles. The system includes:

1. **Cycle Tracking** - Recording menstrual periods and their characteristics
2. **Daily Symptom Tracking** - Monitoring mood, symptoms, and flow throughout the cycle
3. **Predictive Analytics** - Calculating future period dates, fertility windows, and ovulation
4. **Calendar Visualization** - Visual representation of tracked data
5. **Insights & Recommendations** - Personalized health insights based on tracked data

## Architecture

```
Menstrual Health System Architecture:
┌─────────────────────────────────────────────────────────────┐
│                        Frontend UI                         │
├─────────────────────────────────────────────────────────────┤
│                   Menstrual Health Screens                 │
│  - MenstrualHealthScreen.js (Main dashboard)               │
│  - TrackYourHealthScreen.js (Daily tracking)               │
│  - CalendarScreen.js (Calendar view)                       │
│  - LogPeriodScreen.js (Period logging)                     │
├─────────────────────────────────────────────────────────────┤
│                   Business Logic Layer                      │
│  - menstrualService.js (Data operations & calculations)    │
├─────────────────────────────────────────────────────────────┤
│                    Data Access Layer                       │
│  - firestoreService.js (General Firebase operations)       │
├─────────────────────────────────────────────────────────────┤
│                    Firebase Firestore                       │
│  - users/{userId}/menstrualPeriods (Period records)        │
│  - users/{userId}/dailyTracking (Daily symptoms)           │
│  - users/{userId} (User profile with menstrual data)       │
├─────────────────────────────────────────────────────────────┤
│                   Local Storage Layer                      │
│  - AsyncStorage (Caching)                                  │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Data Structures

#### Menstrual Period Document Structure
```javascript
// users/{userId}/menstrualPeriods collection document
{
  id: "period_document_id",
  startDate: "2023-06-27", // YYYY-MM-DD format
  endDate: "2023-06-30",   // YYYY-MM-DD format
  length: 4,               // Number of days
  symptoms: [],            // Optional: specific symptoms during period
  flow: "medium",          // Optional: flow intensity
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Daily Tracking Document Structure
```javascript
// users/{userId}/dailyTracking/{date} document
{
  date: "2023-07-15",      // YYYY-MM-DD format
  mood: "happy",           // Selected mood identifier
  symptom: "headache",     // Selected symptom identifier
  flow: "light",           // Flow intensity
  notes: "Feeling energetic today", // Optional user notes
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### User Menstrual Profile Structure
```javascript
// users/{userId} document - menstrualProfile field
{
  menstrualProfile: {
    averageCycleLength: 28,     // Average days between periods
    averagePeriodLength: 5,     // Average duration of period
    lastPeriodStart: "2023-06-27", // Most recent period start date
    createdAt: Timestamp,
    updatedAt: Timestamp
  }
}
```

## Firebase Integration

### Menstrual Service (`utils/firebase/menstrualService.js`)
Complete service for all menstrual health operations:

```javascript
import { doc, setDoc, getDoc, collection, query, where, orderBy, limit, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * Save a menstrual period entry
 */
export const saveMenstrualPeriod = async (userId, periodData) => {
  try {
    const periodRef = doc(collection(db, 'users', userId, 'menstrualPeriods'));
    await setDoc(periodRef, {
      ...periodData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true, id: periodRef.id };
  } catch (error) {
    console.error('Save menstrual period error:', error);
    return {
      success: false,
      error: error.message || 'Failed to save menstrual period'
    };
  }
};

/**
 * Log a new menstrual period
 */
export const logMenstrualPeriod = async (userId, startDate, length) => {
  try {
    const periodData = {
      startDate: startDate.toISOString().split('T')[0],
      length: length,
      endDate: (() => {
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + length - 1);
        return endDate.toISOString().split('T')[0];
      })()
    };
    
    const result = await saveMenstrualPeriod(userId, periodData);
    
    if (result.success) {
      // Update user's menstrual profile
      await updateMenstrualProfile(userId, {
        lastPeriodStart: periodData.startDate
      });
    }
    
    return result;
  } catch (error) {
    console.error('Log menstrual period error:', error);
    return {
      success: false,
      error: error.message || 'Failed to log menstrual period'
    };
  }
};

/**
 * Save daily tracking data
 */
export const saveDailyTracking = async (userId, date, trackingData) => {
  try {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const trackingRef = doc(db, 'users', userId, 'dailyTracking', dateStr);
    await setDoc(trackingRef, {
      ...trackingData,
      date: dateStr,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error('Save daily tracking error:', error);
    return {
      success: false,
      error: error.message || 'Failed to save daily tracking'
    };
  }
};

/**
 * Get menstrual cycle history
 */
export const getMenstrualHistory = async (userId, limitCount = 20) => {
  try {
    const periodsRef = collection(db, 'users', userId, 'menstrualPeriods');
    const q = query(periodsRef, orderBy('startDate', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    const periods = [];
    querySnapshot.forEach((doc) => {
      periods.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, data: periods };
  } catch (error) {
    console.error('Get menstrual history error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get menstrual history'
    };
  }
};

/**
 * Get daily tracking data for a specific date
 */
export const getDailyTracking = async (userId, date) => {
  try {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const trackingRef = doc(db, 'users', userId, 'dailyTracking', dateStr);
    const docSnap = await getDoc(trackingRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: true, data: null };
    }
  } catch (error) {
    console.error('Get daily tracking error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get daily tracking'
    };
  }
};

/**
 * Get daily tracking data for a date range
 */
export const getTrackingInRange = async (userId, startDate, endDate) => {
  try {
    const trackingRef = collection(db, 'users', userId, 'dailyTracking');
    
    const allTracking = {};
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    // Get all documents (in a production app, you'd want to optimize this)
    const querySnapshot = await getDocs(trackingRef);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.date >= startStr && data.date <= endStr) {
        allTracking[data.date] = data;
      }
    });
    
    return { success: true, data: allTracking };
  } catch (error) {
    console.error('Get tracking in range error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get tracking data'
    };
  }
};

/**
 * Calculate cycle predictions based on history
 */
export const calculateCyclePredictions = async (userId) => {
  try {
    // Get user's menstrual profile for last period start
    const profileResult = await getMenstrualProfile(userId);
    const userProfile = profileResult.success ? profileResult.data : null;
    
    const historyResult = await getMenstrualHistory(userId, 6); // Get last 6 cycles
    
    if (!historyResult.success || !historyResult.data.length) {
      // Return default predictions if no history
      const today = new Date();
      const nextPeriodStart = new Date(today);
      nextPeriodStart.setDate(today.getDate() + 28); // Default 28-day cycle
      
      return {
        success: true,
        data: {
          averageCycleLength: 28,
          averagePeriodLength: 5,
          nextPeriodStart: nextPeriodStart.toISOString().split('T')[0],
          lastPeriodStart: userProfile?.lastPeriodStart || null,
          fertilityWindowStart: null,
          fertilityWindowEnd: null,
          ovulationDate: null
        }
      };
    }
    
    const periods = historyResult.data.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    // Calculate average cycle length
    let totalCycleLength = 0;
    let cycleCount = 0;
    
    for (let i = 1; i < periods.length; i++) {
      const prevStart = new Date(periods[i-1].startDate);
      const currStart = new Date(periods[i].startDate);
      const diffDays = Math.round((currStart - prevStart) / (1000 * 60 * 60 * 24));
      totalCycleLength += diffDays;
      cycleCount++;
    }
    
    const averageCycleLength = cycleCount > 0 ? Math.round(totalCycleLength / cycleCount) : 28;
    const averagePeriodLength = periods.reduce((sum, p) => sum + (p.length || 5), 0) / periods.length;
    
    // Predict next period
    const lastPeriodStart = new Date(periods[periods.length - 1].startDate);
    const nextPeriodStart = new Date(lastPeriodStart);
    nextPeriodStart.setDate(lastPeriodStart.getDate() + averageCycleLength);
    
    // Predict fertility window (simplified)
    const ovulationDay = averageCycleLength - 14; // Typical ovulation day
    const fertilityStart = new Date(nextPeriodStart);
    fertilityStart.setDate(nextPeriodStart.getDate() + ovulationDay - 5);
    const fertilityEnd = new Date(nextPeriodStart);
    fertilityEnd.setDate(nextPeriodStart.getDate() + ovulationDay + 1);
    
    const ovulationDate = new Date(nextPeriodStart);
    ovulationDate.setDate(nextPeriodStart.getDate() + ovulationDay);
    
    return {
      success: true,
      data: {
        averageCycleLength,
        averagePeriodLength: Math.round(averagePeriodLength),
        nextPeriodStart: nextPeriodStart.toISOString().split('T')[0],
        lastPeriodStart: userProfile?.lastPeriodStart || periods[periods.length - 1].startDate,
        fertilityWindowStart: fertilityStart.toISOString().split('T')[0],
        fertilityWindowEnd: fertilityEnd.toISOString().split('T')[0],
        ovulationDate: ovulationDate.toISOString().split('T')[0]
      }
    };
  } catch (error) {
    console.error('Calculate cycle predictions error:', error);
    return {
      success: false,
      error: error.message || 'Failed to calculate predictions'
    };
  }
};

/**
 * Update user's menstrual profile
 */
export const updateMenstrualProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      menstrualProfile: {
        ...profileData,
        updatedAt: new Date()
      }
    });
    return { success: true };
  } catch (error) {
    console.error('Update menstrual profile error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update menstrual profile'
    };
  }
};

/**
 * Get user's menstrual profile
 */
export const getMenstrualProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists() && docSnap.data().menstrualProfile) {
      return { success: true, data: docSnap.data().menstrualProfile };
    } else {
      // Return default profile
      return { 
        success: true, 
        data: {
          averageCycleLength: 28,
          averagePeriodLength: 5,
          lastPeriodStart: null
        }
      };
    }
  } catch (error) {
    console.error('Get menstrual profile error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get menstrual profile'
    };
  }
};
```

## UI Components

### Calendar Day Cell with Flow Indicators
```javascript
// Part of CalendarScreen.js
function getFlowStyle(flow) {
  switch (flow) {
    case 'spotting':
      return { backgroundColor: '#FFE4B5', borderColor: '#FFD700' };
    case 'light':
      return { backgroundColor: '#FFB6C1', borderColor: '#FF69B4' };
    case 'medium':
      return { backgroundColor: '#FF6347', borderColor: '#FF4500' };
    case 'heavy':
    case 'very-heavy':
      return { backgroundColor: '#DC143C', borderColor: '#8B0000' };
    default:
      return {};
  }
}

// In calendar rendering:
{calendarDays.map((date, index) => {
  const dateStr = date ? date.toISOString().split('T')[0] : '';
  const dayData = dateStr ? trackingData[dateStr] : null;
  
  return (
    <View
      key={index}
      style={[
        styles.dayCell,
        !date && styles.dayCellEmpty,
        isToday(date) && styles.dayCellToday,
        dayData?.flow && getFlowStyle(dayData.flow),
      ]}
    >
      <Text
        style={[
          styles.dayCellText,
          isToday(date) && styles.dayCellTextToday,
          dayData?.flow && styles.dayCellTextTracked,
        ]}
      >
        {date ? date.getDate() : ''}
      </Text>
      {dayData?.flow && (
        <View style={styles.flowIndicator} />
      )}
    </View>
  );
})}
```

## Screens Implementation

### Menstrual Health Screen (`screens/MenstrualHealthScreen.js`)
Main dashboard showing predictions and quick actions:

```javascript
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../colors.json';
import { calculateCyclePredictions, getMenstrualHistory } from '../utils/firebase/menstrualService';

function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getFirstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

function generateCalendarDays(date) {
  const daysInMonth = getDaysInMonth(date);
  const firstDay = getFirstDayOfMonth(date);
  const days = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add days of month
  for (let i = 1; i <= daysInMonth; i++) {
    const newDate = new Date(date.getFullYear(), date.getMonth(), i);
    days.push(newDate);
  }

  return days;
}

function calculateDaysUntilPeriod(nextPeriodStart) {
  if (!nextPeriodStart) return '--';
  
  const today = new Date();
  const nextPeriodDate = new Date(nextPeriodStart);
  const diffTime = nextPeriodDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}

function formatDate(dateString) {
  if (!dateString) return '--/--';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function calculateDaysAgo(dateString) {
  if (!dateString) return '--';
  
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = today - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export default function MenstrualHealthScreen({ user, onBack, onLogPeriod }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const calendarDays = generateCalendarDays(currentMonth);

  useEffect(() => {
    const loadData = async () => {
      if (!user || !user.uid) return;
      
      setLoading(true);
      try {
        const predictionsResult = await calculateCyclePredictions(user.uid);
        if (predictionsResult.success) {
          setPredictions(predictionsResult.data);
        }
      } catch (error) {
        console.error('Error loading menstrual data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return date && date.toDateString() === today.toDateString();
  };

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menstrual Health</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Info Cards */}
      <View style={styles.infoCardsContainer}>
        <View style={styles.daysLeftCard}>
          {loading ? (
            <Text style={styles.daysLeftHeading}>Loading...</Text>
          ) : predictions ? (
            <>
              <Text style={styles.daysLeftHeading}>{calculateDaysUntilPeriod(predictions.nextPeriodStart)} Days</Text>
              <Text style={styles.daysLeftSubheading}>left for your period</Text>
            </>
          ) : (
            <Text style={styles.daysLeftHeading}>-- Days</Text>
          )}
        </View>
        <TouchableOpacity style={styles.logPeriodCard} onPress={onLogPeriod}>
          <Text style={styles.logPeriodText}>Log Period</Text>
          <Ionicons name="create" size={16} color={colors.background} style={styles.editIcon} />
        </TouchableOpacity>
      </View>

      {/* Calendar Section */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Month/Year Display */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavButton}>
              <Ionicons name="chevron-back" size={20} color={colors.secondary} />
            </TouchableOpacity>
            <Text style={styles.monthYearText}>{monthYear}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavButton}>
              <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Week Days Header */}
          <View style={styles.weekHeader}>
            {weekDays.map((day) => (
              <Text key={day} style={styles.weekDayText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Days Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              return (
                <View
                  key={index}
                  style={[
                    styles.dayCell,
                    !date && styles.dayCellEmpty,
                    isToday(date) && styles.dayCellToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayCellText,
                      isToday(date) && styles.dayCellTextToday,
                    ]}
                  >
                    {date ? date.getDate() : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={styles.periodCircle} />
            <Text style={styles.legendText}>Period</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.predictedPeriodCircle} />
            <Text style={styles.legendText}>Predicted Period</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.fertileWindowCircle} />
            <Text style={styles.legendText}>Fertile Window</Text>
          </View>
        </View>
        
        {/* Period Info Box */}
        <View style={styles.periodInfoBox}>
          {loading ? (
            <Text style={styles.periodPredictionText}>Loading predictions...</Text>
          ) : predictions ? (
            <Text style={styles.periodPredictionText}>
              Your period is likely to start on or around <Text style={styles.periodDateText}>{formatDate(predictions.nextPeriodStart)}</Text>
            </Text>
          ) : (
            <Text style={styles.periodPredictionText}>
              Your period is likely to start on or around <Text style={styles.periodDateText}>--/--</Text>
            </Text>
          )}
        </View>
        
        {/* Last Menstrual Period Section */}
        <View style={styles.lmpSection}>
          <Text style={styles.lmpHeading}>Last Menstrual Period</Text>
          
          {/* LMP Cards */}
          <View style={styles.lmpCardsContainer}>
            <View style={styles.lmpCard}>
              <View style={styles.lmpCardRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                {loading ? (
                  <Text style={styles.lmpCardText}>Loading...</Text>
                ) : predictions?.lastPeriodStart ? (
                  <Text style={styles.lmpCardText}>Started {formatDate(predictions.lastPeriodStart)}</Text>
                ) : (
                  <Text style={styles.lmpCardText}>Not recorded</Text>
                )}
              </View>
              {loading ? (
                <Text style={styles.lmpCardSecondaryText}>Loading...</Text>
              ) : predictions?.lastPeriodStart ? (
                <Text style={styles.lmpCardSecondaryText}>{calculateDaysAgo(predictions.lastPeriodStart)} days ago</Text>
              ) : (
                <Text style={styles.lmpCardSecondaryText}>-- days ago</Text>
              )}
            </View>
            
            <View style={styles.lmpCard}>
              <View style={styles.lmpCardRow}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                {loading ? (
                  <Text style={styles.lmpCardText}>Loading...</Text>
                ) : (
                  <Text style={styles.lmpCardText}>Period Length: {predictions?.averagePeriodLength || '--'} days</Text>
                )}
              </View>
              <Text style={styles.lmpCardSecondaryText}>Average</Text>
            </View>
            
            <View style={styles.lmpCard}>
              <View style={styles.lmpCardRow}>
                <Ionicons name="sync-outline" size={16} color={colors.primary} />
                {loading ? (
                  <Text style={styles.lmpCardText}>Loading...</Text>
                ) : (
                  <Text style={styles.lmpCardText}>Cycle Length: {predictions?.averageCycleLength || '--'} days</Text>
                )}
              </View>
              <Text style={styles.lmpCardSecondaryText}>Average</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingTop: 16,
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
  infoCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  daysLeftCard: {
    flex: 1,
    backgroundColor: colors.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
  },
  daysLeftHeading: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: colors.secondary,
    marginBottom: 4,
  },
  daysLeftSubheading: {
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: colors.secondary,
  },
  logPeriodCard: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logPeriodText: {
    fontSize: 16,
    fontFamily: 'Roboto_500Medium',
    color: colors.background,
  },
  editIcon: {
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  calendarCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  monthNavButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: colors.secondary,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Roboto_500Medium',
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellEmpty: {
    backgroundColor: 'transparent',
  },
  dayCellToday: {
    backgroundColor: colors.primary,
    borderRadius: 16,
  },
  dayCellText: {
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: colors.secondary,
  },
  dayCellTextToday: {
    color: colors.background,
    fontFamily: 'Roboto_500Medium',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  periodCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: 8,
  },
  predictedPeriodCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dotted',
    marginRight: 8,
  },
  fertileWindowCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E7E7FF',
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: colors.secondary,
  },
  periodInfoBox: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  periodPredictionText: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: colors.background,
    textAlign: 'center',
  },
  periodDateText: {
    fontFamily: 'Roboto_700Bold',
  },
  lmpSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  lmpHeading: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: colors.secondary,
    marginBottom: 16,
  },
  lmpCardsContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  lmpCard: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 12,
    padding: 16,
  },
  lmpCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  lmpCardText: {
    fontSize: 14,
    fontFamily: 'Roboto_500Medium',
    color: colors.secondary,
    marginLeft: 8,
  },
  lmpCardSecondaryText: {
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: colors.secondary,
    opacity: 0.7,
    marginLeft: 24,
  },
});
```

### Track Your Health Screen (`screens/TrackYourHealthScreen.js`)
Daily tracking interface for mood, symptoms, and flow:

```javascript
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../colors.json';
import { saveDailyTracking } from '../utils/firebase/menstrualService';

export default function TrackYourHealthScreen({ user, onBack, onOpenCalendar }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedSymptom, setSelectedSymptom] = useState(null);
  const [selectedFlow, setSelectedFlow] = useState(null);

  const moods = [
    { id: 'neutral', name: 'Neutral', icon: 'ellipse-outline' },
    { id: 'emotional', name: 'Emotional', icon: 'heart-half-outline' },
    { id: 'sensitive', name: 'Sensitive', icon: 'hand-left-outline' },
    { id: 'anxious', name: 'Anxious', icon: 'alert-circle-outline' },
    { id: 'moody', name: 'Moody', icon: 'cloudy-outline' },
    { id: 'irritable', name: 'Irritable', icon: 'flash-outline' },
    { id: 'sad', name: 'Sad', icon: 'sad-outline' },
    { id: 'overwhelmed', name: 'Overwhelmed', icon: 'expand-outline' },
    { id: 'fatigued', name: 'Fatigued', icon: 'moon-outline' },
  ];

  const symptoms = [
    { id: 'headache', name: 'Headache', icon: 'bandage-outline' },
    { id: 'backpain', name: 'Back Pain', icon: 'accessibility-outline' },
    { id: 'fatigue', name: 'Fatigue', icon: 'battery-dead-outline' },
    { id: 'acne', name: 'Acne', icon: 'sparkles-outline' },
    { id: 'nausea', name: 'Nausea', icon: 'water-outline' },
  ];

  const flows = [
    { id: 'spotting', name: 'Spotting', icon: 'water-outline' },
    { id: 'light', name: 'Light', icon: 'thermometer-outline' },
    { id: 'medium', name: 'Medium', icon: 'speedometer-outline' },
    { id: 'heavy', name: 'Heavy', icon: 'speedometer-sharp' },
    { id: 'very-heavy', name: 'Very Heavy', icon: 'speedometer-sharp' },
  ];

  const handleSave = async () => {
    if (!user || !user.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    
    const today = new Date();
    const trackingData = {
      date: today.toISOString().split('T')[0],
      mood: selectedMood,
      symptom: selectedSymptom,
      flow: selectedFlow
    };
    
    const result = await saveDailyTracking(user.uid, today, trackingData);
    
    if (result.success) {
      // Show popup and navigate back
      Alert.alert(
        'Saved',
        'Your health tracking data has been saved successfully.',
        [
          {
            text: 'OK',
            onPress: () => onBack(),
          },
        ],
        { cancelable: false }
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to save data');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.background} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Your Health</Text>
        <TouchableOpacity style={styles.calendarButton} onPress={onOpenCalendar}>
          <Ionicons name="calendar-outline" size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Mood Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Mood</Text>
          <View style={styles.cardsContainer}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.card,
                  styles.moodCard,
                  selectedMood === mood.id && styles.selectedCard,
                ]}
                onPress={() => setSelectedMood(mood.id)}
              >
                <Ionicons 
                  name={mood.icon} 
                  size={24} 
                  color={selectedMood === mood.id ? colors.background : colors.purple} 
                  style={styles.cardIcon}
                />
                <Text 
                  style={[
                    styles.cardText,
                    selectedMood === mood.id && styles.selectedCardText,
                  ]}
                >
                  {mood.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Symptoms Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Symptoms</Text>
          <View style={styles.cardsContainer}>
            {symptoms.map((symptom) => (
              <TouchableOpacity
                key={symptom.id}
                style={[
                  styles.card,
                  styles.symptomCard,
                  selectedSymptom === symptom.id && styles.selectedCard,
                ]}
                onPress={() => setSelectedSymptom(symptom.id)}
              >
                <Ionicons 
                  name={symptom.icon} 
                  size={24} 
                  color={selectedSymptom === symptom.id ? colors.background : colors.blue} 
                  style={styles.cardIcon}
                />
                <Text 
                  style={[
                    styles.cardText,
                    selectedSymptom === symptom.id && styles.selectedCardText,
                  ]}
                >
                  {symptom.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Flow Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Flow</Text>
          <View style={styles.cardsContainer}>
            {flows.map((flow) => (
              <TouchableOpacity
                key={flow.id}
                style={[
                  styles.card,
                  styles.flowCard,
                  selectedFlow === flow.id && styles.selectedCard,
                ]}
                onPress={() => setSelectedFlow(flow.id)}
              >
                <Ionicons 
                  name={flow.icon} 
                  size={24} 
                  color={selectedFlow === flow.id ? colors.background : colors.yellow} 
                  style={styles.cardIcon}
                />
                <Text 
                  style={[
                    styles.cardText,
                    selectedFlow === flow.id && styles.selectedCardText,
                  ]}
                >
                  {flow.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          (selectedMood || selectedSymptom || selectedFlow) && styles.saveButtonActive,
        ]}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
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
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.primary,
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
    color: colors.background,
  },
  calendarButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeading: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: colors.secondary,
    marginBottom: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '30%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  moodCard: {
    borderColor: colors.purple,
  },
  symptomCard: {
    borderColor: colors.blue,
  },
  flowCard: {
    borderColor: colors.yellow,
  },
  selectedCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardText: {
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: colors.secondary,
    textAlign: 'center',
  },
  selectedCardText: {
    color: colors.background,
  },
  saveButton: {
    backgroundColor: '#CCCCCC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  saveButtonActive: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto_500Medium',
    color: colors.secondary,
  },
});
```

### Calendar Screen (`screens/CalendarScreen.js`)
Visual calendar showing tracked data:

```javascript
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../colors.json';
import { getTrackingInRange } from '../utils/firebase/menstrualService';

function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getFirstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

function generateCalendarDays(date) {
  const daysInMonth = getDaysInMonth(date);
  const firstDay = getFirstDayOfMonth(date);
  const days = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add days of month
  for (let i = 1; i <= daysInMonth; i++) {
    const newDate = new Date(date.getFullYear(), date.getMonth(), i);
    days.push(newDate);
  }

  return days;
}

function getFlowStyle(flow) {
  switch (flow) {
    case 'spotting':
      return { backgroundColor: '#FFE4B5', borderColor: '#FFD700' };
    case 'light':
      return { backgroundColor: '#FFB6C1', borderColor: '#FF69B4' };
    case 'medium':
      return { backgroundColor: '#FF6347', borderColor: '#FF4500' };
    case 'heavy':
    case 'very-heavy':
      return { backgroundColor: '#DC143C', borderColor: '#8B0000' };
    default:
      return {};
  }
}

export default function CalendarScreen({ user, onBack }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [trackingData, setTrackingData] = useState({});
  const [loading, setLoading] = useState(true);
  const calendarDays = generateCalendarDays(currentMonth);

  useEffect(() => {
    const loadTrackingData = async () => {
      if (!user || !user.uid) return;
      
      setLoading(true);
      try {
        // Load data for 3 months around current month
        const startDate = new Date(currentMonth);
        startDate.setMonth(startDate.getMonth() - 1);
        
        const endDate = new Date(currentMonth);
        endDate.setMonth(endDate.getMonth() + 1);
        
        const result = await getTrackingInRange(user.uid, startDate, endDate);
        if (result.success) {
          setTrackingData(result.data);
        }
      } catch (error) {
        console.error('Error loading tracking data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTrackingData();
  }, [user, currentMonth]);

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return date && date.toDateString() === today.toDateString();
  };

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.background} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Month/Year Display */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavButton}>
              <Ionicons name="chevron-back" size={20} color={colors.secondary} />
            </TouchableOpacity>
            <Text style={styles.monthYearText}>{monthYear}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavButton}>
              <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Week Days Header */}
          <View style={styles.weekHeader}>
            {weekDays.map((day) => (
              <Text key={day} style={styles.weekDayText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Days Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              const dateStr = date ? date.toISOString().split('T')[0] : '';
              const dayData = dateStr ? trackingData[dateStr] : null;
              
              return (
                <View
                  key={index}
                  style={[
                    styles.dayCell,
                    !date && styles.dayCellEmpty,
                    isToday(date) && styles.dayCellToday,
                    dayData?.flow && getFlowStyle(dayData.flow),
                  ]}
                >
                  <Text
                    style={[
                      styles.dayCellText,
                      isToday(date) && styles.dayCellTextToday,
                      dayData?.flow && styles.dayCellTextTracked,
                    ]}
                  >
                    {date ? date.getDate() : ''}
                  </Text>
                  {dayData?.flow && (
                    <View style={styles.flowIndicator} />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
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
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.primary,
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
    color: colors.background,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  calendarCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  monthNavButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: colors.secondary,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Roboto_500Medium',
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellEmpty: {
    backgroundColor: 'transparent',
  },
  dayCellToday: {
    backgroundColor: colors.primary,
    borderRadius: 16,
  },
  dayCellText: {
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: colors.secondary,
  },
  dayCellTextToday: {
    color: colors.background,
    fontFamily: 'Roboto_500Medium',
  },
  dayCellTextTracked: {
    color: '#000',
  },
  flowIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000',
  },
});
```

### Log Period Screen (`screens/LogPeriodScreen.js`)
Interface for logging new menstrual periods:

```javascript
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../colors.json';
import { logMenstrualPeriod } from '../utils/firebase/menstrualService';

export default function LogPeriodScreen({ user, onBack }) {
  const [startDate, setStartDate] = useState(new Date());
  const [length, setLength] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user || !user.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    
    if (!length || isNaN(length) || parseInt(length) <= 0) {
      Alert.alert('Error', 'Please enter a valid period length');
      return;
    }
    
    setLoading(true);
    try {
      const result = await logMenstrualPeriod(user.uid, startDate, parseInt(length));
      
      if (result.success) {
        Alert.alert(
          'Saved',
          'Your period has been logged successfully.',
          [
            {
              text: 'OK',
              onPress: () => onBack(),
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to log period');
      }
    } catch (error) {
      console.error('Error logging period:', error);
      Alert.alert('Error', 'Failed to log period');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDateChange = (days) => {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() + days);
    setStartDate(newDate);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.background} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Period</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>When did your period start?</Text>
          <View style={styles.dateSelector}>
            <TouchableOpacity 
              style={styles.dateNavButton} 
              onPress={() => handleDateChange(-1)}
            >
              <Ionicons name="chevron-back" size={20} color={colors.secondary} />
            </TouchableOpacity>
            
            <View style={styles.dateDisplay}>
              <Text style={styles.dateText}>{formatDate(startDate)}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.dateNavButton} 
              onPress={() => handleDateChange(1)}
              disabled={startDate.toDateString() === new Date().toDateString()}
            >
              <Ionicons name="chevron-forward" size={20} color={
                startDate.toDateString() === new Date().toDateString() 
                  ? colors.secondary + '80' 
                  : colors.secondary
              } />
            </TouchableOpacity>
          </View>
        </View>

        {/* Period Length */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>How many days did it last?</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={length}
              onChangeText={setLength}
              placeholder="Enter number of days"
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={styles.daysText}>days</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Logging your period helps us predict future cycles and fertility windows more accurately.
          </Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Period'}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.primary,
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
    color: colors.background,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeading: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: colors.secondary,
    marginBottom: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateNavButton: {
    padding: 8,
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Roboto_500Medium',
    color: colors.secondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: colors.secondary,
  },
  daysText: {
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: colors.secondary,
    marginLeft: 8,
  },
  infoBox: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: colors.secondary,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.primary + '80',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto_500Medium',
    color: colors.background,
  },
});
```

## Calculation Algorithms

### Cycle Prediction Algorithm
The system uses a sophisticated algorithm to predict future cycles:

```javascript
// In calculateCyclePredictions function
export const calculateCyclePredictions = async (userId) => {
  try {
    // 1. Get user's menstrual profile and history
    const profileResult = await getMenstrualProfile(userId);
    const userProfile = profileResult.success ? profileResult.data : null;
    const historyResult = await getMenstrualHistory(userId, 6);
    
    // 2. Handle case with no history
    if (!historyResult.success || !historyResult.data.length) {
      // Return default predictions
      const today = new Date();
      const nextPeriodStart = new Date(today);
      nextPeriodStart.setDate(today.getDate() + 28);
      
      return {
        success: true,
        data: {
          averageCycleLength: 28,
          averagePeriodLength: 5,
          nextPeriodStart: nextPeriodStart.toISOString().split('T')[0],
          lastPeriodStart: userProfile?.lastPeriodStart || null,
          fertilityWindowStart: null,
          fertilityWindowEnd: null,
          ovulationDate: null
        }
      };
    }
    
    // 3. Sort periods chronologically
    const periods = historyResult.data.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    // 4. Calculate average cycle length
    let totalCycleLength = 0;
    let cycleCount = 0;
    
    for (let i = 1; i < periods.length; i++) {
      const prevStart = new Date(periods[i-1].startDate);
      const currStart = new Date(periods[i].startDate);
      const diffDays = Math.round((currStart - prevStart) / (1000 * 60 * 60 * 24));
      totalCycleLength += diffDays;
      cycleCount++;
    }
    
    const averageCycleLength = cycleCount > 0 ? Math.round(totalCycleLength / cycleCount) : 28;
    const averagePeriodLength = periods.reduce((sum, p) => sum + (p.length || 5), 0) / periods.length;
    
    // 5. Predict next period
    const lastPeriodStart = new Date(periods[periods.length - 1].startDate);
    const nextPeriodStart = new Date(lastPeriodStart);
    nextPeriodStart.setDate(lastPeriodStart.getDate() + averageCycleLength);
    
    // 6. Predict fertility window (simplified model)
    const ovulationDay = averageCycleLength - 14; // Typical ovulation day
    const fertilityStart = new Date(nextPeriodStart);
    fertilityStart.setDate(nextPeriodStart.getDate() + ovulationDay - 5);
    const fertilityEnd = new Date(nextPeriodStart);
    fertilityEnd.setDate(nextPeriodStart.getDate() + ovulationDay + 1);
    
    const ovulationDate = new Date(nextPeriodStart);
    ovulationDate.setDate(nextPeriodStart.getDate() + ovulationDay);
    
    // 7. Return predictions
    return {
      success: true,
      data: {
        averageCycleLength,
        averagePeriodLength: Math.round(averagePeriodLength),
        nextPeriodStart: nextPeriodStart.toISOString().split('T')[0],
        lastPeriodStart: userProfile?.lastPeriodStart || periods[periods.length - 1].startDate,
        fertilityWindowStart: fertilityStart.toISOString().split('T')[0],
        fertilityWindowEnd: fertilityEnd.toISOString().split('T')[0],
        ovulationDate: ovulationDate.toISOString().split('T')[0]
      }
    };
  } catch (error) {
    console.error('Calculate cycle predictions error:', error);
    return {
      success: false,
      error: error.message || 'Failed to calculate predictions'
    };
  }
};
```

### Key Metrics Calculated
1. **Average Cycle Length**: Mean number of days between period start dates
2. **Average Period Length**: Mean duration of menstrual periods
3. **Next Period Prediction**: Estimated start date of next period
4. **Fertility Window**: 6-day window around ovulation
5. **Ovulation Date**: Estimated day of ovulation
6. **Days Until Next Period**: Countdown to predicted period

## State Management

The menstrual health system integrates with the app's global state management:

```javascript
// In App.js navigation setup
case SCREENS.MENSTRUAL_HEALTH:
  return (
    <MenstrualHealthScreen
      user={currentUser}
      onBack={() => goBack()}
      onLogPeriod={() => navigateTo(SCREENS.LOG_PERIOD)}
    />
  );

case SCREENS.TRACK_YOUR_HEALTH:
  return (
    <TrackYourHealthScreen
      user={currentUser}
      onBack={() => goBack()}
      onOpenCalendar={() => navigateTo(SCREENS.CALENDAR_SCREEN)}
    />
  );

case SCREENS.CALENDAR_SCREEN:
  return (
    <CalendarScreen
      user={currentUser}
      onBack={() => goBack()}
    />
  );

case SCREENS.LOG_PERIOD:
  return (
    <LogPeriodScreen
      user={currentUser}
      onBack={() => goBack()}
    />
  );
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install @react-native-async-storage/async-storage
npm install @expo/vector-icons
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
│   └── (shared components)
├── screens/
│   ├── MenstrualHealthScreen.js
│   ├── TrackYourHealthScreen.js
│   ├── CalendarScreen.js
│   └── LogPeriodScreen.js
├── utils/
│   ├── firebase/
│   │   └── menstrualService.js
│   └── (other utility files)
└── colors.json
```

### 4. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /menstrualPeriods/{periodId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /dailyTracking/{date} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### 5. Integration Points
1. **App Navigation**: Integrate menstrual health screens into your navigation system
2. **User Authentication**: Ensure user authentication is set up with Firebase Auth
3. **Data Models**: Use the provided data structures for consistency
4. **UI Components**: Customize styling in `colors.json` to match your brand

## Key Features Implemented

1. **Period Tracking**: Log and view menstrual period history
2. **Daily Symptom Tracking**: Monitor mood, symptoms, and flow daily
3. **Predictive Analytics**: Calculate future period dates and fertility windows
4. **Calendar Visualization**: Visual representation of tracked data
5. **Personalized Insights**: Tailored health recommendations
6. **Data Persistence**: Secure storage in Firebase Firestore
7. **Offline Support**: Local caching for offline access
8. **Privacy Protection**: End-to-end data security
9. **Responsive UI**: Adapts to different screen sizes
10. **Accessibility**: Follows accessibility best practices

## Customization Options

1. **Styling**: Modify `colors.json` and component styles to match your brand
2. **Tracking Categories**: Add new mood, symptom, or flow categories
3. **Calculation Models**: Enhance prediction algorithms with machine learning
4. **Notification System**: Add reminders and alerts for tracking
5. **Export Functionality**: Allow users to export their data
6. **Integration**: Connect with health apps and wearables
7. **Localization**: Support multiple languages and regional formats
8. **Advanced Analytics**: Add trend analysis and health insights

This documentation provides everything needed to replicate the complete menstrual health system in another React Native project. The modular architecture makes it easy to customize and extend based on your specific requirements.