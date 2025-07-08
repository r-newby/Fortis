// src/screens/main/WorkoutsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import GradientButton from '../../components/common/GradientButton';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';
import { useApp } from '../../context/AppContext';
import { generateWorkout } from '../../utils/generateWorkout';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WorkoutsScreen = ({ navigation }) => {
  const { userProfile, workouts } = useApp();
useEffect(() => {
    const debugStorage = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        console.log('AsyncStorage keys:', keys);

        const userKey = `workouts_${userProfile?.id}`;
        const data = await AsyncStorage.getItem(userKey);
        console.log(`Workouts for ${userKey}:`, JSON.parse(data));
      } catch (error) {
        console.error('Error reading AsyncStorage:', error);
      }
    };

    debugStorage();
  }, [userProfile]);
  const startCustomWorkout = () => {
  navigation.navigate('ExerciseLogging');
};

  const startGenerateWorkout = () => {
  navigation.navigate('EquipmentSelection');
};


  const quickStartOptions = [
    {
      id: 'chest',
      title: 'Chest Day',
      icon: 'fitness',
      color: colors.primary,
      muscleGroup: 'chest',
    },
    {
      id: 'back',
      title: 'Back Day',
      icon: 'body',
      color: colors.secondary,
      muscleGroup: 'back',
    },
    {
      id: 'legs',
      title: 'Leg Day',
      icon: 'walk',
      color: colors.accent,
      muscleGroup: 'legs',
    },
    {
      id: 'full',
      title: 'Full Body',
      icon: 'body',  
      color: colors.info,
      muscleGroup: 'full_body',
    },
  ];

  const handleQuickStart = (muscleGroup) => {
    // Navigate directly to equipment selection with pre-selected muscle group
    navigation.navigate('EquipmentSelection', { preselectedMuscleGroup: muscleGroup });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Workouts</Text>
          <Text style={styles.subtitle}>Choose your training focus</Text>
        </View>

        {/* Start Workout Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
  title="Start Custom Workout"
  onPress={startCustomWorkout}
/>
</View>

 {/* Generatee Workout Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
  title="Generate Workout"
  onPress={startGenerateWorkout}
/>

      </View>

        {/* Quick Start Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <View style={styles.quickStartGrid}>
            {quickStartOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.quickStartItem}
                onPress={() => handleQuickStart(option.muscleGroup)}
                activeOpacity={0.8}
              >
                <Card style={styles.quickStartCard}>
                  <View
                    style={[
                      styles.quickStartIcon,
                      { backgroundColor: `${option.color}20` },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={28}
                      color={option.color}
                    />
                  </View>
                  <Text style={styles.quickStartTitle}>{option.title}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          {workouts.length > 0 ? (
            workouts.slice(0, 3).map((workout, index) => (
              <Card key={workout.id} style={styles.recentWorkoutCard}>
                <View style={styles.workoutHeader}>
                  <View>
                   <Text style={styles.workoutTitle}>
  {workout.muscle_group
    ? workout.muscle_group.charAt(0).toUpperCase() +
      workout.muscle_group.slice(1).replace('_', ' ') + ' Workout'
    : 'Unnamed Workout'}
</Text>


                    <Text style={styles.workoutDate}>
                      {new Date(workout.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.workoutStats}>
                    <Text style={styles.workoutStatValue}>{workout.totalVolume}</Text>
                    <Text style={styles.workoutStatLabel}>lbs</Text>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No workouts yet</Text>
              <Text style={styles.emptySubtext}>
                Start your first workout to see your history here
              </Text>
            </Card>
          )}
        </View>

        {/* Suggested Workout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auto-Generated Workouts</Text>
          <Card style={styles.suggestedCard}>
            <View style={styles.suggestedContent}>
              <View style={styles.suggestedIcon}>
                <Ionicons name="trending-up" size={32} color={colors.primary} />
              </View>
              <View style={styles.suggestedTextContainer}>
                <Text style={styles.suggestedTitle}>Progressive Overload</Text>
                <Text style={styles.suggestedText}>
                  Based on your {userProfile?.goal || 'strength'} goal
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.suggestedButton}
              onPress={startCustomWorkout}
            >
              <Text style={styles.suggestedButtonText}>Try Now</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </Card>
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
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  section: {
    marginBottom: spacing.xxxl,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  quickStartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  quickStartItem: {
    width: '47%',
  },
  quickStartCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  quickStartIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  quickStartTitle: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  recentWorkoutCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  workoutDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  workoutStats: {
    alignItems: 'center',
  },
  workoutStatValue: {
    ...typography.h2,
    color: colors.primary,
  },
  workoutStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyCard: {
    marginHorizontal: spacing.xl,
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  suggestedCard: {
    marginHorizontal: spacing.xl,
  },
  suggestedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  suggestedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  suggestedTextContainer: {
    flex: 1,
  },
  suggestedTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  suggestedText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  suggestedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  suggestedButtonText: {
    ...typography.button,
    color: colors.primary,
  },
});

export default WorkoutsScreen;