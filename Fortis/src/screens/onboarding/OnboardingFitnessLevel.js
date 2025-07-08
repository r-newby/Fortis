// src/screens/onboarding/OnboardingFitnessLevel.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import GradientButton from '../../components/common/GradientButton';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';
import { useApp } from '../../context/AppContext';

const fitnessLevels = [
  {
    id: 'beginner',
    title: 'Beginner',
    description: 'New to fitness or returning after a break',
    icon: '🌱',
    details: '0-6 months experience',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'Regular training with good form',
    icon: '💪',
    details: '6 months - 2 years',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Consistent training with advanced techniques',
    icon: '🔥',
    details: '2+ years experience',
  },
];

const OnboardingFitnessLevel = ({ navigation, route }) => {
  const [selectedLevel, setSelectedLevel] = useState('');
  const { username, authUserId } = route.params;

// After selecting a fitness level, navigate to the Goal screen
const handleContinue = () => {
  if (!selectedLevel) return;
  navigation.navigate('Goal', {
    authUserId,
    username,
    fitnessLevel: selectedLevel,
  });
};



  const FitnessLevelCard = ({ level }) => {
    const isSelected = selectedLevel === level.id;
    
    return (
      <TouchableOpacity
        onPress={() => setSelectedLevel(level.id)}
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
            <Text style={styles.cardIcon}>{level.icon}</Text>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>{level.title}</Text>
              <Text style={styles.cardDescription}>{level.description}</Text>
              <Text style={styles.cardDetails}>{level.details}</Text>
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
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '66%' }]} />
            </View>
            <Text style={styles.progressText}>2 of 3</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Your Fitness Level</Text>
          <Text style={styles.subtitle}>
            This helps us customize your workout plans
          </Text>

          {/* Fitness Level Cards */}
          <View style={styles.cardsContainer}>
            {fitnessLevels.map((level) => (
              <FitnessLevelCard key={level.id} level={level} />
            ))}
          </View>
        </View>

        {/* Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title="Continue"
            onPress={handleContinue}
            disabled={!selectedLevel}
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

export default OnboardingFitnessLevel;