import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert
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

const muscleGroups = [
  {
    id: 'chest',
    name: 'Chest',
    icon: '🎯',
    description: 'Pectorals, front delts',
    color: colors.primary,
    target: 'chest',
  },
  {
    id: 'back',
    name: 'Back',
    icon: '🔙',
    description: 'Lats, rhomboids, traps',
    color: colors.secondary,
    target: 'back',
  },
  {
    id: 'shoulders',
    name: 'Shoulders',
    icon: '💪🏽',
    description: 'Deltoids, rotator cuff',
    color: colors.accent,
    target: 'shoulders',
  },
  {
    id: 'arms',
    name: 'Arms',
    icon: '💪',
    description: 'Biceps, triceps',
    color: colors.info,
    target: 'upper arms, lower arms',
  },
  {
    id: 'legs',
    name: 'Legs',
    icon: '🦵',
    description: 'Quads, hamstrings, glutes',
    color: colors.premium,
    target: 'upper legs, lower legs',
  },
  {
    id: 'core',
    name: 'Core',
    icon: '🎯',
    description: 'Abs, obliques',
    color: colors.warning,
    target: 'waist',
  },
  {
    id: 'full_body',
    name: 'Full Body',
    icon: '🏃',
    description: 'Multiple muscle groups',
    color: colors.success,
    target: 'chest, back, shoulders, upper arms, lower arms, upper legs, lower legs, waist',
  },
  {
    id: 'cardio',
    name: 'Cardio',
    icon: '❤️',
    description: 'Heart rate training',
    color: colors.error,
    target: 'cardio',
  },
];

const MuscleGroupSelectionScreen = ({ navigation, route }) => {
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const { startNewWorkout } = useWorkout();
  const { userProfile } = useApp();
  const { selectedEquipment, preselectedMuscleGroup } = route.params;

  useEffect(() => {

    // If coming from quick start, pre-select the muscle group
    if (preselectedMuscleGroup) {
      setSelectedMuscleGroup(preselectedMuscleGroup);
    }
  }, [preselectedMuscleGroup]);

  const handleGenerateWorkout = () => {
    if (!selectedMuscleGroup) {
      Alert.alert('Selection Required', 'Please select a muscle group to target.');
      return;
    }

    // Generate workout based on selections
    navigation.navigate('WorkoutGenerator', {
      selectedEquipment,
      selectedMuscleGroup,
      fitnessLevel: userProfile.fitnessLevel || 'intermediate',
      goal: userProfile.goal || 'general',
    });
  };

  const MuscleGroupCard = ({ group }) => {
    const isSelected = selectedMuscleGroup === group.id;

    return (
      <TouchableOpacity
        style={styles.muscleCard}
        onPress={() => setSelectedMuscleGroup(group.id)}
        activeOpacity={0.7}
      >
        <Card style={[styles.card, isSelected && styles.cardSelected]}>
          {isSelected && (
            <LinearGradient
              colors={[group.color, `${group.color}50`]}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: `${group.color}20` }]}>
              <Text style={styles.muscleIcon}>{group.icon}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.muscleName}>{group.name}</Text>
              <Text style={styles.muscleDescription}>{group.description}</Text>
            </View>
            {isSelected && <Ionicons name="checkmark-circle" size={24} color={group.color} />}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>Target Muscle Group</Text>
            <Text style={styles.subtitle}>What do you want to train today?</Text>
          </View>
        </View>

        {/* Selected Equipment Summary */}
        <View style={styles.equipmentSummary}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.equipmentText}>
            {selectedEquipment.length} equipment type{selectedEquipment.length > 1 ? 's' : ''} selected
          </Text>
        </View>

        {/* Muscle Group List */}
        <View style={styles.muscleGroupList}>
          {muscleGroups.map((group) => (
            <MuscleGroupCard key={group.id} group={group} />
          ))}
        </View>

        {/* Generate Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title="Generate Workout"
            onPress={handleGenerateWorkout}
            disabled={!selectedMuscleGroup}
            gradientColors={selectedMuscleGroup ? [colors.primary, colors.secondary] : [colors.surface, colors.surface]}
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  equipmentSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  equipmentText: {
    ...typography.bodySmall,
    color: colors.success,
    marginLeft: spacing.xs,
  },
  muscleGroupList: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  muscleCard: {
    marginBottom: spacing.md,
  },
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: colors.primary,
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  muscleIcon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  muscleName: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  muscleDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  infoSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  infoCard: {
    backgroundColor: colors.surfaceSecondary,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoTitle: {
    ...typography.label,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  infoText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  infoList: {
    marginTop: spacing.xs,
  },
  infoItem: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
  },
});

export default MuscleGroupSelectionScreen;
