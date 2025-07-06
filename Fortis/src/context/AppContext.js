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
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workouts, setWorkouts] = useState([]);
  const [personalRecords, setPersonalRecords] = useState({});

  useEffect(() => {
    loadAppData();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event);
      setUser(session?.user || null);
      if (session?.user) {
        loadAppData(); // Refresh profile if user logs in
      } else {
        setUserProfile(null); // Clear profile on logout
      }
    });

    return () => {
      authListener.subscription?.unsubscribe?.();
    };
  }, []);

  const loadAppData = async () => {
    try {
      setIsLoading(true);

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        console.warn('User not logged in:', authError);
        setUser(null);
        setUserProfile(null);
        return;
      }

      setUser(authUser);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError.message);
      } else {
        setUserProfile(profile);
      }

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
    const { data, error } = await supabase
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
      setUser(null);
      setUserProfile(null);
      setWorkouts([]);
      setPersonalRecords({});
    }
    return success;
  };

  const value = {
    user,
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
