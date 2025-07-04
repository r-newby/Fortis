// src/navigation/OnboardingNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import OnboardingUsername from '../screens/onboarding/OnboardingUsername';
import OnboardingFitnessLevel from '../screens/onboarding/OnboardingFitnessLevel';
import OnboardingGoal from '../screens/onboarding/OnboardingGoal';
import { colors } from '../utils/colors';
import SignUpScreen from '../screens/auth/SignUpScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/main/DashboardScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Stack = createNativeStackNavigator();

const OnboardingNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        animationDuration: 350,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
        options={{
          animation: 'fade',
          animationDuration: 400,
        }}
      />
     
     <Stack.Screen name="SignUp" component={SignUpScreen} />
     <Stack.Screen name="Login" component={LoginScreen} />
     <Stack.Screen name="Dashboard" component={DashboardScreen} />
     
     <Stack.Screen name="Profile" component={ProfileScreen} />

      <Stack.Screen name="FitnessLevel" component={OnboardingFitnessLevel} />
      <Stack.Screen name="Goal" component={OnboardingGoal} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;