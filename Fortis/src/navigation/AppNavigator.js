// src/navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Easing } from 'react-native';
import OnboardingNavigator from './OnboardingNavigator';
import MainTabNavigator from './MainTabNavigator';
import { colors } from '../utils/colors';

const Stack = createNativeStackNavigator();

const AppNavigator = ({ isOnboarded }) => {
  return (
    <Stack.Navigator
      initialRouteName={isOnboarded ? 'Main' : 'Onboarding'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        animationDuration: 300,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingNavigator}
        options={{
          animation: 'fade',
          animationDuration: 500,
        }}
      />
      <Stack.Screen 
        name="Main" 
        component={MainTabNavigator}
        options={{
          animation: 'fade_from_bottom',
          animationDuration: 600,
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;