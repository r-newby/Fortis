import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../supabase';
import GradientButton from '../../components/common/GradientButton';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';
import Card from '../../components/common/Card';
import { generateWorkout } from '../../utils/generateWorkout';

const toTitleCase = (str) => {
  const lowerWords = ['of', 'on', 'in', 'at', 'to', 'for', 'with', 'a', 'an', 'the', 'and', 'but', 'or'];
  return str
    .toLowerCase()
    .split(' ')
    .map((word, i) => {
      const match = word.match(/^\((.*)\)$/);
      if (match) {
        const inner = match[1];
        return `(${inner
          .split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join('-')})`;
      }
      if (word.includes('-')) {
        return word
          .split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join('-');
      }
      if (i !== 0 && lowerWords.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

const WorkoutGenerationScreen = ({ route, navigation }) => {
  const { selectedEquipment, selectedMuscleGroup } = route.params;
  const { userProfile } = useApp();

  const [generatedWorkout, setGeneratedWorkout] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allExercises, setAllExercises] = useState([]);
  const [hasFetchedExercises, setHasFetchedExercises] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    if (userProfile && hasFetchedExercises && allExercises.length > 0) {
      generateWorkoutForUser();
    }
  }, [userProfile, hasFetchedExercises, allExercises]);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .in('equipment', ['body weight', 'barbell', 'dumbbell', 'cable', 'machine'])
        .limit(500);

      if (error) throw new Error('Error fetching exercises: ' + error.message);

      if (data && data.length > 0) {
        setAllExercises(data);
        setHasFetchedExercises(true);
      } else {
        setHasFetchedExercises(true);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
      Alert.alert('Error', 'There was an issue fetching exercises.');
      setHasFetchedExercises(true);
    }
  };

  const generateWorkoutForUser = () => {
    if (!userProfile || !selectedEquipment || !selectedMuscleGroup || allExercises.length === 0) {
      Alert.alert('Selection Required', 'Please select equipment, muscle group, and ensure exercises are available.');
      setIsLoading(false);
      return;
    }

    const fitnessLevel = userProfile?.fitnessLevel || 'intermediate';
    const goal = userProfile?.goal || 'general';

    const workout = generateWorkout({
      allExercises,
      equipment: selectedEquipment,
      muscleGroup: selectedMuscleGroup,
      fitnessLevel,
      goal,
    });

    if (workout && workout.length > 0) {
      setGeneratedWorkout(workout);
    } else {
      Alert.alert('No Exercises Found', 'No exercises found for your selection.');
    }

    setIsLoading(false);
  };

  const renderWorkout = ({ item }) => (
    <Card style={styles.exerciseCard}>
      <Text style={styles.exerciseName}>{toTitleCase(item.name)}</Text>
     <Text style={styles.exerciseDetails}>
  Sets: {item.sets}   |   Reps: {item.reps}
  {item.weight !== null ? `   |   Weight: ${item.weight} lbs` : ''}
</Text>
      <Text style={styles.exerciseMeta}>
        Target: {item.target}   •   Equipment: {item.equipment}
      </Text>
    </Card>
  );

const handleGenerateWorkout = () => {
  navigation.navigate('WorkoutDisplay', {
    workout: generatedWorkout,
    muscleGroup: selectedMuscleGroup, 
  });
};


  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={generatedWorkout}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderWorkout}
          ListHeaderComponent={
            <View style={styles.infoSection}>
              <Card style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Ionicons name="information-circle" size={20} color={colors.info} />
                  <Text style={styles.infoTitle}>Workout Details</Text>
                </View>
                <Text style={styles.infoText}>Your workout was customized based on:</Text>
                <View style={styles.infoList}>
                  <Text style={styles.infoItem}>
                    • {userProfile?.fitnessLevel?.charAt(0).toUpperCase() + userProfile?.fitnessLevel?.slice(1)} fitness level
                  </Text>
                  <Text style={styles.infoItem}>
                    • {userProfile?.goal?.charAt(0).toUpperCase() + userProfile?.goal?.slice(1)} training goal
                  </Text>
                  <Text style={styles.infoItem}>
                    • {selectedEquipment.length} available equipment
                  </Text>
                </View>
               
              </Card>
            </View>
          }
          ListFooterComponent={
            <View style={styles.buttonContainer}>
              <GradientButton
                title="Start Workout"
                onPress={handleGenerateWorkout}
                disabled={generatedWorkout.length === 0}
                gradientColors={
                  generatedWorkout.length > 0
                    ? [colors.primary, colors.secondary]
                    : [colors.surface, colors.surface]
                }
              />
            </View>
          }
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  exerciseCard: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    marginHorizontal: spacing.xl,
    borderRadius: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseName: {
    ...typography.label,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  exerciseDetails: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  exerciseMeta: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
});

export default WorkoutGenerationScreen;
