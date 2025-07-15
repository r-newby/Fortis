import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { supabase } from '../../supabase';
import GradientButton from '../../components/common/GradientButton';
import Card from '../../components/common/Card';
import { useApp } from '../../context/AppContext';
import { useWorkout } from '../../context/WorkoutContext';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';


// Utility to format exercise names in Title Case
const toTitleCase = (str) => {
  const lowerWords = ['of', 'on', 'in', 'at', 'to', 'for', 'with', 'a', 'an', 'the', 'and', 'but', 'or'];
  return str
    .toLowerCase()
    .split(' ')
    .map((word, i) => {
      const match = word.match(/^\((.*)\)$/);
      if (match) {
        const inner = match[1];
        return `(${inner.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('-')})`;
      }
      if (word.includes('-')) {
        return word.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('-');
      }
      if (i !== 0 && lowerWords.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
};

const ExerciseLoggingScreen = ({ navigation }) => {
  const {
    currentWorkout,
    addSet,
    completeWorkout,
    startNewWorkout,
    addExerciseToWorkout,
    lastCompletedWorkout
  } = useWorkout();
  const { user, reloadData, setNeedsReload } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [exerciseLogs, setExerciseLogs] = useState({});

  // If there's no active workout, start a custom one
  useEffect(() => {
    if (!currentWorkout) {
      startNewWorkout({ isCustom: true });
    }
  }, []);

  // Fetch exercises from Supabase matching the search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const fetchExercises = async () => {
      console.log('Searching for:', searchQuery);

      try {
        // Split search query into words for multi-field search
        const searchTerms = searchQuery.toLowerCase().trim().split(' ');

        let query = supabase.from('exercises').select('*');

        // Build OR conditions to search across all fields for any term
        const orConditions = [];

        searchTerms.forEach(term => {
          orConditions.push(`name.ilike.%${term}%`);
          orConditions.push(`equipment.ilike.%${term}%`);
          orConditions.push(`target.ilike.%${term}%`);
          orConditions.push(`body_part.ilike.%${term}%`);
        });

        // Use OR to search across all fields for any term
        const { data, error } = await query
          .or(orConditions.join(','))
          .limit(20);

        if (error) {
          console.error('Error fetching exercises:', error);
          setSearchResults([]);
        } else {
          console.log(`Found ${data?.length || 0} exercises for "${searchQuery}"`);

          // Sort results by relevance (exercises matching multiple terms first)
          const sortedResults = data?.sort((a, b) => {
            const aMatches = searchTerms.filter(term =>
              a.name?.toLowerCase().includes(term) ||
              a.equipment?.toLowerCase().includes(term) ||
              a.target?.toLowerCase().includes(term) ||
              a.body_part?.toLowerCase().includes(term)
            ).length;

            const bMatches = searchTerms.filter(term =>
              b.name?.toLowerCase().includes(term) ||
              b.equipment?.toLowerCase().includes(term) ||
              b.target?.toLowerCase().includes(term) ||
              b.body_part?.toLowerCase().includes(term)
            ).length;

            return bMatches - aMatches;
          }) || [];

          setSearchResults(sortedResults);
        }
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(fetchExercises, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Adds a new exercise to the workout and clears search
  const handleSelectExercise = (exercise) => {
    addExerciseToWorkout({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  // Updates local input state and context when reps or weight changes
  const handleInputChange = (exerciseId, setIndex, field, value) => {
    const parsed = field === 'weight' ? parseFloat(value) : parseInt(value);

    // Update local UI state
    const logs = [...(exerciseLogs[exerciseId] || [])];
    if (!logs[setIndex]) logs[setIndex] = { reps: '', weight: '' };
    logs[setIndex][field] = value;
    setExerciseLogs({ ...exerciseLogs, [exerciseId]: logs });

    // Sync to global context
    if (!isNaN(parsed)) {
      addSet(exerciseId, { [field]: parsed }, setIndex);
    }
  };

  // Adds a new empty set row for an exercise
  const handleAddSet = (exerciseId) => {
    setExerciseLogs({
      ...exerciseLogs,
      [exerciseId]: [
        ...(exerciseLogs[exerciseId] || []),
        { reps: '', weight: '' },
      ],
    });
  };

  // Handles full workout submission: saves sets and inserts into Supabase
  const handleSubmit = async () => {
    console.log('Submit started');

    // Sync all input sets to context
    for (const exerciseId in exerciseLogs) {
      const logs = exerciseLogs[exerciseId];
      logs.forEach(set => {
        const reps = parseInt(set.reps);
        const weight = parseFloat(set.weight);
        if (!isNaN(reps) && !isNaN(weight)) {
          addSet(exerciseId, { reps, weight });
        }
      });
    }

    console.log('Calling completeWorkout...');
    const finished = completeWorkout();
    console.log('Finished workout:', finished);

    if (!finished) {
      Alert.alert('Error', 'No workout to complete.');
      return;
    }

    const { exercises, date, muscleGroup, totalVolume } = finished;
    console.log('Inserting workout into Supabase...');

    const { data: workoutInsert, error } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        date,
        muscle_group: muscleGroup,
        total_volume: totalVolume,
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error.message);
      Alert.alert('Error', 'Failed to save workout.');
      return;
    }

    console.log('Workout inserted:', workoutInsert);
    const workoutId = workoutInsert.id;

    // Insert each exercise summary (averaged per set)
    for (const ex of exercises) {
      const sets = ex.completedSets.length;
      const totalReps = ex.completedSets.reduce((sum, s) => sum + s.reps, 0);
      const totalWeight = ex.completedSets.reduce((sum, s) => sum + s.weight, 0);

      const avgReps = Math.round(totalReps / sets);
      const avgWeight = Math.round(totalWeight / sets);

      await supabase.from('workout_exercises').insert({
        workout_id: workoutId,
        exercise_id: ex.exerciseId,
        sets,
        reps: avgReps,
        weight: avgWeight,
        actual_reps: avgReps,
        actual_weight: avgWeight,
      });
    }

    console.log('All exercises saved with actual values for PR calculation');
    console.log('Navigating to WorkoutSummary with:', finished);
  

    
    setSearchQuery('');
    setSearchResults([]);
    setExerciseLogs({});
    console.log('NAVIGATION STATE:', JSON.stringify(navigation.getState(), null, 2));
navigation.navigate('Workouts', {
  screen: 'WorkoutSummary',
  params: { workout: finished },
});


setTimeout(() => {
  setNeedsReload(true);
}, 250);





  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.contentContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for exercises"
          placeholderTextColor="#A9A9A9"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            {searchResults.map((exercise) => (
              <TouchableOpacity key={exercise.id} onPress={() => handleSelectExercise(exercise)}>
                <Card style={styles.card}>
                  <Text style={styles.exerciseName}>{toTitleCase(exercise.name)}</Text>
                  <Text style={styles.exerciseDetails}>{exercise.target} | {exercise.equipment}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {currentWorkout?.exercises.map((exercise) => (
          <View key={exercise.exerciseId} style={styles.exerciseBlock}>
            <Text style={styles.exerciseTitle}>{toTitleCase(exercise.exerciseName)}</Text>
            {(exerciseLogs[exercise.exerciseId] || []).map((set, index) => (
              <View key={index} style={styles.setRow}>
                <View style={styles.setLabel}>
                  <Text style={styles.setText}>Set {index + 1}:</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Reps"
                  placeholderTextColor="#666666"
                  keyboardType="numeric"
                  value={set.reps}
                  onChangeText={(val) => handleInputChange(exercise.exerciseId, index, 'reps', val)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Weight"
                  placeholderTextColor="#666666"
                  keyboardType="numeric"
                  value={set.weight}
                  onChangeText={(val) => handleInputChange(exercise.exerciseId, index, 'weight', val)}
                />
              </View>
            ))}
            <TouchableOpacity onPress={() => handleAddSet(exercise.exerciseId)}>
              <Text style={styles.addSet}>+ Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}

        <GradientButton onPress={handleSubmit} title="Save Workout" style={styles.saveButton} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.medium,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  searchInput: {
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  resultsContainer: {
    marginBottom: spacing.large,
  },
  card: {
    marginHorizontal: spacing.xl,
    marginVertical: spacing.sm,
    padding: spacing.lg,
    alignItems: 'flex-start',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
  },
  exerciseName: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  exerciseDetails: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  exerciseBlock: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.lg,
  },
  exerciseTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    gap: 8,
  },
  setLabel: {
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  setText: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
    width: 50,
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: spacing.small,
  },
  addSet: {
    color: colors.primary,
    marginTop: spacing.sm,
    fontWeight: 'bold',
    marginHorizontal: spacing.lg,
  },
  saveButton: {
    paddingHorizontal: spacing.lg,
    alignSelf: 'center',
  },
});

export default ExerciseLoggingScreen;
