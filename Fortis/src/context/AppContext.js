import React, { createContext, useContext, useState, useEffect } from 'react';
import storage from '../utils/asyncStorage';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    loadAppData();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event);
      setUser(session?.user || null);

      if (session?.user) {
        loadAppData();
      } else {
        setUserProfile(null);
        setIsOnboarded(false);
        setWorkouts([]);
        setPersonalRecords({});
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
        const normalizedProfile = {
          ...profile,
          fitnessLevel: profile.fitness_level,
          goal: profile.goal,
        };
        setUserProfile(normalizedProfile);
        if (profile?.username) {
          setIsOnboarded(true);
        }
      }

      const key = `workouts_${authUser.id}`;

      const { data: supabaseWorkouts, error: workoutError } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            actual_reps,
            actual_weight,
            sets,
            reps,
            weight
          )
        `)
        .eq('user_id', authUser.id)
        .order('date', { ascending: false });

      if (workoutError) {
        console.error('Error loading workouts:', workoutError.message);
        setWorkouts([]);
      } else {
        // Calculate total volume for each workout
      const normalized = supabaseWorkouts.map((w) => {
        const totalVolume = w.workout_exercises?.reduce((sum, ex) => {
          // Use actual values if available, fallback to planned values
          const reps = ex.actual_reps || ex.reps || 0;
          const weight = ex.actual_weight || ex.weight || 0;
          const sets = ex.sets || 1;
          return sum + (reps * weight * sets);
        }, 0) || 0;

        return {
          ...w,
          totalVolume,
          muscleGroup: w.muscle_group,
        };
      });

      setWorkouts(normalized);
    }

      const records = await storage.getPersonalRecords();
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
    try {
      const key = `workouts_${user?.id}`;
      const existing = await AsyncStorage.getItem(key);
      const workoutsArray = existing ? JSON.parse(existing) : [];
      const updatedWorkouts = [...workoutsArray, workout];
      await AsyncStorage.setItem(key, JSON.stringify(updatedWorkouts));
      setWorkouts(updatedWorkouts);
      return true;
    } catch (error) {
      console.error('Failed to save workout:', error);
      return false;
    }
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
      setIsOnboarded(false);
    }
    return success;
  };
// Add to AppContext.js to replace the AsyncStorage version
const saveProgressionSuggestion = async (exerciseId, suggestionData) => {
  try {
    const { data, error } = await supabase
      .from('progression_suggestions')
      .insert({
        user_id: user?.id,
        exercise_id: exerciseId,
        suggestion_type: suggestionData.suggestion,
        old_weight: suggestionData.weight,
        new_weight: suggestionData.newWeight,
        intensity_rating: suggestionData.intensity,
        reason: `${suggestionData.suggestion}_based_on_intensity_${suggestionData.intensity}`,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to save progression suggestion:', error);
    return false;
  }
};

const getProgressionHistory = async (exerciseId) => {
  try {
    const { data, error } = await supabase
      .from('progression_suggestions')
      .select('*')
      .eq('user_id', user?.id)
      .eq('exercise_id', exerciseId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Failed to get progression history:', error);
    return null;
  }
};

const completeOnboarding = () => {
  setIsOnboarded(true);
};

  const value = {
    user,
    userProfile,
    workouts,
    setWorkouts,
    personalRecords,
    isLoading,
    isOnboarded,
    updateUserProfile,
    saveWorkout,
    updatePersonalRecord,
    clearAllData,
    reloadData: loadAppData,
    completeOnboarding,
     saveProgressionSuggestion,
  getProgressionHistory,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};