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
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { supabase } from '../../supabase';
import GradientButton from '../../components/common/GradientButton';
import Card from '../../components/common/Card';
import { useApp } from '../../context/AppContext';
import { useWorkout } from '../../context/WorkoutContext';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';

const { width: screenWidth } = Dimensions.get('window');

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
    removeExerciseFromWorkout,
    lastCompletedWorkout
  } = useWorkout();
  const { user, reloadData, setNeedsReload } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [exerciseLogs, setExerciseLogs] = useState({});
  const [selectedGif, setSelectedGif] = useState(null);
  const [showGifModal, setShowGifModal] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState(new Set());

  // If there's no active workout, start a custom one
  useEffect(() => {
    if (!currentWorkout) {
      startNewWorkout({ isCustom: true });
    }
  }, []);

  // Fetch exercises from Supabase matching the search query (now includes gif_url)
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

        // Include gif_url in the select
        let query = supabase.from('exercises').select('*, gif_url');

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

  // Check if an exercise is bodyweight based on equipment
  const isBodyweightExercise = (exercise) => {
    if (!exercise?.equipment) return false;
    const equipment = exercise.equipment.toLowerCase();
    return equipment.includes('bodyweight') || 
           equipment.includes('body weight') || 
           equipment.includes('assisted') ||
           equipment === 'none';
  };

  // Adds a new exercise to the workout and clears search
  const handleSelectExercise = (exercise) => {
    addExerciseToWorkout({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      equipment: exercise.equipment,
      gifUrl: exercise.gif_url, // Store the GIF URL
    });
    setSearchQuery('');
    setSearchResults([]);
  };
