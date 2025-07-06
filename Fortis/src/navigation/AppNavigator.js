import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingNavigator from './OnboardingNavigator';
import MainTabNavigator from './MainTabNavigator';
import { colors } from '../utils/colors';

const Stack = createNativeStackNavigator();

const AppNavigator = ({ isOnboarded }) => {
  // Wait until onboarding status is known
  if (isOnboarded === null) return null;

  return (
    
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {isOnboarded ? (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
