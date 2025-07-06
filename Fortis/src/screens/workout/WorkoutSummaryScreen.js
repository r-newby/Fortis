// src/screens/workout/WorkoutSummaryScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { supabase } from '../../supabase';
import GradientButton from '../../components/common/GradientButton';
import Card from '../../components/common/Card';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';

const WorkoutSummaryScreen = ({ navigation, route }) => {
  const { workoutId } = route.params || {};
  const [workout, setWorkout] = useState(null);

  useEffect(() => {
    if (!workoutId) return;

    const fetchWorkout = async () => {
      console.log('Fetching workout with ID:', workoutId);
      const { data, error } = await supabase
        .from('workouts')
        .select('*, workout_exercises(*, exercises(*))')
        .eq('id', workoutId)
        .single();

      if (error) {
        console.error('Error fetching workout:', error);
        Alert.alert('Error', 'Could not load workout summary.');
        return;
      }

      setWorkout(data);
    };

    fetchWorkout();
  }, [workoutId]);

  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No completed workout found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  
const workoutExercises = workout.workout_exercises || [];

const totalVolume = workoutExercises.reduce(
  (total, ex) => total + (ex.reps || 0) * (ex.weight || 0),
  0
);

const totalReps = workoutExercises.reduce(
  (total, ex) => total + (ex.reps || 0),
  0
);

const totalSets = workoutExercises.length;
const totalDuration = 0;


console.log('Fetched workout_exercises:', workout.workout_exercises);




  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Workout Summary</Text>
          <Text style={styles.subtitle}>Great job finishing your workout!</Text>
        </View>

        <LinearGradient
          colors={colors.gradientPrimary}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalSets}</Text>
              <Text style={styles.summaryLabel}>Sets</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalReps}</Text>
              <Text style={styles.summaryLabel}>Reps</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>~{totalDuration}</Text>
              <Text style={styles.summaryLabel}>Minutes</Text>
            </View>
          </View>
        </LinearGradient>

        <Card style={styles.detailCard}>
          <Text style={styles.detailLabel}>Total Volume</Text>
          <Text style={styles.detailValue}>{totalVolume} lbs</Text>
        </Card>

        <View style={styles.buttonContainer}>
          <GradientButton
            title="Back to Dashboard"
            onPress={() =>
              navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
            }
            gradientColors={colors.gradientPrimary}
          />
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    marginBottom: spacing.xl,
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
  detailCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
    padding: spacing.xl,
    backgroundColor: colors.surfaceSecondary,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.md,
  },
  detailValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
});

export default WorkoutSummaryScreen;
