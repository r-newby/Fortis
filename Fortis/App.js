import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { importExercises } from './src/utils/import'; // updated utility
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider, useApp } from './src/context/AppContext';
import { WorkoutProvider } from './src/context/WorkoutContext';

SplashScreen.preventAutoHideAsync();

const Navigation = () => {
  const { userProfile, isLoading } = useApp();

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;

  const isOnboarded = !!userProfile?.username;

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <AppNavigator isOnboarded={isOnboarded} />
    </NavigationContainer>
  );
};

export default function App() {
  useEffect(() => {
    console.log('Running importExercises from App.js...');

    const runImport = async () => {
      try {
        if (__DEV__) {
          await importExercises();
        }
      } catch (err) {
        console.error('Exercise import failed:', err.message || err);
      }
    };

   // runImport();
  }, []);

  return (
    <AppProvider>
      <WorkoutProvider>
        <Navigation />
      </WorkoutProvider>
    </AppProvider>
  );
}
