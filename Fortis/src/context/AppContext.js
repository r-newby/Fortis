// src/context/AppContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/asyncStorage';
import { supabase } from '../supabase';

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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('User not logged in:', authError);
      setUserProfile(null);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError.message);
    } else {
      setUserProfile(profile);
    }

    // You can still keep local storage for workouts & PRs if you want
    const [workoutData, records] = await Promise.all([
      storage.getWorkouts(),
      storage.getPersonalRecords(),
    ]);

    setWorkouts(workoutData);
    setPersonalRecords(records);
  } catch (error) {
    console.error('Error loading app data:', error);
  } finally {
    setIsLoading(false);
  }
};

  const updateUserProfile = async (profileUpdate) => {
  const {
    data,
    error,
  } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', userProfile.id)
    .select()
    .single();

  if (error) {
    console.error('Update profile error:', error.message);
    return false;
  }

  setUserProfile(data);
  return true;
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