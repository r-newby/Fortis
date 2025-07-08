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
      logs.forEach((log, i) => {
        const reps = Number(log.reps);
        const weight = Number(log.weight);
        const sets = i + 1;
        if (isNaN(reps) || isNaN(weight)) {
    Alert.alert('Invalid Input', 'Please enter numeric values for reps and weight.');
    return;
  }
        workoutExercises.push({
          workout_id: workout.id,
          exercise_id: exercise.id,
          reps,
          sets,
          weight,
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
          <Text style={styles.exerciseTitle}>{toTitleCase(exercise.name)}</Text>
          {exerciseLogs[exercise.id]?.map((log, index) => (
            <View key={index} style={styles.setRow}>
              <View style={styles.setLabel}>
               <Text style={styles.setText}>Set {index + 1}:</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Reps"
                placeholderTextColor="#666666"
                value={log.reps}
                onChangeText={(value) => handleInputChange(exercise.id, index, 'reps', value)}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Weight"
                placeholderTextColor="#666666"
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

      <GradientButton onPress={handleSubmit} title="Save Workout" style={styles.saveButton} />
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

  saveButton: {
    paddingHorizontal: spacing.lg,
    alignSelf: 'center',
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
  resultsContainer: {
    marginBottom: spacing.large,
    
  },
  card: {
    marginHorizontal: spacing.xl,
    marginVertical: spacing.sm,
    padding: spacing.lg,
    alignItems: 'flex-start',
    backgroundColor: '#1A1A1A', // optional: match your input field color
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
 
  addSet: {
    color: colors.primary,
    marginTop: spacing.sm,
    fontWeight: 'bold',
    marginHorizontal: spacing.lg,
  },
});

export default ExerciseLoggingScreen;
