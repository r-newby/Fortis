// Updated AppContext.js - Personal Records calculated from Supabase workout data

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

  // Calculate Personal Records from Supabase workout data
  const calculatePersonalRecords = async (userId) => {
    try {
      console.log('Calculating personal records for user:', userId);
      
      // Get all workout exercises with exercise details for this user
      const { data: workoutExercises, error } = await supabase
        .from('workout_exercises')
        .select(`
          *,
          exercises (
            id,
            name,
            target,
            body_part,
            equipment
          ),
          workouts!inner (
            user_id,
            date
          )
        `)
        .eq('workouts.user_id', userId);

      if (error) {
        console.error('Error fetching workout exercises for PRs:', error);
        return {};
      }

      console.log('Found workout exercises:', workoutExercises?.length || 0);

      // Sort by date manually after fetching (since we can't order by joined table columns easily)
      const sortedWorkoutExercises = workoutExercises?.sort((a, b) => 
        new Date(a.workouts.date) - new Date(b.workouts.date)
      ) || [];

      const records = {};
      const exerciseHistory = {}; // Track all attempts per exercise

      sortedWorkoutExercises?.forEach(we => {
        const exerciseName = we.exercises?.name;
        const exerciseDetails = we.exercises;
        
        if (!exerciseName || !exerciseDetails) return;

        // Use actual values if available, fallback to planned values
        const weight = we.actual_weight || we.weight || 0;
        const reps = we.actual_reps || we.reps || 0;
        const workoutDate = we.workouts?.date;

        // Skip if no meaningful data
        if (reps <= 0) return;

        // Initialize exercise history if first time seeing this exercise
        if (!exerciseHistory[exerciseName]) {
          exerciseHistory[exerciseName] = [];
        }

        // Calculate score for this attempt
        let currentScore;
        if (weight > 0) {
          // Weighted exercise: prioritize by total volume
          currentScore = weight * reps;
        } else {
          // Bodyweight exercise: prioritize by max reps
          currentScore = reps;
        }

        // Add this attempt to history
        exerciseHistory[exerciseName].push({
          weight,
          reps,
          score: currentScore,
          date: workoutDate,
          exerciseDetails
        });

        // Only create a PR if this beats a previous attempt
        const previousAttempts = exerciseHistory[exerciseName];
        const isNewPR = previousAttempts.length > 1 && // Must have done this exercise before
          currentScore > Math.max(...previousAttempts.slice(0, -1).map(attempt => attempt.score));

        // If this is a new PR (or we're updating an existing PR with a better score)
        if (isNewPR || (records[exerciseName] && currentScore > (records[exerciseName].volume || (records[exerciseName].weight * records[exerciseName].reps)))) {
          records[exerciseName] = {
            weight,
            reps,
            date: workoutDate,
            exerciseId: exerciseDetails.id,
            // Store exercise details for categorization
            target: exerciseDetails.target,
            bodypart: exerciseDetails.body_part,
            equipment: exerciseDetails.equipment,
            // Calculate volume for display
            volume: weight * reps,
            // Mark as a true PR
            isPR: true
          };
        }
      });

      console.log('Calculated personal records (true PRs only):', Object.keys(records).length);
      return records;

    } catch (error) {
      console.error('Error calculating personal records:', error);
      return {};
    }
  };

  
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

      // Load user profile
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

      // Load workouts from Supabase
      const { data: supabaseWorkouts, error: workoutError } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            actual_reps,
            actual_weight,
            sets,
            reps,
            weight,
            exercises (
              name
            )
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

      // Calculate Personal Records from Supabase data
      const calculatedPRs = await calculatePersonalRecords(authUser.id);
      setPersonalRecords(calculatedPRs);

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
      
      // Recalculate PRs after saving new workout
      if (user?.id) {
        const updatedPRs = await calculatePersonalRecords(user.id);
        setPersonalRecords(updatedPRs);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to save workout:', error);
      return false;
    }
  };

  // Updated to work with Supabase-calculated PRs
  const updatePersonalRecord = async (exerciseId, record) => {
    // Since PRs are now calculated from workout data, 
    // we don't manually update them anymore
    // Instead, recalculate from current workout data
    if (user?.id) {
      const updatedPRs = await calculatePersonalRecords(user.id);
      setPersonalRecords(updatedPRs);
      return true;
    }
    return false;
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

  // Add progression suggestion functions
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

  const getPreviousWorkout = async (exerciseId) => {
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

const getProgressionHistory = async (exerciseId) => {
  if (!user) return [];

  const { data, error } = await supabase
    .from('workout_exercises')
    .select(`
      actual_reps,
      actual_weight,
      created_at,
      workout_id,
      workouts (intensity, user_id)
    `)
    .eq('exercise_id', exerciseId)
    .gte('created_at', new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get progression history:', error);
    return [];
  }

  return data
    .filter((row) => row.workouts?.user_id === user.id)
    .map((row) => ({
      date: row.created_at,
      reps: row.actual_reps,
      weight: row.actual_weight,
      intensity: row.workouts?.intensity || 3,
    }));
};


  const completeOnboarding = () => {
    setIsOnboarded(true);
  };

  const [needsReload, setNeedsReload] = useState(false);
  // Enhanced reloadData that recalculates PRs
  const reloadData = async () => {
    await loadAppData();
    setNeedsReload(false);

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
    reloadData,
    completeOnboarding,
    saveProgressionSuggestion,
    getProgressionHistory: getPreviousWorkout,
    // Expose the PR calculation function for manual recalculation if needed
    recalculatePersonalRecords: () => user?.id ? calculatePersonalRecords(user.id).then(setPersonalRecords) : null,
    needsReload, 
    setNeedsReload,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};