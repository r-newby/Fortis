// src/screens/workout/WorkoutDisplayScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Vibration,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import GradientButton from '../../components/common/GradientButton';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../supabase';

const WorkoutDisplayScreen = ({ navigation, route }) => {
  const { workout, muscleGroup } = route.params || {};
  const [workoutExercises, setWorkoutExercises] = useState(workout || []);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [currentSet, setCurrentSet] = useState(0);
  const [completedSets, setCompletedSets] = useState({});
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showIntensityModal, setShowIntensityModal] = useState(false);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [showAdjustWeight, setShowAdjustWeight] = useState(false);
  const [showAdjustReps, setShowAdjustReps] = useState(false);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [currentReps, setCurrentReps] = useState(0);
  const [exerciseIntensities, setExerciseIntensities] = useState({});
  const [progressionSuggestion, setProgressionSuggestion] = useState(null);
  const [showProgressionModal, setShowProgressionModal] = useState(false);
  
  const { userProfile, setWorkouts, saveProgressionSuggestion, getProgressionHistory } = useApp();
  const timerRef = useRef(null);

  useEffect(() => {
    if (!workoutExercises || workoutExercises.length === 0) {
      Alert.alert(
        'No Workout Generated',
        'Please select equipment and muscle group first.',
        [{ text: 'OK', onPress: () => navigation.navigate('WorkoutsList') }]
      );
      return;
    }

    // Initialize current weight and reps for first exercise
    if (workoutExercises[0]) {
      setCurrentWeight(workoutExercises[0].weight || 0);
      setCurrentReps(workoutExercises[0].reps || 0);
    }
  }, [workoutExercises]);

  // Timer effect
  useEffect(() => {
    if (isTimerActive && restTime > 0) {
      timerRef.current = setInterval(() => {
        setRestTime(time => {
          if (time <= 1) {
            setIsTimerActive(false);
            setIsResting(false);
            Vibration.vibrate([0, 500, 200, 500]); // Vibration pattern
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isTimerActive, restTime]);

  // Update current weight/reps when exercise changes
  useEffect(() => {
    if (workoutExercises[currentExercise]) {
      setCurrentWeight(workoutExercises[currentExercise].weight || 0);
      setCurrentReps(workoutExercises[currentExercise].reps || 0);
      setShowAdjustWeight(false);
      setShowAdjustReps(false);
    }
  }, [currentExercise]);

  const getRestTime = (exercise) => {
    // Smart rest time based on exercise type
    const name = exercise.name.toLowerCase();
    const equipment = exercise.equipment.toLowerCase();
    
    // Compound movements get longer rest
    const compoundKeywords = ['squat', 'deadlift', 'bench', 'press', 'row', 'pull'];
    if (compoundKeywords.some(keyword => name.includes(keyword))) {
      return 180; // 3 minutes
    }
    
    // Barbell exercises get longer rest
    if (equipment.includes('barbell')) {
      return 150; // 2.5 minutes
    }
    
    // Isolation exercises get shorter rest
    const isolationKeywords = ['curl', 'raise', 'fly', 'extension', 'calf'];
    if (isolationKeywords.some(keyword => name.includes(keyword))) {
      return 90; // 1.5 minutes
    }
    
    return 120; // 2 minutes default
  };

  const startRestTimer = () => {
    const exercise = workoutExercises[currentExercise];
    const restDuration = getRestTime(exercise);
    setRestTime(restDuration);
    setIsResting(true);
    setIsTimerActive(true);
  };

  const completeSet = () => {
    const key = `${currentExercise}-${currentSet}`;
    setCompletedSets(prev => ({
      ...prev,
      [key]: { 
        reps: currentReps, 
        weight: currentWeight, 
        completed: true 
      }
    }));

    const exercise = workoutExercises[currentExercise];
    
    if (currentSet < exercise.sets - 1) {
      // More sets in current exercise
      setCurrentSet(currentSet + 1);
      startRestTimer();
    } else {
      // Exercise complete, ask for intensity rating
      setShowIntensityModal(true);
    }
  };

  const submitIntensityRating = (rating) => {
    setExerciseIntensities(prev => ({
      ...prev,
      [currentExercise]: rating
    }));
    
    setShowIntensityModal(false);
    
    // Check for progression suggestion
      const checkProgressionSuggestion = async (intensity) => {
    const exercise = workoutExercises[currentExercise];
    
    // Get previous history for this exercise
    const history = await getProgressionHistory(exercise.id);
    
    let suggestion = null;

    // Enhanced progression logic with history
    if (intensity <= 2 && (!history || history.intensity <= 2)) {
      suggestion = {
        type: 'progression',
        message: `Great job! You've been crushing this weight. Ready to try ${currentWeight + 5}lbs next week?`,
        newWeight: currentWeight + 5,
        exercise: exercise.name,
        exerciseId: exercise.id
      };
    } else if (intensity === 5) {
      suggestion = {
        type: 'regression',
        message: `That looked tough! Let's try ${Math.max(currentWeight - 5, 0)}lbs next week and focus on perfect form.`,
        newWeight: Math.max(currentWeight - 5, 0),
        exercise: exercise.name,
        exerciseId: exercise.id
      };
    }

    if (suggestion) {
      // Save the suggestion to history
      await saveProgressionSuggestion(exercise.id, {
        intensity,
        weight: currentWeight,
        suggestion: suggestion.type,
        newWeight: suggestion.newWeight
      });
      
      setProgressionSuggestion(suggestion);
      setShowProgressionModal(true);
    }
  };
    
    // Move to next exercise or complete workout
    if (currentExercise < workoutExercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setCurrentSet(0);
    } else {
      setWorkoutComplete(true);
    }
  };

  const checkProgressionSuggestion = (intensity) => {
    const exercise = workoutExercises[currentExercise];
    let suggestion = null;

    // Simple progression logic - you can enhance this
    if (intensity <= 2) {
      suggestion = {
        type: 'progression',
        message: `Great job! You've been crushing this weight. Ready to try ${currentWeight + 5}lbs next week?`,
        newWeight: currentWeight + 5,
        exercise: exercise.name
      };
    } else if (intensity === 5) {
      suggestion = {
        type: 'regression',
        message: `That looked tough! Let's try ${Math.max(currentWeight - 5, 0)}lbs next week and focus on perfect form.`,
        newWeight: Math.max(currentWeight - 5, 0),
        exercise: exercise.name
      };
    }

    if (suggestion) {
      setProgressionSuggestion(suggestion);
      setShowProgressionModal(true);
    }
  };

  const skipRest = () => {
    setIsTimerActive(false);
    setRestTime(0);
    setIsResting(false);
  };

  const adjustRestTime = (seconds) => {
    setRestTime(prev => Math.max(0, prev + seconds));
  };

  const adjustWeight = (change) => {
    setCurrentWeight(prev => Math.max(0, prev + change));
  };

  const adjustReps = (change) => {
    setCurrentReps(prev => Math.max(1, prev + change));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCompletionPercentage = () => {
    const totalSets = workoutExercises.reduce((sum, ex) => sum + ex.sets, 0);
    const completedCount = Object.keys(completedSets).length;
    return Math.round((completedCount / totalSets) * 100);
  };

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

    // Calculate average intensity
    const intensities = Object.values(exerciseIntensities);
    const avgIntensity = intensities.length > 0 
      ? Math.round(intensities.reduce((a, b) => a + b, 0) / intensities.length)
      : 3;

    try {

      const totalVolume = workoutExercises.reduce((sum, ex, index) => {
        const sets = ex.sets || 1;
        const reps = ex.reps || 0;
        const weight = ex.weight || 0;
        return sum + (sets * reps * weight);
      }, 0);
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: userProfile.id,
          date: new Date().toISOString(),
          intensity: avgIntensity,
          muscle_group: muscleGroup,
          total_volume: totalVolume,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      const workoutId = workoutData.id;

 const exerciseInserts = workoutExercises.map((ex, index) => {
  // Calculate averages from all completed sets for this exercise
  const completedSetsForExercise = [];
  for (let i = 0; i < ex.sets; i++) {
    const setKey = `${index}-${i}`;
    const setData = completedSets[setKey];
    if (setData) completedSetsForExercise.push(setData);
  }

  // Calculate average actual performance
  const avgActualReps = completedSetsForExercise.length > 0
    ? Math.round(completedSetsForExercise.reduce((sum, set) => sum + set.reps, 0) / completedSetsForExercise.length)
    : ex.reps;
    
  const avgActualWeight = completedSetsForExercise.length > 0
    ? Math.round(completedSetsForExercise.reduce((sum, set) => sum + set.weight, 0) / completedSetsForExercise.length)
    : (ex.weight || 0);

  // Create one row per exercise (not per set)
  return {
    workout_id: workoutId,
    exercise_id: ex.id,
    sets: ex.sets, // Total sets planned for this exercise
    planned_reps: ex.reps,
    actual_reps: avgActualReps,
    planned_weight: ex.weight || null,
    actual_weight: avgActualWeight || null,
    reps: avgActualReps, // Keep for backward compatibility
    weight: avgActualWeight || null, // Keep for backward compatibility
  };
});

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

      Alert.alert('Workout Logged', 'Your workout has been saved!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset navigation state to remove this screen from the stack
            navigation.reset({
              index: 0,
              routes: [{ name: 'WorkoutsList' }],
            });
            navigation.getParent().navigate('Dashboard');
          },
        },
      ]);
    } catch (error) {
      console.error('Error logging workout:', error);
      Alert.alert('Error', 'Could not save your workout.');
    }
  };

  if (workoutComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionTitle}>Workout Complete!</Text>
          <Text style={styles.completionSubtitle}>
            Great job crushing your {muscleGroup} workout!
          </Text>
          
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Today's Summary:</Text>
            <Text style={styles.summaryItem}>✅ {workoutExercises.length} exercises completed</Text>
            <Text style={styles.summaryItem}>✅ {workoutExercises.reduce((sum, ex) => sum + ex.sets, 0)} sets finished</Text>
            <Text style={styles.summaryItem}>✅ {getCompletionPercentage()}% completion rate</Text>
          </Card>

          <GradientButton
            title="Log Workout"
            onPress={handleLogWorkout}
            gradientColors={colors.gradientPrimary}
            style={styles.logButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const currentExerciseData = workoutExercises[currentExercise];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>{muscleGroup?.charAt(0).toUpperCase() + muscleGroup?.slice(1)} Workout</Text>
            <Text style={styles.subtitle}>Exercise {currentExercise + 1} of {workoutExercises.length}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentExercise + 1) / workoutExercises.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(((currentExercise + 1) / workoutExercises.length) * 100)}% Complete
          </Text>
        </View>

        {/* Current Exercise */}
          <Card style={styles.exerciseCard}>
            <View style={styles.exerciseInfoContainer}>
              <Text style={styles.setNumber}>Set {currentSet + 1} of {currentExerciseData.sets}</Text>
              <Text style={styles.exerciseName}>{currentExerciseData.name}</Text>
              <Text style={styles.exerciseTarget}>
                {currentExerciseData.target} • {currentExerciseData.equipment}
              </Text>
              <Text style={styles.setDetails}>
                <Text style={styles.setDetails}>
                  {currentReps} reps{currentWeight > 0 ? ` @ ${currentWeight} lbs` : ''}
                </Text>

              </Text>
            </View>
          </Card>


        {/* Rest Timer */}
        {isResting && (
          <Card style={styles.timerCard}>
            <View style={styles.timerHeader}>
              <Ionicons name="timer-outline" size={24} color={colors.warning} />
              <Text style={styles.timerTitle}>Rest Time</Text>
            </View>
            <Text style={styles.timerDisplay}>{formatTime(restTime)}</Text>
            <View style={styles.timerControls}>
              <TouchableOpacity 
                onPress={() => adjustRestTime(-30)}
                style={styles.timerButton}
              >
                <Ionicons name="remove" size={20} color={colors.warning} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setIsTimerActive(!isTimerActive)}
                style={styles.timerButton}
              >
                <Ionicons 
                  name={isTimerActive ? "pause" : "play"} 
                  size={20} 
                  color={colors.warning} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => adjustRestTime(30)}
                style={styles.timerButton}
              >
                <Ionicons name="add" size={20} color={colors.warning} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={skipRest}>
              <Text style={styles.skipText}>Skip Rest</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Action Buttons */}
        {!isResting && (
          <View style={styles.actionContainer}>
  {/* Weight Adjustment */}
  {showAdjustWeight && (
    <Card style={styles.adjustCard}>
      <Text style={styles.adjustTitle}>Adjust Weight</Text>
      <View style={styles.adjustControls}>
        <TouchableOpacity onPress={() => adjustWeight(-5)} style={styles.adjustButton}>
          <Ionicons name="remove" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.adjustValue}>{currentWeight} lbs</Text>
        <TouchableOpacity onPress={() => adjustWeight(5)} style={styles.adjustButton}>
          <Ionicons name="add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => setShowAdjustWeight(false)}>
        <Text style={styles.doneText}>Done</Text>
      </TouchableOpacity>
    </Card>
  )}

  {/* Reps Adjustment */}
  {showAdjustReps && (
    <Card style={styles.adjustCard}>
      <Text style={styles.adjustTitle}>Adjust Reps</Text>
      <View style={styles.adjustControls}>
        <TouchableOpacity onPress={() => adjustReps(-1)} style={styles.adjustButton}>
          <Ionicons name="remove" size={20} color={colors.success} />
        </TouchableOpacity>
        <Text style={styles.adjustValue}>{currentReps} reps</Text>
        <TouchableOpacity onPress={() => adjustReps(1)} style={styles.adjustButton}>
          <Ionicons name="add" size={20} color={colors.success} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => setShowAdjustReps(false)}>
        <Text style={styles.doneText}>Done</Text>
      </TouchableOpacity>
    </Card>
  )}

  {/* Adjust Buttons */}
  <View style={styles.adjustButtonsRow}>
    <TouchableOpacity
      onPress={() => setShowAdjustWeight(!showAdjustWeight)}
      style={[styles.adjustToggle, showAdjustWeight && styles.adjustToggleActive]}
    >
      <Text
        style={[
          styles.adjustToggleText,
          showAdjustWeight && styles.adjustToggleTextActive,
        ]}
      >
        Adjust Weight
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => setShowAdjustReps(!showAdjustReps)}
      style={[styles.adjustToggle, showAdjustReps && styles.adjustToggleActive]}
    >
      <Text
        style={[
          styles.adjustToggleText,
          showAdjustReps && styles.adjustToggleTextActive,
        ]}
      >
        Adjust Reps
      </Text>
    </TouchableOpacity>
  </View>

  {/* Now at the bottom: Complete Set */}
  <GradientButton
    title="Complete Set"
    onPress={completeSet}
    gradientColors={colors.gradientSuccess}
    style={styles.completeButton}
  />
