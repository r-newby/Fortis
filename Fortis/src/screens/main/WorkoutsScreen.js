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
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../components/common/Card';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';
import { useApp } from '../../context/AppContext';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const WorkoutsScreen = ({ navigation }) => {
  const { userProfile, workouts, reloadData} = useApp();
  
  
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
    navigation.navigate('EquipmentSelection', { 
      preselectedMuscleGroup: muscleGroup,
      skipMuscleSelection: true 
    });
  };

  // Suggestion logic - recommend muscle group based on profile and recent training
  const getSuggestedWorkout = () => {
    const { fitnessLevel, goal } = userProfile || {};
    
    const muscleGroups = [
      { name: 'chest', display: 'Chest', icon: '💪', color: colors.primary },
      { name: 'back', display: 'Back', icon: '🔙', color: colors.secondary },
      { name: 'legs', display: 'Legs', icon: '🦵', color: colors.accent },
      { name: 'shoulders', display: 'Shoulders', icon: '🤝', color: colors.warning },
      { name: 'arms', display: 'Arms', icon: '💪', color: colors.info },
      { name: 'core', display: 'Core', icon: '🎯', color: colors.warning },
      { name: 'full_body', display: 'Full Body', icon: '🏋️', color: colors.info },
      { name: 'cardio', display: 'Cardio', icon: '❤️', color: colors.error },
    ];

    // For users with no workout history, suggest full body to get started
    if (workouts.length === 0) {
      return muscleGroups.find(m => m.name === 'full_body');
    }

    // Goal-based prioritization
    let prioritizedGroups = muscleGroups;
    if (goal === 'strength') {
      // Strength goals: focus on major compound movements
      prioritizedGroups = muscleGroups.filter(m => 
        ['legs', 'back', 'chest', 'shoulders'].includes(m.name)
      );
    } else if (goal === 'muscle') {
      // Muscle building: balanced approach with all muscle groups
      prioritizedGroups = muscleGroups.filter(m => 
        ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'].includes(m.name)
      );
    } else if (goal === 'endurance') {
      // Endurance goals: favor full body and cardio
      prioritizedGroups = muscleGroups.filter(m => 
        ['full_body', 'legs', 'cardio', 'core'].includes(m.name)
      );
    }
    // For users without a goal set, use all muscle groups

    // Beginners get slightly more full body suggestions within their goal
    if (fitnessLevel === 'beginner' && workouts.length < 10) {
      // Add full body to prioritized groups if it's not already there
      const hasFullBody = prioritizedGroups.some(m => m.name === 'full_body');
      if (!hasFullBody) {
        prioritizedGroups.push(muscleGroups.find(m => m.name === 'full_body'));
      }
    }

    const now = new Date();
    
    // Calculate days since last workout for prioritized muscle groups
    const muscleGroupData = prioritizedGroups.map(muscle => {
      const lastWorkout = workouts
        .filter(w => w.muscle_group === muscle.name)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      
      const daysSince = lastWorkout 
        ? Math.floor((now - new Date(lastWorkout.date)) / (1000 * 60 * 60 * 24))
        : 999; // Never trained
      
      return { ...muscle, daysSince, lastWorkout };
    });
    
    // Return muscle group with most days since last workout
    return muscleGroupData.sort((a, b) => b.daysSince - a.daysSince)[0];
  };

  // Suggested workout component
  const SuggestedWorkout = () => {
    const suggestion = getSuggestedWorkout();
    
    if (!suggestion) return null;

    const getDaysMessage = () => {
      if (suggestion.daysSince === 999) return 'Never trained';
      if (suggestion.daysSince === 0) return 'Last done today';
      if (suggestion.daysSince === 1) return 'Last done yesterday';
      return `Last done ${suggestion.daysSince} days ago`;
    };

    return (
      <Card style={styles.suggestedCard}>
        <TouchableOpacity
          style={styles.suggestedContent}
          onPress={() => handleQuickStart(suggestion.name)}
          activeOpacity={0.7}
        >
          <View style={styles.suggestedIconContainer}>
            <Text style={styles.suggestedEmoji}>{suggestion.icon}</Text>
          </View>
          <View style={styles.suggestedText}>
            <Text style={styles.suggestedMuscle}>{suggestion.display} Day</Text>
            <Text style={styles.suggestedTime}>{getDaysMessage()}</Text>
        
          </View>
          <View style={styles.suggestedStats}>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Workouts</Text>
          <Text style={styles.subtitle}>Choose your training focus</Text>
        </View>

        <View style={styles.mainButtons}>
          <TouchableOpacity
            style={styles.smartPlanButton}
            onPress={startGenerateWorkout}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.smartPlanGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.smartPlanContent}>
                <View style={styles.smartPlanIconContainer}>
                  <Ionicons name="sparkles" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.smartPlanText}>
                  <Text style={styles.smartPlanTitle}>Your Smart Plan</Text>
                  <Text style={styles.smartPlanSubtitle}>Tailored to your goals</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buildWorkoutButton}
            onPress={startCustomWorkout}
            activeOpacity={0.8}
          >
            <View style={styles.buildWorkoutContent}>
              <View style={styles.buildWorkoutIconContainer}>
                <Ionicons name="construct" size={24} color={colors.primary} />
              </View>
              <View style={styles.buildWorkoutText}>
                <Text style={styles.buildWorkoutTitle}>Build Your Workout</Text>
                <Text style={styles.buildWorkoutSubtitle}>Create from scratch</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.quickStartSection}>
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
                      { backgroundColor: option.color + '20' },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={40}
                      color={option.color}
                    />
                  </View>
                  <Text style={styles.quickStartTitle}>{option.title}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Suggested Workout Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested Next Workout</Text>
          <SuggestedWorkout />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          {workouts.length > 0 ? (
            workouts.slice(0, 3).map((workout, index) => {
              console.log("VOLUME: " )
              console.log("Workout Data:" , workout)
              const volume = workout.total_volume || workout.totalVolume || 0;
              const formattedVolume = volume > 0 ?
                (volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : volume.toString()) :
                '0';

              return (
                <Card key={workout.id} style={styles.recentWorkoutCard}>
                  <View style={styles.recentWorkoutContent}>
                    <View style={styles.recentWorkoutIconContainer}>
                      <Ionicons name="fitness" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.recentWorkoutText}>
                      <Text style={styles.workoutTitle}>
                        {workout.muscle_group
                          ? workout.muscle_group.charAt(0).toUpperCase() +
                          workout.muscle_group.slice(1).replace('_', ' ') + ' Workout'
                          : 'Custom Workout'}
                      </Text>
                      <Text style={styles.workoutDate}>
                        {new Date(workout.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.workoutStats}>
                      <Text style={styles.workoutStatValue}>{formattedVolume}</Text>
                      <Text style={styles.workoutStatLabel}>lbs</Text>
                    </View>
                  </View>
                </Card>
              );
            })
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No workouts yet</Text>
              <Text style={styles.emptySubtext}>
                Start your first workout to see your history here
              </Text>
            </Card>
          )}
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
  mainButtons: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  buildWorkoutButton: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  buildWorkoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  buildWorkoutIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  buildWorkoutText: {
    flex: 1,
  },
  buildWorkoutTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  buildWorkoutSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  smartPlanButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  smartPlanGradient: {
    padding: spacing.lg,
  },
  smartPlanContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smartPlanIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  smartPlanText: {
    flex: 1,
  },
  smartPlanTitle: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  smartPlanSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickStartSection: {
    marginBottom: spacing.xs,
  },
  section: {
    marginBottom: spacing.xs,
  },
  sectionTitle: {
     ...typography.h3,
    color: colors.textPrimary,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  quickStartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between'
  },
  quickStartItem: {
    width: '48%',
  },
  quickStartCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.md,
  },
  quickStartIcon: {
    width: 70,
    height: 70,
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
  // Suggested workout styles
  suggestedCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  suggestedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
  },
  suggestedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  suggestedEmoji: {
    fontSize: 24,
  },
  suggestedText: {
    flex: 1,
  },
  suggestedMuscle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  suggestedTime: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  suggestedUrgent: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  suggestedStats: {
    alignItems: 'center',
  },
  // Recent workout styles
  recentWorkoutCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  recentWorkoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
  },
  recentWorkoutIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  recentWorkoutText: {
    flex: 1,
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
});

export default WorkoutsScreen;