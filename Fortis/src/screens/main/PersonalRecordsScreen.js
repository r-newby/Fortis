// Updated PersonalRecordsScreen.js for Supabase-based personal records

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../components/common/Card';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');

const PersonalRecordsScreen = ({ navigation }) => {
  const { personalRecords } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPR, setSelectedPR] = useState(null);
  const [filteredRecords, setFilteredRecords] = useState([]);

  // Main category mapping - consolidates ExerciseDB subcategories
  const CATEGORY_MAPPING = {
    'legs': ['legs', 'upper legs', 'lower legs'],
    'chest': ['chest'],
    'back': ['back'],
    'shoulders': ['shoulders'],
    'arms': ['upper arms', 'lower arms'],
    'core': ['waist'],
    'cardio': ['cardio'],
    'neck': ['neck']
  };

  // Fixed categories for UI
  const categories = [
    { id: 'all', label: 'All', icon: 'list' },
    { id: 'chest', label: 'Chest', icon: 'arrow-up' },
    { id: 'back', label: 'Back', icon: 'arrow-down' },
    { id: 'legs', label: 'Legs', icon: 'walk' },
    { id: 'shoulders', label: 'Shoulders', icon: 'triangle' },
    { id: 'arms', label: 'Arms', icon: 'fitness' },
    { id: 'core', label: 'Core', icon: 'body' },
    { id: 'cardio', label: 'Cardio', icon: 'heart' },
  ];

  useEffect(() => {
    filterRecords();
  }, [personalRecords, searchQuery, selectedCategory]);

  // Helper function to map ExerciseDB bodypart to main category
  const getMainCategory = (bodypart) => {
    if (!bodypart) return null;

    const lowerBodypart = bodypart.toLowerCase();

    // Find which main category this bodypart belongs to
    for (const [mainCategory, subcategories] of Object.entries(CATEGORY_MAPPING)) {
      if (subcategories.includes(lowerBodypart)) {
        return mainCategory;
      }
    }

    return null;
  };

  const filterRecords = () => {
    let filtered = Object.entries(personalRecords);

    // Filter by search query - now properly handling exercise names
    if (searchQuery) {
      filtered = filtered.filter(([exerciseName]) =>
        exerciseName.toLowerCase().replace(/_/g, ' ').includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category using the bodypart data from PR records
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(([exerciseName, record]) => {
        // Use the bodypart data from the PR record (now included from AppContext)
        if (record.bodypart) {
          const mainCategory = getMainCategory(record.bodypart);
          return mainCategory === selectedCategory;
        }

        // Fallback to name-based filtering if no bodypart data
        return getMainCategoryFromName(exerciseName) === selectedCategory;
      });
    }

    // Sort by volume/weight (highest first) - use the volume field from context
    filtered.sort((a, b) => {
      const volumeA = a[1].volume || 0;
      const volumeB = b[1].volume || 0;
      
      // For bodyweight exercises, sort by reps instead
      if (volumeA === 0 && volumeB === 0) {
        return b[1].reps - a[1].reps;
      }
      
      return volumeB - volumeA;
    });

    setFilteredRecords(filtered);
  };

  // Fallback function for name-based categorization when bodypart data isn't available
  const getMainCategoryFromName = (exerciseName) => {
    const name = exerciseName.toLowerCase();

    if (name.includes('chest') || name.includes('bench') || name.includes('push up') ||
      name.includes('fly') || name.includes('dip')) {
      return 'chest';
    }
    if (name.includes('back') || name.includes('lat') || name.includes('row') ||
      name.includes('pull') || name.includes('deadlift')) {
      return 'back';
    }
    if (name.includes('leg') || name.includes('quad') || name.includes('hamstring') ||
      name.includes('calf') || name.includes('squat') || name.includes('lunge') ||
      name.includes('glute')) {
      return 'legs';
    }
    if (name.includes('shoulder') || name.includes('delt') || name.includes('raise') ||
      name.includes('shrug')) {
      return 'shoulders';
    }
    if (name.includes('bicep') || name.includes('tricep') || name.includes('curl') ||
      name.includes('extension') || name.includes('arm') || name.includes('forearm')) {
      return 'arms';
    }
    if (name.includes('abs') || name.includes('core') || name.includes('plank') ||
      name.includes('crunch') || name.includes('oblique')) {
      return 'core';
    }
    if (name.includes('cardio') || name.includes('running') || name.includes('cycling')) {
      return 'cardio';
    }

    return null;
  };

  const formatExerciseName = (exerciseName) => {
    return exerciseName
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getExerciseIcon = (exerciseName, record) => {
    let category;

    // Use bodypart from the record if available
    if (record.bodypart) {
      category = getMainCategory(record.bodypart);
    } else {
      category = getMainCategoryFromName(exerciseName);
    }

    const iconMap = {
      'chest': 'arrow-up',
      'back': 'arrow-down',
      'legs': 'walk',
      'shoulders': 'triangle',
      'arms': 'fitness',
      'core': 'body',
      'cardio': 'heart',
      'neck': 'body',
    };

    return iconMap[category] || 'barbell';
  };

  const getExerciseTargetInfo = (record) => {
    // Use the data that's now included in the PR record
    const target = record.target || 'Unknown';
    const equipment = record.equipment || 'Unknown';
    return `${target} • ${equipment}`;
  };

  const formatRepsDisplay = (exerciseName, reps) => {
    if (exerciseName.toLowerCase().includes('plank') && reps > 30) {
      return `${reps} sec`;
    }
    return `${reps} reps`;
  };

  // Helper function to safely format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Unknown date';
    }
  };

  const PRDetailModal = () => {
    if (!selectedPR) return null;

    return (
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDetailModal(false)}
        >
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPR.exerciseName}</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.prDetailRow}>
                <Text style={styles.prDetailLabel}>Weight</Text>
                <Text style={styles.prDetailValue}>
                  {selectedPR.weight > 0 ? `${selectedPR.weight} lbs` : 'Bodyweight'}
                </Text>
              </View>
              <View style={styles.prDetailRow}>
                <Text style={styles.prDetailLabel}>Reps</Text>
                <Text style={styles.prDetailValue}>
                  {formatRepsDisplay(selectedPR.exerciseName, selectedPR.reps)}
                </Text>
              </View>
              <View style={styles.prDetailRow}>
                <Text style={styles.prDetailLabel}>Total Volume</Text>
                <Text style={styles.prDetailValue}>
                  {selectedPR.weight > 0 ? `${selectedPR.volume} lbs` : 'N/A'}
                </Text>
              </View>
              <View style={styles.prDetailRow}>
                <Text style={styles.prDetailLabel}>Date Set</Text>
                <Text style={styles.prDetailValue}>
                  {formatDate(selectedPR.date)}
                </Text>
              </View>
              <View style={styles.prDetailRow}>
                <Text style={styles.prDetailLabel}>Muscle & Equipment</Text>
                <Text style={styles.prDetailValue}>{selectedPR.targetInfo}</Text>
              </View>
              {selectedPR.isPR && (
                <View style={styles.prDetailRow}>
                  <Text style={styles.prDetailLabel}>Status</Text>
                  <Text style={[styles.prDetailValue, { color: colors.primary }]}>
                    🏆 Personal Record
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => setShowDetailModal(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Show available categories based on current PR data
  const getAvailableCategories = () => {
    if (Object.keys(personalRecords).length === 0) {
      return [{ id: 'all', label: 'All', icon: 'list' }];
    }

    const availableCats = new Set(['all']);

    Object.entries(personalRecords).forEach(([exerciseName, record]) => {
      let category;

      // Use bodypart from the record if available
      if (record.bodypart) {
        category = getMainCategory(record.bodypart);
      } else {
        category = getMainCategoryFromName(exerciseName);
      }

      if (category) {
        availableCats.add(category);
      }
    });

    return categories.filter(cat => availableCats.has(cat.id));
  };

  // Empty state for when user has no PRs
  const EmptyPRState = () => (
    <View style={styles.emptyStateContainer}>
      <Card style={styles.emptyCard}>
        <Text style={styles.emptyIcon}>🏆</Text>
        <Text style={styles.emptyTitle}>No Personal Records Yet</Text>
        <Text style={styles.emptyText}>
          Complete workouts and track your progress to start setting personal records
        </Text>
        <TouchableOpacity
          style={styles.startWorkoutButton}
          onPress={() => navigation.navigate('Workouts')}
        >
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.startWorkoutGradient}
          >
            <Ionicons name="barbell" size={20} color="#FFFFFF" />
            <Text style={styles.startWorkoutText}>Start Your First Workout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Personal Records</Text>
          <Text style={styles.subtitle}>
            {Object.keys(personalRecords).length} exercises tracked
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Object.keys(personalRecords).length > 0 ? (
          <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search exercises..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Consolidated Category Filters */}
            <View style={styles.categorySection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categorySelector}
              >
                {getAvailableCategories().map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryPill,
                      selectedCategory === category.id && styles.categoryPillActive
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Ionicons
                      name={category.icon}
                      size={16}
                      color={selectedCategory === category.id ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text style={[
                      styles.categoryPillText,
                      selectedCategory === category.id && styles.categoryPillTextActive
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Search Results Count */}
            {searchQuery && (
              <View style={styles.resultsCount}>
                <Text style={styles.resultsText}>
                  {filteredRecords.length} result{filteredRecords.length !== 1 ? 's' : ''} for "{searchQuery}"
                </Text>
              </View>
            )}

            {/* Personal Records List */}
            <View style={styles.recordsSection}>
              {filteredRecords.length > 0 ? (
                <View style={styles.recordsList}>
                  {filteredRecords.map(([exerciseName, record], index) => (
                    <TouchableOpacity
                      key={exerciseName}
                      style={[styles.recordCard, index === 0 && styles.topRecord]}
                      onPress={() => {
                        setSelectedPR({
                          ...record,
                          exerciseName: formatExerciseName(exerciseName),
                          targetInfo: getExerciseTargetInfo(record)
                        });
                        setShowDetailModal(true);
                      }}
                    >
                      <View style={styles.recordIconContainer}>
                        <Ionicons
                          name={getExerciseIcon(exerciseName, record)}
                          size={24}
                          color={colors.primary}
                        />
                      </View>

                      <View style={styles.recordInfo}>
                        <Text style={styles.recordExercise} numberOfLines={1}>
                          {formatExerciseName(exerciseName)}
                        </Text>
                        <Text style={styles.recordDetails}>
                          {record.weight > 0 ? `${record.weight} lbs × ` : ''}
                          {formatRepsDisplay(exerciseName, record.reps)}
                        </Text>
                        <Text style={styles.recordDate}>
                          {formatDate(record.date)}
                        </Text>
                      </View>

                      <View style={styles.recordStats}>
                        {record.weight > 0 ? (
                          <>
                            <Text style={styles.recordVolume}>
                              {record.volume}
                            </Text>
                            <Text style={styles.recordVolumeLabel}>lbs</Text>
                          </>
                        ) : (
                          <>
                            <Text style={styles.recordVolume}>
                              {record.reps}
                            </Text>
                            <Text style={styles.recordVolumeLabel}>
                              {exerciseName.includes('plank') ? 'sec' : 'reps'}
                            </Text>
                          </>
                        )}
                      </View>

                      {index === 0 && (
                        <View style={styles.prBadge}>
                          <Text style={styles.prBadgeText}>🏆</Text>
                        </View>
                      )}

                      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Card style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyTitle}>No records found</Text>
                  <Text style={styles.emptyText}>
                    {searchQuery || selectedCategory !== 'all'
                      ? 'Try adjusting your search or filter'
                      : 'Complete workouts to set personal records'
                    }
                  </Text>
                  {(searchQuery || selectedCategory !== 'all') && (
                    <TouchableOpacity
                      style={styles.clearFiltersButton}
                      onPress={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                    >
                      <Text style={styles.clearFiltersText}>Clear Filters</Text>
                    </TouchableOpacity>
                  )}
                </Card>
              )}
            </View>
          </>
        ) : (
          <EmptyPRState />
        )}
      </ScrollView>

      <PRDetailModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  searchContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  categorySection: {
    marginBottom: spacing.xl,
  },
  categorySelector: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
  },
  categoryPillText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resultsCount: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  resultsText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  recordsSection: {
    paddingHorizontal: spacing.xl,
  },
  recordsList: {
    gap: spacing.md,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    position: 'relative',
  },
  topRecord: {
    borderWidth: 2,
    borderColor: `${colors.primary}30`,
  },
  recordIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordInfo: {
    flex: 1,
  },
  recordExercise: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  recordDetails: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  recordDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  recordStats: {
    alignItems: 'flex-end',
  },
  recordVolume: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  recordVolumeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  prBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  prBadgeText: {
    fontSize: 16,
  },
  emptyStateContainer: {
    paddingHorizontal: spacing.xl,
  },
  emptyCard: {
    padding: spacing.xxxl,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  startWorkoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  startWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  startWorkoutText: {
    ...typography.button,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  clearFiltersButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  clearFiltersText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  modalBody: {
    marginBottom: spacing.lg,
  },
  prDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  prDetailLabel: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  prDetailValue: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    ...typography.button,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default PersonalRecordsScreen;