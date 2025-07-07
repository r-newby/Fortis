// src/screens/workout/WorkoutDisplayScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import GradientButton from '../../components/common/GradientButton';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../supabase';

const WorkoutDisplayScreen = ({ navigation, route }) => {
  const { workout, muscleGroup } = route.params || {};
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [workoutExercises, setWorkoutExercises] = useState(workout || []);
  const [intensityRating, setIntensityRating] = useState(null);
  const { userProfile, setWorkouts } = useApp();

  useEffect(() => {
    
    if (!workoutExercises || workoutExercises.length === 0) {
      Alert.alert(
        'No Workout Generated',
        'Please select equipment and muscle group first.',
        [{ text: 'OK', onPress: () => navigation.navigate('WorkoutsList') }]
      );
    }


  }, [workoutExercises]);

  

  

  

  const saveWorkoutToStorage = async (userId, newWorkout) => {
    try {
      const key = `workouts_${userId}`;
      const existing = await AsyncStorage.getItem(key);
      const existingWorkouts = existing ? JSON.parse(existing) : [];
      const updatedWorkouts = [newWorkout, ...existingWorkouts];
      await AsyncStorage.setItem(key, JSON.stringify(updatedWorkouts));
    } catch (error) {
      console.error('Failed to save workout to storage:', error);
    }
  };

  const handleLogWorkout = async () => {
    if (!userProfile) {
      Alert.alert('User not found');
      return;
    }

    if (!intensityRating) {
      Alert.alert('Please rate your workout intensity before logging.');
      return;
    }

    try {
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: userProfile.id,
          date: new Date().toISOString(),
          intensity: intensityRating,
          muscle_group: muscleGroup,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      const workoutId = workoutData.id;

      const exerciseInserts = workoutExercises.map((ex) => ({
        workout_id: workoutId,
        exercise_id: ex.id,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight || null,
      }));

      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert(exerciseInserts);

      if (exercisesError) throw exercisesError;

      setWorkouts((prev) => [...prev, workoutData]);
      await saveWorkoutToStorage(userProfile.id, {
  ...workoutData,
  muscle_group: muscleGroup,
  totalVolume: workoutExercises.reduce((sum, ex) => {
    return sum + (ex.sets * ex.reps * (ex.weight || 0));
  }, 0),
});


      Alert.alert('Workout Logged', 'Your workout has been saved.', [
        {
          text: 'OK',
          onPress: () => {
            navigation.getParent().navigate('Dashboard');
          },
        },
      ]);
    } catch (error) {
      console.error('Error logging workout:', error);
      Alert.alert('Error', 'Could not save your workout.');
    }
  };

  const handleCancelWorkout = () => {
    Alert.alert(
      'Cancel Workout',
      'Are you sure you want to cancel this workout?',
      [
        { text: 'Continue Workout', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => navigation.navigate('WorkoutsList'),
        },
      ]
    );
  };

  const toggleExerciseExpanded = (exerciseId) => {
    setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId);
  };

  const ExerciseCard = ({ exercise, index }) => {
    const isExpanded = expandedExercise === exercise.id;

    return (
      <TouchableOpacity
        onPress={() => toggleExerciseExpanded(exercise.id)}
        activeOpacity={0.7}
      >
        <Card style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <View style={styles.exerciseNumber}>
              <Text style={styles.exerciseNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <View style={styles.exerciseTags}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>
                    {exercise.equipment.replace('_', ' ')}
                  </Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>
                    {exercise.sets} × {exercise.reps}
                  </Text>
                </View>
              </View>
            </View>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.textSecondary}
            />
          </View>

          {isExpanded && (
            <View style={styles.exerciseDetails}>
              <View style={styles.exerciseImage}>
                <Ionicons name="image" size={48} color={colors.textTertiary} />
              </View>
              <Text style={styles.instructionsTitle}>Instructions</Text>
              <Text style={styles.instructionsText}>{exercise.instructions}</Text>
              <Text style={styles.musclesTitle}>Target Muscles</Text>
              <View style={styles.musclesList}>
                {exercise.primaryMuscles?.map((muscle, idx) => (
                  <View
                    key={idx}
                    style={[styles.muscleTag, styles.primaryMuscle]}
                  >
                    <Text style={styles.muscleTagText}>
                      {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                    </Text>
                  </View>
                ))}
                {exercise.secondaryMuscles?.map((muscle, idx) => (
                  <View
                    key={idx}
                    style={[styles.muscleTag, styles.secondaryMuscle]}
                  >
                    <Text style={styles.muscleTagText}>
                      {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.restInfo}>
                <Ionicons name="timer-outline" size={20} color={colors.info} />
                <Text style={styles.restText}>
                  Rest {exercise.restSeconds}s between sets
                </Text>
              </View>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const getTotalWorkoutTime = () => {
    const totalSets = workoutExercises.reduce((sum, ex) => sum + ex.sets, 0);
    const avgSetTime = 45;
    const totalRestTime = workoutExercises.reduce(
      (sum, ex) => sum + (ex.sets - 1) * (ex.restSeconds || 30),
      0
    );
    const totalSeconds = totalSets * avgSetTime + totalRestTime;
    return Math.ceil(totalSeconds / 60);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleCancelWorkout}
          >
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Your Workout</Text>
            <Text style={styles.subtitle}>
              {muscleGroup?.charAt(0).toUpperCase() +
                muscleGroup?.slice(1).replace('_', ' ')}{' '}
              Focus
            </Text>
          </View>
        </View>

        <Card style={styles.intensityCard}>
          <Text style={styles.intensityTitle}>Rate Workout Intensity (1-5)</Text>
          <View style={styles.intensityButtons}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.intensityButton,
                  intensityRating === value && styles.intensitySelected,
                ]}
                onPress={() => setIntensityRating(value)}
              >
                <Text
                  style={
                    intensityRating === value
                      ? styles.intensityTextSelected
                      : styles.intensityText
                  }
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <View style={styles.buttonContainer}>
          <GradientButton
            title="Log Workout"
            onPress={handleLogWorkout}
            gradientColors={colors.gradientPrimary}
          />
          <TouchableOpacity
            style={styles.modifyButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.modifyButtonText}>Modify Selection</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -spacing.sm,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  intensityCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  intensityTitle: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  intensityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intensityButton: {
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    width: 44,
    alignItems: 'center',
  },
  intensitySelected: {
    backgroundColor: colors.primary,
  },
  intensityText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  intensityTextSelected: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  modifyButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  modifyButtonText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
});
export default WorkoutDisplayScreen;
