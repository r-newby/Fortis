// src/components/workout/ExerciseCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../common/Card';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';

const ExerciseCard = ({
  exercise,
  index,
  isExpanded,
  onPress,
  showDetails = true
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.container}>
        <View style={styles.header}>
          <View style={styles.numberContainer}>
            <Text style={styles.number}>{index + 1}</Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.name}>{exercise.name}</Text>
            <View style={styles.tags}>
              <View style={styles.tag}>
                <Ionicons name="barbell" size={12} color={colors.textSecondary} />
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

          {showDetails && (
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.textSecondary}
            />
          )}
        </View>

        {isExpanded && showDetails && (
          <View style={styles.details}>
            <View style={styles.imageContainer}>
              {exercise.image ? (
                <Image source={{ uri: exercise.image }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image" size={48} color={colors.textTertiary} />
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              <Text style={styles.instructions}>{exercise.instructions}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Target Muscles</Text>
              <View style={styles.muscles}>
                {exercise.primaryMuscles.map((muscle, idx) => (
                  <View key={idx} style={[styles.muscle, styles.primaryMuscle]}>
                    <Text style={styles.muscleText}>{muscle}</Text>
                  </View>
                ))}
                {exercise.secondaryMuscles.map((muscle, idx) => (
                  <View key={idx} style={[styles.muscle, styles.secondaryMuscle]}>
                    <Text style={styles.muscleText}>{muscle}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  number: {
    ...typography.bodyLarge,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    gap: spacing.xs,
  },
  tagText: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  details: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  imageContainer: {
    marginBottom: spacing.lg,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textPrimary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  instructions: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  muscles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  muscle: {
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
  muscleText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});

export default ExerciseCard;