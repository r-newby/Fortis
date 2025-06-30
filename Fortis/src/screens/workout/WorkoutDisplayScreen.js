// src/screens/workout/WorkoutDisplayScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import GradientButton from '../../components/common/GradientButton';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';
import { useWorkout } from '../../context/WorkoutContext';

const WorkoutDisplayScreen = ({ navigation }) => {
  const { workoutExercises, selectedMuscleGroup, currentWorkout } = useWorkout();
  const [expandedExercise, setExpandedExercise] = useState(null);

  useEffect(() => {
    // If no workout exercises, go back
    if (!workoutExercises || workoutExercises.length === 0) {
      Alert.alert(
        'No Workout Generated',
        'Please select equipment and muscle group first.',
        [{ text: 'OK', onPress: () => navigation.navigate('WorkoutsList') }]
      );
    }
  }, [workoutExercises]);

  const handleStartWorkout = () => {
    if (workoutExercises.length > 0) {
      navigation.navigate('ExerciseLogging', {
        exerciseIndex: 0,
      });
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
              {/* Exercise Image Placeholder */}
              <View style={styles.exerciseImage}>
                <Ionicons name="image" size={48} color={colors.textTertiary} />
              </View>

              {/* Instructions */}
              <Text style={styles.instructionsTitle}>Instructions</Text>
              <Text style={styles.instructionsText}>{exercise.instructions}</Text>

              {/* Target Muscles */}
              <Text style={styles.musclesTitle}>Target Muscles</Text>
              <View style={styles.musclesList}>
                {exercise.primaryMuscles.map((muscle, idx) => (
                  <View key={idx} style={[styles.muscleTag, styles.primaryMuscle]}>
                    <Text style={styles.muscleTagText}>
                      {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                    </Text>
                  </View>
                ))}
                {exercise.secondaryMuscles.map((muscle, idx) => (
                  <View key={idx} style={[styles.muscleTag, styles.secondaryMuscle]}>
                    <Text style={styles.muscleTagText}>
                      {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Rest Time */}
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
    const avgSetTime = 45; // seconds per set
    const totalRestTime = workoutExercises.reduce(
      (sum, ex) => sum + (ex.sets - 1) * ex.restSeconds,
      0
    );
    const totalSeconds = totalSets * avgSetTime + totalRestTime;
    return Math.ceil(totalSeconds / 60);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
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
              {selectedMuscleGroup.charAt(0).toUpperCase() + 
               selectedMuscleGroup.slice(1).replace('_', ' ')} Focus
            </Text>
          </View>
        </View>

        {/* Workout Summary */}
        <LinearGradient
          colors={colors.gradientPrimary}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{workoutExercises.length}</Text>
              <Text style={styles.summaryLabel}>Exercises</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {workoutExercises.reduce((sum, ex) => sum + ex.sets, 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Sets</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>~{getTotalWorkoutTime()}</Text>
              <Text style={styles.summaryLabel}>Minutes</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Instructions */}
        <Card style={styles.instructionCard}>
          <View style={styles.instructionHeader}>
            <Ionicons name="information-circle" size={20} color={colors.info} />
            <Text style={styles.instructionTitle}>How to proceed</Text>
          </View>
          <Text style={styles.instructionText}>
            Tap on any exercise to see detailed instructions. When ready, 
            press "Start Workout" to begin logging your sets.
          </Text>
        </Card>

        {/* Exercise List */}
        <View style={styles.exerciseList}>
          <Text style={styles.listTitle}>Exercises</Text>
          {workoutExercises.map((exercise, index) => (
            <ExerciseCard key={exercise.id} exercise={exercise} index={index} />
          ))}
        </View>

        {/* Start Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title="Start Workout"
            onPress={handleStartWorkout}
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
  summaryCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    borderRadius: 16,
    padding: spacing.xl,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    ...typography.h1,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    ...typography.caption,
    color: '#FFFFFF',
    opacity: 0.9,
    textTransform: 'uppercase',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
  },
  instructionCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
    backgroundColor: colors.surfaceSecondary,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  instructionTitle: {
    ...typography.label,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  instructionText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  exerciseList: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  listTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  exerciseCard: {
    marginBottom: spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  exerciseNumberText: {
    ...typography.bodyLarge,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  exerciseTags: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  tagText: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  exerciseDetails: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exerciseImage: {
    height: 150,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  instructionsTitle: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  instructionsText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  musclesTitle: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  musclesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  muscleTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  primaryMuscle: {
    backgroundColor: `${colors.primary}20`,
  },
  secondaryMuscle: {
    backgroundColor: `${colors.secondary}20`,
  },
  muscleTagText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  restInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.info}10`,
    padding: spacing.md,
    borderRadius: 8,
  },
  restText: {
    ...typography.bodyMedium,
    color: colors.info,
    marginLeft: spacing.sm,
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
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