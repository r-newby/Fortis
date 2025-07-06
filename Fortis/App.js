import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider, useApp } from './src/context/AppContext';
import { WorkoutProvider } from './src/context/WorkoutContext';

SplashScreen.preventAutoHideAsync();

const Navigation = () => {
  const { userProfile, isLoading } = useApp();

  React.useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;
console.log('userProfile:', userProfile);
const isOnboarded =
  userProfile && userProfile.username
    ? true
    : false;


  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <AppNavigator isOnboarded={isOnboarded} />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AppProvider>
      <WorkoutProvider>
        <Navigation />
      </WorkoutProvider>
    </AppProvider>
  );
}
