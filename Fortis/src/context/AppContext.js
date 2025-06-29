// src/context/AppContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/asyncStorage';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workouts, setWorkouts] = useState([]);
  const [personalRecords, setPersonalRecords] = useState({});

  // Load initial data
  useEffect(() => {
    loadAppData();
  }, []);

  const loadAppData = async () => {
    try {
      setIsLoading(true);
      const [profile, workoutData, records] = await Promise.all([
        storage.getUserProfile(),
        storage.getWorkouts(),
        storage.getPersonalRecords(),
      ]);

      setUserProfile(profile);
      setWorkouts(workoutData);
      setPersonalRecords(records);
    } catch (error) {
      console.error('Error loading app data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (profile) => {
    const success = await storage.setUserProfile(profile);
    if (success) {
      setUserProfile(profile);
    }
    return success;
  };

  const saveWorkout = async (workout) => {
    const success = await storage.saveWorkout(workout);
    if (success) {
      await loadAppData(); // Reload to get updated data
    }
    return success;
  };

  const updatePersonalRecord = async (exerciseId, record) => {
    const success = await storage.updatePersonalRecord(exerciseId, record);
    if (success) {
      setPersonalRecords(await storage.getPersonalRecords());
    }
    return success;
  };

  const clearAllData = async () => {
    const success = await storage.clearAllData();
    if (success) {
      setUserProfile(null);
      setWorkouts([]);
      setPersonalRecords({});
    }
    return success;
  };

  const value = {
    userProfile,
    workouts,
    personalRecords,
    isLoading,
    updateUserProfile,
    saveWorkout,
    updatePersonalRecord,
    clearAllData,
    reloadData: loadAppData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};