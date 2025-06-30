// src/screens/workout/ExerciseLoggingScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import GradientButton from '../../components/common/GradientButton';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';
import { useWorkout } from '../../context/WorkoutContext';
import { useApp } from '../../context/AppContext';

const ExerciseLoggingScreen = ({ navigation, route }) => {
  const { exerciseIndex } = route.params;
  const { 
    workoutExercises, 
    currentWorkout, 
    addSet, 
    completeWorkout 
  } = useWorkout();
  const { saveWorkout, updatePersonalRecord } = useApp();
  
  const [currentExercise] = useState(workoutExercises[exerciseIndex]);
  const [completedSets, setCompletedSets] = useState([]);
  const [currentSet, setCurrentSet] = useState({
    weight: '',
    reps: '',
  });
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  
  const weightInputRef = useRef(null);
  const repsInputRef = useRef(null);
  const timerInterval = useRef(null);

  useEffect(() => {
    // Load previous workout data if available
    loadPreviousWorkoutData();
    
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isResting && restTimer > 0) {
      timerInterval.current = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            Alert.alert('Rest Complete', 'Time for your next set!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isResting, restTimer]);

  const loadPreviousWorkoutData = () => {
    // In a real app, load previous workout data for this exercise
    // For now, we'll just suggest some default values
    if (currentExercise) {
      setCurrentSet({
        weight: '45', // Default starting weight
        reps: currentExercise.reps.toString(),
      });
    }
  };

  const handleAddSet = () => {
    const weight = parseFloat(currentSet.weight);
    const reps = parseInt(currentSet.reps);

    if (!weight || weight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight.');
      return;
    }

    if (!reps || reps <= 0) {
      Alert.alert('Invalid Reps', 'Please enter a valid number of reps.');
      return;
    }

    const newSet = { weight, reps };
    const updatedSets = [...completedSets, newSet];
    setCompletedSets(updatedSets);
    
    // Add set to workout context
    addSet(currentExercise.id, newSet);

    // Check for personal record
    checkPersonalRecord(weight, reps);

    // Start rest timer if not the last set
    if (updatedSets.length < currentExercise.sets) {
      startRestTimer();
    }

    // Clear inputs for next set
    setCurrentSet({
      weight: currentSet.weight, // Keep weight same
      reps: currentSet.reps,
    });
  };

  const checkPersonalRecord = async (weight, reps) => {
    const totalVolume = weight * reps;
    const isNewPR = await updatePersonalRecord(currentExercise.id, { weight, reps, totalVolume });
    
    if (isNewPR) {
      Alert.alert('🎉 New Personal Record!', `${weight} lbs × ${reps} reps`);
    }
  };

  const startRestTimer = () => {
    setRestTimer(currentExercise.restSeconds);
    setIsResting(true);
  };

  const skipRest = () => {
    setRestTimer(0);
    setIsResting(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextExercise = () => {
    if (completedSets.length < currentExercise.sets) {
      Alert.alert(
        'Incomplete Sets',
        `You've only completed ${completedSets.length} of ${currentExercise.sets} sets. Continue to next exercise?`,
        [
          { text: 'Stay Here', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => navigateNext()
          },
        ]
      );
    } else {
      navigateNext();
    }
  };

  const navigateNext = () => {
    if (exerciseIndex < workoutExercises.length - 1) {
      // Go to next exercise
      navigation.push('ExerciseLogging', {
        exerciseIndex: exerciseIndex + 1,
      });
    } else {
      // Workout complete
      handleCompleteWorkout();
    }
  };

  const handleCompleteWorkout = async () => {
    Alert.alert(
      'Workout Complete! 💪',
      'Great job! Your workout has been saved.',
      [
        {
          text: 'View Summary',
          onPress: async () => {
            const completedWorkout = completeWorkout();
            if (completedWorkout) {
              await saveWorkout(completedWorkout);
              navigation.reset({
                index: 0,
                routes: [
                  { name: 'WorkoutsList' },
                  { 
                    name: 'Progress',
                    params: { showWorkoutSummary: true }
                  }
                ],
              });
            }
          },
        },
      ]
    );
  };

  const SetRow = ({ set, index }) => (
    <View style={styles.setRow}>
      <Text style={styles.setNumber}>Set {index + 1}</Text>
      <Text style={styles.setValue}>{set.weight} lbs</Text>
      <Text style={styles.setValue}>{set.reps} reps</Text>
      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
    </View>
  );

  if (!currentExercise) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Exercise not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            
            <View style={styles.headerText}>
              <Text style={styles.exerciseNumber}>
                Exercise {exerciseIndex + 1} of {workoutExercises.length}
              </Text>
              <Text style={styles.exerciseName}>{currentExercise.name}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((exerciseIndex + 1) / workoutExercises.length) * 100}%` }
                ]} 
              />
            </View>
          </View>

          {/* Rest Timer */}
          {isResting && (
            <LinearGradient
              colors={[colors.info, colors.secondary]}
              style={styles.restTimerCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.restTitle}>Rest Time</Text>
              <Text style={styles.restTime}>{formatTime(restTimer)}</Text>
              <TouchableOpacity style={styles.skipButton} onPress={skipRest}>
                <Text style={styles.skipButtonText}>Skip Rest</Text>
              </TouchableOpacity>
            </LinearGradient>
          )}

          {/* Current Set Input */}
          <Card style={styles.inputCard}>
            <Text style={styles.inputTitle}>
              Set {completedSets.length + 1} of {currentExercise.sets}
            </Text>
            
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight (lbs)</Text>
                <TextInput
                  ref={weightInputRef}
                  style={styles.input}
                  value={currentSet.weight}
                  onChangeText={(text) => setCurrentSet({ ...currentSet, weight: text })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  selectTextOnFocus
                />
              </View>
              
              <Text style={styles.multiplier}>×</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reps</Text>
                <TextInput
                  ref={repsInputRef}
                  style={styles.input}
                  value={currentSet.reps}
                  onChangeText={(text) => setCurrentSet({ ...currentSet, reps: text })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  selectTextOnFocus
                />
              </View>
            </View>

            <GradientButton
              title="Log Set"
              onPress={handleAddSet}
              disabled={!currentSet.weight || !currentSet.reps || isResting}
              style={styles.logButton}
            />
          </Card>

          {/* Completed Sets */}
          {completedSets.length > 0 && (
            <View style={styles.completedSection}>
              <Text style={styles.completedTitle}>Completed Sets</Text>
              <Card style={styles.completedCard}>
                {completedSets.map((set, index) => (
                  <SetRow key={index} set={set} index={index} />
                ))}
              </Card>
            </View>
          )}

          {/* Exercise Info */}
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={styles.infoText}>
                Target: {currentExercise.sets} sets × {currentExercise.reps} reps
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="timer-outline" size={20} color={colors.info} />
              <Text style={styles.infoText}>
                Rest {currentExercise.restSeconds}s between sets
              </Text>
            </View>
          </Card>

          {/* Navigation Buttons */}
          <View style={styles.navigationButtons}>
            {completedSets.length >= currentExercise.sets && (
              <GradientButton
                title={
                  exerciseIndex < workoutExercises.length - 1
                    ? 'Next Exercise'
                    : 'Complete Workout'
                }
                onPress={handleNextExercise}
                gradientColors={
                  exerciseIndex < workoutExercises.length - 1
                    ? colors.gradientPrimary
                    : colors.gradientAccent
                }
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
  exerciseNumber: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  exerciseName: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  progressContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  restTimerCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
  },
  restTitle: {
    ...typography.bodyLarge,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  restTime: {
    ...typography.displayLarge,
    color: '#FFFFFF',
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  skipButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  skipButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  inputTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  inputGroup: {
    alignItems: 'center',
  },
  inputLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    width: 100,
    height: 60,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    textAlign: 'center',
    ...typography.h1,
    color: colors.textPrimary,
  },
  multiplier: {
    ...typography.h2,
    color: colors.textSecondary,
    marginHorizontal: spacing.xl,
  },
  logButton: {
    marginTop: spacing.md,
  },
  completedSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  completedTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  completedCard: {
    paddingVertical: spacing.md,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  setNumber: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    flex: 1,
  },
  setValue: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '500',
    marginHorizontal: spacing.lg,
  },
  infoCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.surfaceSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  navigationButtons: {
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    ...typography.bodyLarge,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
});

export default ExerciseLoggingScreen;