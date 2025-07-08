import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import GradientButton from '../../components/common/GradientButton';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';

const fitnessGoals = [
  {
    id: 'strength',
    title: 'Build Strength',
    description: 'Increase your max lifts and overall power',
    icon: '⚡',
    details: 'Focus on heavy weights, low reps',
  },
  {
    id: 'muscle',
    title: 'Build Muscle',
    description: 'Focus on muscle growth and definition',
    icon: '💪',
    details: 'Moderate weights, higher volume',
  },
  {
    id: 'endurance',
    title: 'Improve Endurance',
    description: 'Enhance stamina and workout capacity',
    icon: '🏃',
    details: 'Lighter weights, high reps',
  },
];

const OnboardingGoal = ({ navigation, route }) => {
  const [selectedGoal, setSelectedGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const { username, fitnessLevel } = route.params;

  /* Handle completion of onboarding.
   This function will reset the navigation stack and navigate to the Login screen
   with the onboarding data passed as parameters */

  const handleComplete = () => {
    if (!selectedGoal) return;

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Login',
          params: {
            onboardingData: {
              username,
              fitnessLevel,
              goal: selectedGoal,
            },
          },
        },
      ],
    });

    Alert.alert(
      'Verify Your Email',
      'Please check your inbox and confirm your email before logging in.'
    );
  };

  const GoalCard = ({ goal }) => {
    const isSelected = selectedGoal === goal.id;

    return (
      <TouchableOpacity
        onPress={() => setSelectedGoal(goal.id)}
        activeOpacity={0.8}
        style={styles.cardWrapper}
      >
        <Card style={[styles.card, isSelected && styles.cardSelected]}>
          {isSelected && (
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          )}
          <View style={styles.cardContent}>
            <Text style={styles.cardIcon}>{goal.icon}</Text>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>{goal.title}</Text>
              <Text style={styles.cardDescription}>{goal.description}</Text>
              <Text style={styles.cardDetails}>{goal.details}</Text>
            </View>
            {isSelected && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
            <Text style={styles.progressText}>3 of 3</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>What's Your Goal?</Text>
          <Text style={styles.subtitle}>
            We'll tailor your workouts to help you achieve it
          </Text>

          <View style={styles.cardsContainer}>
            {fitnessGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <GradientButton
            title="Complete Setup"
            onPress={handleComplete}
            disabled={!selectedGoal}
            loading={loading}
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
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -spacing.sm,
  },
  progressContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    marginBottom: spacing.xxxl,
  },
  cardsContainer: {
    marginBottom: spacing.xxxl,
  },
  cardWrapper: {
    marginBottom: spacing.md,
  },
  card: {
    position: 'relative',
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 40,
    marginRight: spacing.lg,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cardDetails: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  checkmark: {
    marginLeft: spacing.md,
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
});

export default OnboardingGoal;
