// src/screens/workout/WorkoutGenerationScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
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

const { width: screenWidth } = Dimensions.get('window');

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

// Helper function to calculate smart rest times
const calculateRestTime = (exercise) => {
  const name = exercise.name.toLowerCase();
  const equipment = exercise.equipment.toLowerCase();

  // Compound movements get longer rest
  const compoundKeywords = ['squat', 'deadlift', 'bench', 'press', 'row', 'pull'];
  if (compoundKeywords.some(keyword => name.includes(keyword))) {
    return 180; // 3 minutes
  }

  // Barbell exercises get longer rest
  if (equipment.includes('barbell')) {
    return 150; // 2.5 minutes
  }

  // Isolation exercises get shorter rest
  const isolationKeywords = ['curl', 'raise', 'fly', 'extension', 'calf'];
  if (isolationKeywords.some(keyword => name.includes(keyword))) {
    return 90; // 1.5 minutes
  }

  return 120; // 2 minutes default
};

const WorkoutGenerationScreen = ({ route, navigation }) => {
  const { selectedEquipment, selectedMuscleGroup } = route.params;
  const { userProfile } = useApp();

  const [generatedWorkout, setGeneratedWorkout] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allExercises, setAllExercises] = useState([]);
  const [hasFetchedExercises, setHasFetchedExercises] = useState(false);
  const [workoutStats, setWorkoutStats] = useState({
    totalSets: 0,
    estimatedTime: 0,
    totalVolume: 0,
  });

  // State management for GIF demonstration functionality
  const [expandedExercises, setExpandedExercises] = useState(new Set());
  const [selectedGif, setSelectedGif] = useState(null);
  const [showGifModal, setShowGifModal] = useState(false);

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
      // Include gif_url in query to enable exercise demonstrations
      const { data, error } = await supabase
        .from('exercises')
        .select('*, gif_url')
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
      // Add rest times and calculate stats
      const enhancedWorkout = workout.map(exercise => ({
        ...exercise,
        restTime: calculateRestTime(exercise),
      }));

      setGeneratedWorkout(enhancedWorkout);
      calculateWorkoutStats(enhancedWorkout);
    } else {
      Alert.alert('No Exercises Found', 'No exercises found for your selection.');
    }

    setIsLoading(false);
  };

  const calculateWorkoutStats = (workout) => {
    const totalSets = workout.reduce((sum, ex) => sum + (ex?.sets ?? 0), 0);

    const avgSetTime = 45;
    const totalRestTime = workout.reduce((sum, ex) => {
      if (!ex?.sets || !ex?.restTime) return sum;
      return sum + (ex.sets - 1) * ex.restTime;
    }, 0);

    const totalSeconds = totalSets * avgSetTime + totalRestTime;
    const estimatedTime = Math.ceil(totalSeconds / 60);

    const totalVolume = workout.reduce((sum, ex) => {
      if (!ex?.sets || !ex?.reps) return sum;
      return sum + (ex.sets * ex.reps * (ex.weight ?? 0));
    }, 0);

    setWorkoutStats({
      totalSets,
      estimatedTime,
      totalVolume,
    });
  };


  // Toggle exercise demonstration visibility for individual exercises
  const toggleExerciseDemo = (exerciseId) => {
    const newExpanded = new Set(expandedExercises);
    if (newExpanded.has(exerciseId)) {
      newExpanded.delete(exerciseId);
    } else {
      newExpanded.add(exerciseId);
    }
    setExpandedExercises(newExpanded);
  };

  // Display exercise GIF in full-screen modal
  const openGifModal = (gifUrl, exerciseName) => {
    setSelectedGif({ url: gifUrl, name: exerciseName });
    setShowGifModal(true);
  };

  const renderWorkout = ({ item, index }) => {
    const isExpanded = expandedExercises.has(item.id);

    return (
      <Card style={[
        styles.exerciseCard,
        index === 0 && styles.firstExerciseCard
      ]}>
        <View style={styles.exerciseHeader}>
          <View style={styles.exerciseInfo}>
            <View style={styles.exerciseNameRow}>
              <Text style={styles.exerciseName}>{toTitleCase(item.name)}</Text>
              {/* Demo button appears only for exercises with available GIFs */}
              {item.gif_url && (
                <TouchableOpacity
                  onPress={() => toggleExerciseDemo(item.id)}
                  style={[styles.demoButton, isExpanded && styles.demoButtonActive]}
                >
                  <Ionicons
                    name={isExpanded ? "eye-off" : "eye"}
                    size={16}
                    color={isExpanded ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text style={[styles.demoButtonText, isExpanded && styles.demoButtonTextActive]}>
                    {isExpanded ? 'Hide' : 'Demo'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.exerciseMetrics}>
              <View style={styles.metricItem}>
                <Ionicons name="fitness" size={18} color={colors.primary} />
                <Text style={styles.metricText}>{item.sets} × {item.reps}</Text>
              </View>
              {item.weight && (
                <View style={styles.metricItem}>
                  <Ionicons name="barbell" size={18} color={colors.secondary} />
                  <Text style={styles.metricText}>{item.weight} lbs</Text>
                </View>
              )}
              <View style={styles.metricItem}>
                <Ionicons name="timer" size={18} color={colors.warning} />
                <Text style={styles.metricText}>
                  {Math.floor(item.restTime / 60)}:{(item.restTime % 60).toString().padStart(2, '0')} rest
                </Text>
              </View>
            </View>

            {/* Collapsible exercise demonstration section */}
            {isExpanded && item.gif_url && (
              <View style={styles.demoSection}>
                <TouchableOpacity
                  onPress={() => openGifModal(item.gif_url, item.name)}
                  style={styles.gifContainer}
                >
                  <Image
                    source={{ uri: item.gif_url }}
                    style={styles.exerciseGif}
                    resizeMode="contain"
                  />
                  <View style={styles.gifOverlay}>
                    <Ionicons name="expand" size={16} color="#FFFFFF" />
                    <Text style={styles.gifOverlayText}>Tap for full screen</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.exerciseTags}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.target}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.equipment}</Text>
              </View>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const handleStartWorkout = () => {
    navigation.navigate('WorkoutDisplay', {
      workout: generatedWorkout,
      muscleGroup: selectedMuscleGroup,
    });
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const exercisesWithGifs = generatedWorkout.filter(ex => ex.gif_url).length;

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Generating your perfect workout...</Text>
        </View>
      ) : (
        <FlatList
          data={generatedWorkout}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderWorkout}
          ListHeaderComponent={
            <View style={styles.headerSection}>

              {/* About This Workout - Merged */}
              <Card style={styles.aboutCard}>
                <View style={styles.aboutHeader}>
                  <Ionicons name="information-circle" size={20} color={colors.info} />
                  <Text style={styles.aboutTitle}>About This Workout</Text>
                </View>

                <Text style={styles.aboutText}>Personalized based on:</Text>
                <View style={styles.aboutGrid}>
                  <Text style={styles.aboutItem}>
                    • {userProfile?.fitnessLevel?.charAt(0).toUpperCase() + userProfile?.fitnessLevel?.slice(1)} fitness level
                  </Text>
                  <Text style={styles.aboutItem}>
                    • {userProfile?.goal?.charAt(0).toUpperCase() + userProfile?.goal?.slice(1)} training goal
                  </Text>
                  <Text style={styles.aboutItem}>
                    • {selectedMuscleGroup.charAt(0).toUpperCase() + selectedMuscleGroup.slice(1).replace('_', ' ')} focus
                  </Text>
                  <Text style={styles.aboutItem}>
                    • {selectedEquipment.length} equipment type(s) available
                  </Text>
                </View>

                <View style={styles.featuresSection}>
                  <Text style={styles.featuresLabel}>Features included:</Text>
                  <View style={styles.featuresGrid}>
                    <View style={styles.featureItem}>
                      <Ionicons name="timer" size={16} color={colors.success} />
                      <Text style={styles.featureText}>Smart timers</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="trending-up" size={16} color={colors.success} />
                      <Text style={styles.featureText}>Progress tracking</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="settings" size={16} color={colors.success} />
                      <Text style={styles.featureText}>Adjustable reps</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="play-circle" size={16} color={colors.success} />
                      <Text style={styles.featureText}>{exercisesWithGifs} video demos</Text>
                    </View>
                  </View>
                </View>
              </Card>

              <View style={styles.sectionDivider} />

              {/* Workout Overview */}
              <Card style={styles.overviewCard}>
                <View style={styles.overviewHeader}>
                  <Ionicons name="barbell" size={24} color={colors.primary} />
                  <Text style={styles.overviewTitle}>Workout Overview</Text>
                </View>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{generatedWorkout.length}</Text>
                    <Text style={styles.statLabel}>Exercises</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{workoutStats.totalSets}</Text>
                    <Text style={styles.statLabel}>Total Sets</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{formatTime(workoutStats.estimatedTime)}</Text>
                    <Text style={styles.statLabel}>Est. Time</Text>
                  </View>
                  {workoutStats.totalVolume > 0 && (
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>
                        {(workoutStats.totalVolume / 1000).toFixed(1)}k
                      </Text>
                      <Text style={styles.statLabel}>Volume (lbs)</Text>
                    </View>
                  )}
                </View>

                {/* Prompt users to preview exercise form before starting workout */}
                {exercisesWithGifs > 0 && (
                  <View style={styles.demoPrompt}>
                    <Ionicons name="bulb" size={16} color={colors.warning} />
                    <Text style={styles.demoPromptText}>
                      Tap the "Demo" button on exercises to preview proper form before starting
                    </Text>
                  </View>
                )}
              </Card>

              <View style={styles.sectionDivider} />
            </View>
          }
          ListFooterComponent={
            <View style={styles.buttonContainer}>
              <GradientButton
                title="Start Workout"
                onPress={handleStartWorkout}
                disabled={generatedWorkout.length === 0}
                gradientColors={
                  generatedWorkout.length > 0
                    ? colors.gradientPrimary
                    : [colors.surface, colors.surface]
                }
                style={styles.startButton}
              />
              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={generateWorkoutForUser}
              >
                <Ionicons name="refresh" size={20} color={colors.primary} />
                <Text style={styles.regenerateText}>Generate New Workout</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Full-screen modal for detailed exercise form viewing */}
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
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {selectedGif && (
              <Image
                source={{ uri: selectedGif.url }}
                style={styles.modalGif}
                resizeMode="contain"
              />
            )}
            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>
                Study the form, then close when ready to start your workout
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: spacing.xl,
    marginVertical: spacing.xs,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  headerSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: 0,
  },
  overviewCard: {
    backgroundColor: colors.surfaceSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.lg,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  overviewTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    minWidth: '22%',
    marginBottom: spacing.md,
  },
  statNumber: {
    ...typography.h1,
    color: colors.primary,
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  demoPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.sm,
    marginTop: spacing.md,
  },
  demoPromptText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
    fontStyle: 'italic',
  },
  aboutCard: {
    backgroundColor: colors.surfaceSecondary,
    marginBottom: spacing.sm,
    padding: spacing.lg,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  aboutTitle: {
    ...typography.label,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  aboutText: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  aboutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  aboutItem: {
    ...typography.bodySmall,
    color: colors.success,
    width: '48%',
    marginBottom: spacing.xs,
  },
  featuresSection: {
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    paddingTop: spacing.md,
  },
  featuresLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: spacing.xs,
  },
  featureText: {
    ...typography.bodySmall,
    color: colors.success,
    marginLeft: spacing.xs,
    flex: 1,
  },
  firstExerciseCard: {
    marginTop: spacing.sm,
  },
  exerciseCard: {
    backgroundColor: colors.surfaceSecondary,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xl,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.xs,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  exerciseName: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '500',
    flex: 1,
    marginRight: spacing.sm,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
    marginLeft: 4,
  },
  demoButtonTextActive: {
    color: '#FFFFFF',
  },
  demoSection: {
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
    width: screenWidth - 120,
    height: 180,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gifOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  exerciseMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    fontSize: 15,
    fontWeight: '500',
  },
  exerciseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
  },
  tagText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  startButton: {
    marginBottom: spacing.md,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  regenerateText: {
    ...typography.bodyMedium,
    color: colors.primary,
    marginLeft: spacing.sm,
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
    fontSize: 18,
  },
  modalCloseButton: {
    backgroundColor: '#FF4444',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalGif: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  modalFooter: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  modalFooterText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default WorkoutGenerationScreen;