</View>
        )}

        {/* Next Exercise Preview */}
        {currentExercise < workoutExercises.length - 1 && (
          <Card style={styles.nextExerciseCard}>
            <Text style={styles.nextLabel}>Up Next:</Text>
            <Text style={styles.nextExercise}>
              {workoutExercises[currentExercise + 1].name}
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Intensity Rating Modal */}
      <Modal
        visible={showIntensityModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How did that feel?</Text>
            <Text style={styles.modalSubtitle}>
              Rate the intensity of {currentExerciseData?.name}
            </Text>
            <View style={styles.intensityButtons}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  onPress={() => submitIntensityRating(rating)}
                  style={styles.intensityButton}
                >
                  <Text style={styles.intensityButtonText}>{rating}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.intensityHelp}>
              1 = Too easy • 3 = Just right • 5 = Too hard
            </Text>
          </View>
        </View>
      </Modal>

      {/* Progression Suggestion Modal */}
      <Modal
        visible={showProgressionModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {progressionSuggestion?.type === 'progression' ? '💪 Ready to Level Up!' : '🎯 Smart Adjustment'}
            </Text>
            <Text style={styles.modalMessage}>
              {progressionSuggestion?.message}
            </Text>
            <View style={styles.progressionButtons}>
              <TouchableOpacity 
                onPress={() => setShowProgressionModal(false)}
                style={styles.progressionButton}
              >
                <Text style={styles.progressionButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setShowProgressionModal(false)}
                style={[styles.progressionButton, styles.progressionButtonSecondary]}
              >
                <Text style={[styles.progressionButtonText, styles.progressionButtonTextSecondary]}>
                  Keep Current
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: spacing.lg,
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
    fontSize: 20,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  progressContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  exerciseCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  exerciseName: {
    ...typography.h2,
    fontWeight: '600',
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  exerciseTarget: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  exerciseInfoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  setInfo: {
    alignItems: 'center',
  },
  setNumber: {
    ...typography.h1,
    color: colors.primary,
    fontSize: 20,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  setDetails: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 20,
  },
  timerCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.warning + '15',
    borderColor: colors.warning,
    borderWidth: 1,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  timerTitle: {
    ...typography.label,
    color: colors.warning,
    marginLeft: spacing.sm,
  },
  timerDisplay: {
    ...typography.h1,
    fontSize: 30,
    textAlign: 'center',
    color: colors.warning,
    marginBottom: spacing.lg,
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  timerButton: {
    padding: spacing.md,
    backgroundColor: colors.warning + '20',
    borderRadius: spacing.md,
    marginHorizontal: spacing.sm,
  },
  skipText: {
    ...typography.bodyMedium,
    color: colors.warning,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  actionContainer: {
    paddingHorizontal: spacing.xl,
  },
  completeButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  adjustCard: {
    padding: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    marginBottom: spacing.md,
  },
  adjustTitle: {
    ...typography.label,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  adjustControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  adjustButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustValue: {
    ...typography.h2,
    color: colors.textPrimary,
    minWidth: 80,
    textAlign: 'center',
  },
  doneText: {
    ...typography.bodyMedium,
    color: colors.primary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  adjustButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  adjustToggle: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    marginHorizontal: spacing.xs,
  },
  adjustToggleActive: {
    backgroundColor: colors.primary,
  },
  adjustToggleText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  adjustToggleTextActive: {
    color: '#FFFFFF',
  },
  nextExerciseCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  nextLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  nextExercise: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: spacing.lg,
    padding: spacing.xl,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  modalMessage: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  intensityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.lg,
  },
  intensityButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityButtonText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
  },
  intensityHelp: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  progressionButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  progressionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: spacing.md,
    marginHorizontal: spacing.xs,
  },
  progressionButtonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.textTertiary,
  },
  progressionButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  progressionButtonTextSecondary: {
    color: colors.textPrimary,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  completionEmoji: {
    fontSize: 64,
    marginBottom: spacing.xl,
  },
  completionTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  completionSubtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  summaryCard: {
    width: '100%',
    padding: spacing.xl,
    backgroundColor: colors.success + '15',
    borderColor: colors.success,
    borderWidth: 1,
    marginBottom: spacing.xxl,
  },
  summaryTitle: {
    ...typography.label,
    color: colors.success,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  summaryItem: {
    ...typography.bodyMedium,
    color: colors.success,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  logButton: {
    width: '100%',
  },
});

export default WorkoutDisplayScreen;