import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import GradientButton from '../../components/common/GradientButton';
import Card from '../../components/common/Card';
import { useApp } from '../../context/AppContext';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';

const ExerciseLoggingScreen = ({ navigation }) => {
  const { user } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [exerciseLogs, setExerciseLogs] = useState({});

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    const fetchExercises = async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .ilike('name', `%${searchQuery}%`)
        .limit(10);

      if (error) {
        console.error('Error fetching exercises:', error);
      } else {
        setSearchResults(data);
      }
    };

    fetchExercises();
  }, [searchQuery]);

  const handleSelectExercise = (exercise) => {
    if (selectedExercises.find((ex) => ex.id === exercise.id)) return;

    setSelectedExercises([...selectedExercises, exercise]);
    setExerciseLogs({
      ...exerciseLogs,
      [exercise.id]: [{ reps: '', sets: '', weight: '' }],
    });
    setSearchQuery('');
    setSearchResults([]); // hide search results after selection
  };

  const handleInputChange = (exerciseId, index, field, value) => {
    const updatedLogs = [...exerciseLogs[exerciseId]];
    updatedLogs[index][field] = value;
    setExerciseLogs({
      ...exerciseLogs,
      [exerciseId]: updatedLogs,
    });
  };

  const handleAddSet = (exerciseId) => {
    setExerciseLogs({
      ...exerciseLogs,
      [exerciseId]: [...exerciseLogs[exerciseId], { reps: '', sets: '', weight: '' }],
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('You must be logged in to save a workout.');
      return;
    }

    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert([{ user_id: user.id, date: new Date().toISOString() }])
      .select()
      .single();

    if (workoutError) {
      console.error('Error inserting workout:', workoutError);
      console.log(user.id);
      Alert.alert('Error saving workout.');
      return;
    }

    const workoutExercises = [];

    selectedExercises.forEach((exercise) => {
      const logs = exerciseLogs[exercise.id] || [];
      logs.forEach((log) => {
        workoutExercises.push({
          workout_id: workout.id,
          exercise_id: exercise.id,
          reps: log.reps,
          sets: log.sets,
          weight: log.weight,
        });
      });
    });

    const { error: insertError } = await supabase
      .from('workout_exercises')
      .insert(workoutExercises);

    if (insertError) {
      console.error('Error inserting workout exercises:', insertError);
      Alert.alert('Error saving workout exercises.');
    } else {
      Alert.alert('Workout saved!');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedExercises([]);
      setExerciseLogs({});
      console.log('Navigating with workoutId:', workout.id);

      navigation.navigate('WorkoutSummary', { workoutId: workout.id });

    }
  };

  return (
    <ScrollView
  style={styles.container}
  keyboardShouldPersistTaps="handled"
  contentContainerStyle={styles.contentContainer}
>

   
      <TextInput
        style={styles.input}
        placeholder="Search for exercises"
        placeholderTextColor={colors.gray}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          {searchResults.map((exercise) => (
            <TouchableOpacity key={exercise.id} onPress={() => handleSelectExercise(exercise)}>
              <Card style={styles.card}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDetails}>
                  {exercise.target} | {exercise.equipment}
                </Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedExercises.map((exercise) => (
        <View key={exercise.id} style={styles.exerciseBlock}>
          <Text style={styles.exerciseTitle}>{exercise.name}</Text>
          {exerciseLogs[exercise.id]?.map((log, index) => (
            <View key={index} style={styles.setRow}>
              <TextInput
                style={styles.input}
                placeholder="Sets"
                placeholderTextColor={colors.gray}
                value={log.sets}
                onChangeText={(value) => handleInputChange(exercise.id, index, 'sets', value)}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Reps"
                placeholderTextColor={colors.gray}
                value={log.reps}
                onChangeText={(value) => handleInputChange(exercise.id, index, 'reps', value)}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Weight"
                placeholderTextColor={colors.gray}
                value={log.weight}
                onChangeText={(value) => handleInputChange(exercise.id, index, 'weight', value)}
                keyboardType="numeric"
              />
            </View>
          ))}
          <TouchableOpacity onPress={() => handleAddSet(exercise.id)}>
            <Text style={styles.addSet}>+ Add Set</Text>
          </TouchableOpacity>
        </View>
      ))}

      <GradientButton onPress={handleSubmit} title="Save Workout" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.medium,
    
  },
  label: {
    ...typography.h3,
    color: colors.textSecondary,
     padding: spacing.xl,
  },
  input: {
     backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  resultsContainer: {
    marginBottom: spacing.large,
  },
  card: {
    marginHorizontal: spacing.xl,
    padding: spacing.xxl,
    alignItems: 'left',
  },
  exerciseName: {
   
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  exerciseDetails: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  exerciseBlock: {
    marginBottom: spacing.large,
  },
  exerciseTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  setRow: {
    flexDirection: 'row',
    marginBottom: spacing.small,
    gap: 8,
  },
 
  addSet: {
    color: colors.primary,
    marginTop: spacing.extraSmall,
    fontWeight: 'bold',
  },
});

export default ExerciseLoggingScreen;
