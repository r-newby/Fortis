import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../supabase';
import { useApp } from '../../context/AppContext';
import { colors } from '../../utils/colors';
import { spacing } from '../../utils/spacing';
import { typography } from '../../utils/typography';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';




const filterOptions = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Last 6 Months', value: '6m' },
  { label: 'Last Year', value: '1y' },
  { label: 'All', value: 'all' },
];

const getStartDate = (filterValue) => {
  const now = new Date();
  switch (filterValue) {
    case '7d':
      return new Date(now.setDate(now.getDate() - 7));
    case '30d':
      return new Date(now.setDate(now.getDate() - 30));
    case '3m':
      return new Date(now.setMonth(now.getMonth() - 3));
    case '6m':
      return new Date(now.setMonth(now.getMonth() - 6));
    case '1y':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return null;
  }
};

const WorkoutHistoryScreen = ({ navigation }) => {
  const { userProfile } = useApp();
  const [workouts, setWorkouts] = useState([]);
  const [expandedWorkoutIds, setExpandedWorkoutIds] = useState([]);
  const [filter, setFilter] = useState('7d');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    if (userProfile?.id) {
      fetchMoreWorkouts(true);
    }
  }, [userProfile?.id, filter]);

  const fetchMoreWorkouts = async (reset = false) => {
    if (loadingMore || !userProfile?.id || (!reset && !hasMore)) return;
    setLoadingMore(true);

    const from = reset ? 0 : workouts.length;
    const to = from + pageSize - 1;

    let query = supabase
      .from('workouts')
      .select(`
        id,
        date,
        intensity,
        workout_exercises (
          id,
          sets,
          reps,
          weight,
          exercises (
            id,
            name,
            target
          )
        )
      `)
      .eq('user_id', userProfile.id)
      .order('date', { ascending: false })
      .range(from, to);

    const startDate = getStartDate(filter);
    if (startDate) {
      query = query.gte('date', startDate.toISOString());
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching workouts:', error);
    } else {
      setWorkouts(prev => {
        const existing = reset ? [] : prev;
        const existingIds = new Set(existing.map(w => w.id));
        const newWorkouts = (data || []).filter(w => !existingIds.has(w.id));
        return [...existing, ...newWorkouts];
      });

      setHasMore((data || []).length === pageSize);
    }
    setLoadingMore(false);
  };

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedWorkoutIds(prev =>
      prev.includes(id) ? prev.filter(wid => wid !== id) : [...prev, id]
    );
  };

  const renderWorkout = ({ item: workout }) => {
    const expanded = expandedWorkoutIds.includes(workout.id);
    const formattedDate = workout.date ? format(new Date(workout.date), 'MMMM d') : 'Invalid date';

    return (
      <TouchableOpacity
        key={workout.id}
        style={styles.card}
        onPress={() => toggleExpand(workout.id)}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.date}>{formattedDate}</Text>
            <Text style={styles.summary}>
              {typeof workout.intensity === 'number'
                ? `${workout.intensity} Intensity`
                : 'N/A Intensity'}
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </View>

        {expanded && Array.isArray(workout.workout_exercises) && (
          <View style={styles.details}>
            {workout.workout_exercises.map(ex => (
              <View key={`${workout.id}-${ex.id}`} style={styles.exerciseRow}>
                <Text style={styles.exerciseName}>
                  {ex.exercises?.name || 'Unnamed'} ({ex.exercises?.target || 'Unknown'})
                </Text>
                <Text style={styles.exerciseData}>
                  {ex.sets ?? '—'} sets • {ex.reps ?? '—'} reps • {ex.weight ?? 'N/A'} lbs
                </Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = useMemo(() => (
    <View>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Workout History</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filterOptions.map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => {
              setFilter(opt.value);
            }}
            style={[styles.filterButton, filter === opt.value && styles.filterButtonSelected]}
          >
            <Text style={[styles.filterButtonText, filter === opt.value && styles.filterButtonTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  ), [filter]);


  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={workouts}
        keyExtractor={item => item.id}
        renderItem={renderWorkout}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: spacing.lg }} /> : null}
        onEndReached={() => {
          if (!loadingMore && hasMore) {
            setTimeout(() => {
              fetchMoreWorkouts();
            }, 400); // 400ms delay before loading more
          }
        }}
        onEndReachedThreshold={0.2}
        contentContainerStyle={styles.scrollContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  backButton: { marginRight: spacing.m },
  title: { ...typography.h1, color: colors.textPrimary },
  filterRow: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.s,
    flexDirection: 'row',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: spacing.s,
  },
  filterButtonSelected: { backgroundColor: colors.primary },
  filterButtonText: { color: colors.textSecondary, ...typography.caption },
  filterButtonTextSelected: { color: colors.textPrimary, fontWeight: '600' },
  card: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: { color: colors.textSecondary, ...typography.caption },
  summary: { color: colors.textPrimary, ...typography.body },
  details: { marginTop: spacing.m },
  exerciseRow: { marginBottom: spacing.s },
  exerciseName: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  exerciseData: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'left',
  },
});

export default WorkoutHistoryScreen;
