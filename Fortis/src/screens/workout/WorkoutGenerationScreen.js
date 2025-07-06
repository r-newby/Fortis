import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ActivityIndicator, FlatList, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';  // To access user profile
import { supabase } from '../../supabase';  // Ensure this is imported for data fetching
import GradientButton from '../../components/common/GradientButton';  // Assuming GradientButton is default export
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';
import Card from '../../components/common/Card';  // Assuming Card is default export
import { generateWorkout } from '../../utils/generateWorkout';  // Import the generateWorkout function
const toTitleCase = (str) => {
  const lowerWords = ['of', 'on', 'in', 'at', 'to', 'for', 'with', 'a', 'an', 'the', 'and', 'but', 'or'];
  return str
    .toLowerCase()
    .split(' ')
    .map((word, i) => {
      // Case function for workout cards
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
  const { userProfile } = useApp();  // Fetch user profile from context

  const [generatedWorkout, setGeneratedWorkout] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allExercises, setAllExercises] = useState([]);  // State to store all exercises
  const [hasFetchedExercises, setHasFetchedExercises] = useState(false);  // Flag to track if exercises have been fetched

  useEffect(() => {
    console.log('Fetching exercises on component mount...');
    fetchExercises();  // Start fetching exercises when the component mounts
  }, []);  // Empty dependency array means it runs once when the component mounts

  useEffect(() => {
    if (userProfile && hasFetchedExercises && allExercises.length > 0) {
      console.log('userProfile in workoutgen:', userProfile);
      generateWorkoutForUser();  // Call only once exercises are fetched and userProfile is available
    }
  }, [userProfile, hasFetchedExercises, allExercises]);  // Trigger when userProfile, exercises change

  const fetchExercises = async () => {
    try {
      console.log('Fetching exercises...');  // Log to check if the function is triggered

      // Fetch more exercises from Supabase to include bodyweight exercises
      // Fetch exercises that match our equipment
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .in('equipment', ['body weight', 'barbell', 'dumbbell', 'cable', 'machine'])
        .limit(500);

      if (error) {
        throw new Error('Error fetching exercises: ' + error.message);
      }

      console.log('Fetched Exercises:', data);  // Log the data fetched to verify

      if (data && data.length > 0) {
        setAllExercises(data);  // Set exercises to state
        setHasFetchedExercises(true);  // Mark exercises as fetched
      } else {
        console.log('No exercises found in the database.');
        setHasFetchedExercises(true);  // Mark exercises as fetched even if no exercises are found
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
      Alert.alert('Error', 'There was an issue fetching exercises.');
      setHasFetchedExercises(true);  // Ensure flag is set to true even if there's an error
    }
  };

  const generateWorkoutForUser = () => {
    console.log('generateWorkoutForUser is called');
    console.log('Selected Equipment:', selectedEquipment);
    console.log('Selected Muscle Group:', selectedMuscleGroup);
    console.log('All Exercises:', allExercises);
    if (!userProfile || !selectedEquipment || !selectedMuscleGroup || allExercises.length === 0) {
      Alert.alert('Selection Required', 'Please select equipment, muscle group, and ensure exercises are available.');
      setIsLoading(false);
      return;
    }

    const fitnessLevel = userProfile?.fitnessLevel || 'intermediate'; // Default to 'intermediate' if missing
    const goal = userProfile?.goal || 'general'; // Default to 'general' if goal is missing

    console.log('Fitness Level:', fitnessLevel);
    console.log('Goal:', goal);

    // Use the target from the selectedMuscleGroup for filtering
    const muscleGroupTarget = selectedMuscleGroup.target;

    const workout = generateWorkout({
      allExercises,
      equipment: selectedEquipment,
      muscleGroup: selectedMuscleGroup,  // Pass the string directly
      fitnessLevel,
      goal,
    });

    console.log('Generated Workout:', workout);

    if (workout && workout.length > 0) {
      setGeneratedWorkout(workout);
      setIsLoading(false);  // Set loading state to false when workout is generated
    } else {
      Alert.alert('No Exercises Found', 'No exercises found for your selection.');
      setIsLoading(false);  // Set loading state to false when no exercises are found
    }
  };

    const renderWorkout = ({ item }) => (
    <Card style={styles.exerciseCard}>
    <Text style={styles.exerciseName}>{toTitleCase(item.name)}</Text>
    <Text style={styles.exerciseDetails}>
      Sets: {item.sets}   |   Reps: {item.reps}   |   Weight: {item.weight} lbs
    </Text>
    <Text style={styles.exerciseMeta}>
       Target: {item.target}   •   Equipment: {item.equipment}
    </Text>
    </Card>
  );

  const handleGenerateWorkout = () => {
    navigation.navigate('WorkoutTracking');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Workout Info */}
        <View style={styles.infoSection}>
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={styles.infoTitle}>Workout Details</Text>
            </View>
            <Text style={styles.infoText}>Your workout will be customized based on:</Text>
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

        {/* Generated Workout List */}
        <View style={styles.generatedWorkoutSection}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              <Text>Generated Workout:</Text>
              <FlatList
                data={generatedWorkout}
                renderItem={renderWorkout}
                keyExtractor={(item) => item.id.toString()}
              />
            </>
          )}
        </View>

        {/* Generate Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title="Start Workout"
            onPress={handleGenerateWorkout}
            disabled={generatedWorkout.length === 0}
            gradientColors={generatedWorkout.length > 0 ? [colors.primary, colors.secondary] : [colors.surface, colors.surface]}
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
  generatedWorkoutSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  exerciseCard: {
  backgroundColor: colors.surfaceSecondary,
  padding: spacing.lg,
  marginBottom: spacing.lg,
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
  },
});

export default WorkoutGenerationScreen;
