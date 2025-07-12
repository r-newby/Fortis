// src/navigation/MainTabNavigator.js
import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { typography } from '../utils/typography';

// Import screens
import DashboardScreen from '../screens/main/DashboardScreen';
import WorkoutsScreen from '../screens/main/WorkoutsScreen';
import ProgressScreen from '../screens/main/ProgressScreen';
import SocialScreen from '../screens/main/SocialScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Import workout flow screens
import EquipmentSelectionScreen from '../screens/workout/EquipmentSelectionScreen';
import MuscleGroupSelectionScreen from '../screens/workout/MuscleGroupSelectionScreen';
import WorkoutDisplayScreen from '../screens/workout/WorkoutDisplayScreen';
import ExerciseLoggingScreen from '../screens/workout/ExerciseLoggingScreen';
import WorkoutSummaryScreen from '../screens/workout/WorkoutSummaryScreen';
import WorkoutGenerationScreen from '../screens/workout/WorkoutGenerationScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Workout Stack Navigator with animations
const WorkoutStackNavigator = () => {
  console.log('Rendering MainTabNavigator');
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        animationDuration: 300,
      }}
    >
      <Stack.Screen 
        name="WorkoutsList" 
        component={WorkoutsScreen}
        options={{
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="EquipmentSelection" 
        component={EquipmentSelectionScreen}
        options={{
          animation: 'slide_from_bottom',
        
        }}
      />

       <Stack.Screen 
        name="WorkoutGenerator" 
        component={WorkoutGenerationScreen}
        options={{
          animation: 'slide_from_bottom',
          
        }}
      />
      <Stack.Screen 
        name="MuscleGroupSelection" 
        component={MuscleGroupSelectionScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="WorkoutDisplay" 
        component={WorkoutDisplayScreen}
        options={{
          animation: 'fade_from_bottom',
        }}
      />
      <Stack.Screen 
        name="ExerciseLogging" 
        component={ExerciseLoggingScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      
      
      <Stack.Screen
       name="WorkoutSummary"
       component={WorkoutSummaryScreen}
       options={{ headerShown: false }}
       />
    </Stack.Navigator>
  );
};

// Animated Tab Bar Icon Component
const TabBarIcon = ({ name, focused, label }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1.2,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -5,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused]);

  return (
    <Animated.View 
      style={[
        styles.tabBarIconContainer,
        {
          transform: [
            { scale: scaleValue },
            { translateY: translateY }
          ],
        }
      ]}
    >
      <Ionicons
        name={name}
        size={24}
        color={focused ? colors.primary : colors.textSecondary}
      />
      <Animated.Text 
        style={[
          styles.tabBarLabel,
          { 
            color: focused ? colors.primary : colors.textSecondary,
            opacity: focused ? 1 : 0.7,
          }
        ]}
      >
        {label}
      </Animated.Text>
    </Animated.View>
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 70,
          paddingTop: 5,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="home" focused={focused} label="Home" />
          ),
        }}
      />
      <Tab.Screen
        name="Workouts"
        component={WorkoutStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="barbell" focused={focused} label="Workouts" />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="stats-chart" focused={focused} label="Progress" />
          ),
        }}
      />
     
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="person" focused={focused} label="Profile" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  tabBarLabel: {
    ...typography.caption,
    marginTop: 4,
    fontSize: 10,
  },
});

export default MainTabNavigator;