const calculateWorkoutVolume = (exercises) => {
  if (!Array.isArray(exercises)) {
    console.warn('calculateWorkoutVolume: Expected an array but got:', exercises);
    return 0;
  }

  return exercises.reduce((totalVolume, exercise, index) => {
    if (!exercise || typeof exercise !== 'object') {
      console.warn(`Skipping invalid exercise at index ${index}:`, exercise);
      return totalVolume;
    }

    const sets = Array.isArray(exercise.completedSets)
      ? exercise.completedSets
      : [];

    if (sets.length === 0) {
      console.warn(`No completed sets for exercise at index ${index} (${exercise.exerciseName || 'Unnamed'})`);
    }

    console.log(`Completed sets for "${exercise.exerciseName}":`, sets);

    const exerciseVolume = sets.reduce((sum, set, setIndex) => {
      const reps = Number(set?.reps);
      let weight = Number(set?.weight);

      if (isNaN(reps)) {
        console.warn(`Invalid reps at exercise[${index}].completedSets[${setIndex}]:`, set);
        return sum;
      }

      if (isNaN(weight)) {
        console.warn(`Invalid weight at exercise[${index}].completedSets[${setIndex}]:`, set);
        return sum;
      }

      // Treat bodyweight as weight = 1 for volume calc
      if (weight === 0) weight = 1;

      return sum + (reps * weight);
    }, 0);

    console.log(`Exercise [${index}] "${exercise.exerciseName}" volume: ${exerciseVolume}`);
    return totalVolume + exerciseVolume;
  }, 0);
};




  // Toggle exercise demonstration visibility
  const toggleExerciseDemo = (exerciseId) => {
    const newExpanded = new Set(expandedExercises);
    if (newExpanded.has(exerciseId)) {
      newExpanded.delete(exerciseId);
    } else {
      newExpanded.add(exerciseId);
    }
    setExpandedExercises(newExpanded);
  };

  // Open GIF in full screen modal
  const openGifModal = (gifUrl, exerciseName) => {
    setSelectedGif({ url: gifUrl, name: exerciseName });
    setShowGifModal(true);
  };

  // Removes an exercise from the workout and cleans up local state
  const handleRemoveExercise = (exerciseId, exerciseName) => {
    Alert.alert(
      'Remove Exercise',
      `Are you sure you want to remove "${toTitleCase(exerciseName)}" from your workout?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            // Remove from workout context
            if (removeExerciseFromWorkout) {
              removeExerciseFromWorkout(exerciseId);
            }
            
            // Clean up local exercise logs
            const updatedLogs = { ...exerciseLogs };
            delete updatedLogs[exerciseId];
            setExerciseLogs(updatedLogs);
            
            // Remove from expanded exercises
            const newExpanded = new Set(expandedExercises);
            newExpanded.delete(exerciseId);
            setExpandedExercises(newExpanded);
          },
        },
      ]
    );
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
    // Check if this is a bodyweight exercise to set default weight
    const exercise = currentWorkout?.exercises.find(ex => ex.exerciseId === exerciseId);
    const isBodyweight = isBodyweightExercise(exercise);
    
    setExerciseLogs({
      ...exerciseLogs,
      [exerciseId]: [
        ...(exerciseLogs[exerciseId] || []),
        { reps: '', weight: isBodyweight ? '1' : '' },
      ],
    });

    // If bodyweight, automatically add a set with 0 weight
    if (isBodyweight) {
      addSet(exerciseId, { weight: 0 });
    }
  };

  // Handles full workout submission: saves sets and inserts into Supabase
  const handleSubmit = async () => {
    console.log('Submit started');

    // Sync all input sets to context
    for (const exerciseId in exerciseLogs) {
      const logs = exerciseLogs[exerciseId];
      const exercise = currentWorkout?.exercises.find(ex => ex.exerciseId === exerciseId);
      const isBodyweight = isBodyweightExercise(exercise);
      
      logs.forEach((set, index) => {
        const reps = parseInt(set.reps);
        const weight = isBodyweight ? 1 : parseFloat(set.weight);
        
        if (!isNaN(reps) && !isNaN(weight)) {
          addSet(exerciseId, { reps, weight }, index);
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
    console.log("CALCULATING WORKOUT:");
    const { exercises, date, muscleGroup } = finished;
    let totalVolume = calculateWorkoutVolume(exercises);
    console.log("TOTAL:", totalVolume);


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
    setExpandedExercises(new Set());
    
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
                  <View style={styles.searchResultContent}>
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.exerciseName}>{toTitleCase(exercise.name)}</Text>
                      <Text style={styles.exerciseDetails}>{exercise.target} | {exercise.equipment}</Text>
                    </View>
                    {exercise.gif_url && (
                      <View style={styles.searchResultGif}>
                        <Image
                          source={{ uri: exercise.gif_url }}
                          style={styles.searchGifThumbnail}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {currentWorkout?.exercises.map((exercise) => {
          const isBodyweight = isBodyweightExercise(exercise);
          const isExpanded = expandedExercises.has(exercise.exerciseId);
          
          return (
            <View key={exercise.exerciseId} style={styles.exerciseBlock}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseTitle}>{toTitleCase(exercise.exerciseName)}</Text>
                <View style={styles.exerciseHeaderButtons}>
                  {exercise.gifUrl && (
                    <TouchableOpacity 
                      onPress={() => toggleExerciseDemo(exercise.exerciseId)}
                      style={[styles.demoButton, isExpanded && styles.demoButtonActive]}
                    >
                      <Text style={[styles.demoButtonText, isExpanded && styles.demoButtonTextActive]}>
                        {isExpanded ? 'Hide' : 'Demo'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    onPress={() => handleRemoveExercise(exercise.exerciseId, exercise.exerciseName)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Exercise Demonstration Section */}
              {isExpanded && exercise.gifUrl && (
                <View style={styles.demoSection}>
                  <TouchableOpacity 
                    onPress={() => openGifModal(exercise.gifUrl, exercise.exerciseName)}
                    style={styles.gifContainer}
                  >
                    <Image
                      source={{ uri: exercise.gifUrl }}
                      style={styles.exerciseGif}
                      resizeMode="contain"
                    />
                    <View style={styles.gifOverlay}>
                      <Text style={styles.gifOverlayText}>Tap to view full screen</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

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
                  {isBodyweight ? (
                    <View style={styles.bodyweightLabel}>
                      <Text style={styles.bodyweightText}>Bodyweight</Text>
                    </View>
                  ) : (
                    <TextInput
                      style={styles.input}
                      placeholder="Weight"
                      placeholderTextColor="#666666"
                      keyboardType="numeric"
                      value={set.weight}
                      onChangeText={(val) => handleInputChange(exercise.exerciseId, index, 'weight', val)}
                    />
                  )}
                </View>
              ))}
              <TouchableOpacity onPress={() => handleAddSet(exercise.exerciseId)}>
                <Text style={styles.addSet}>+ Add Set</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <GradientButton onPress={handleSubmit} title="Save Workout" style={styles.saveButton} />

        {/* Full Screen GIF Modal */}
        <Modal
          visible={showGifModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowGifModal(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedGif ? toTitleCase(selectedGif.name) : ''}
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowGifModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              {selectedGif && (
                <Image
                  source={{ uri: selectedGif.url }}
                  style={styles.modalGif}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        </Modal>
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
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
  },
  searchResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchResultInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  searchResultGif: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  searchGifThumbnail: {
    width: '100%',
    height: '100%',
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
    marginBottom: spacing.sm,
    paddingVertical: spacing.lg,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  exerciseTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    flex: 1,
  },
  exerciseHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  demoButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#444444',
  },
  demoButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  demoButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  demoButtonTextActive: {
    color: '#FFFFFF',
  },
  removeButton: {
    backgroundColor: '#FF4444',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  demoSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: spacing.md,
  },
  gifContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  exerciseGif: {
    width: screenWidth - 80,
    height: 200,
    borderRadius: 8,
  },
  gifOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 6,
  },
  gifOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
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
  bodyweightLabel: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444444',
    marginBottom: spacing.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyweightText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontSize: 14,
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
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth - 40,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    flex: 1,
  },
  modalCloseButton: {
    backgroundColor: '#FF4444',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalGif: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
});

export default ExerciseLoggingScreen;