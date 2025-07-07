// src/screens/main/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../components/common/Card';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';
import { useApp } from '../../context/AppContext';
import { LineChart, ProgressChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { userProfile, workouts, personalRecords } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [motivationalQuote, setMotivationalQuote] = useState('');
  
  const motivationalQuotes = [
    "The only bad workout is the one that didn't happen.",
    "Push harder than yesterday if you want a different tomorrow.",
    "Success starts with self-discipline.",
    "Your body can stand almost anything. It's your mind you have to convince.",
    "Don't stop when you're tired. Stop when you're done.",
  ];

  const [stats, setStats] = useState({
    weeklyWorkouts: 0,
    currentStreak: 0,
    totalVolume: 0,
    lastWorkout: null,
    weeklyGoal: 4,
    weeklyProgress: 0,
    todayWorkout: false,
    caloriesBurned: 0,
  });

  useEffect(() => {
    calculateStats();
    setTimeBasedGreeting();
    setRandomQuote();
  }, [workouts]);

  const setTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 17) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  };


  const setRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setMotivationalQuote(motivationalQuotes[randomIndex]);
  };

  const calculateStats = () => {
    // Calculate weekly workouts
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyWorkouts = workouts.filter(w => 
      new Date(w.date) >= oneWeekAgo
    );

    // Calculate streak
    let streak = 0;
    const today = new Date();
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    for (let i = 0; i < sortedWorkouts.length; i++) {
      const workoutDate = new Date(sortedWorkouts[i].date);
      const daysDiff = Math.floor((today - workoutDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }

    // Check if worked out today
    const todayWorkout = workouts.some(w => {
      const workoutDate = new Date(w.date);
      return workoutDate.toDateString() === today.toDateString();
    });

    // Calculate total volume for the week
    const weeklyVolume = weeklyWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);

    // Calculate estimated calories (mock calculation)
    const caloriesBurned = weeklyWorkouts.length * 250;

    // Get last workout
    const lastWorkout = sortedWorkouts[0] || null;

    setStats({
      weeklyWorkouts: weeklyWorkouts.length,
      currentStreak: streak,
      totalVolume: weeklyVolume,
      lastWorkout,
      weeklyGoal: 4,
      weeklyProgress: (weeklyWorkouts.length / 4) * 100,
      todayWorkout,
      caloriesBurned,
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    calculateStats();
    setRandomQuote();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const startNewSession = () => {
    navigation.navigate('Workouts');
  };

  const getWeeklyChartData = () => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const data = new Array(7).fill(0);
    
    // Fill in actual workout data
    workouts.forEach(workout => {
      const workoutDate = new Date(workout.date);
      const today = new Date();
      const daysDiff = Math.floor((today - workoutDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < 7) {
        const dayIndex = (workoutDate.getDay() + 6) % 7; // Adjust for week starting on Monday
        data[dayIndex] = (data[dayIndex] || 0) + 1;
      }
    });

    return {
      labels: days,
      datasets: [{
        data: data.length > 0 ? data : [0, 0, 0, 0, 0, 0, 0],
      }],
    };
  };

  const getProgressData = () => {
    return {
      data: [Math.min(stats.weeklyProgress / 100, 1)],
    };
  };

  const QuickAction = ({ icon, title, color, onPress, badge }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <LinearGradient
        colors={[color + '20', color + '10']}
        style={styles.quickActionGradient}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.quickActionTitle}>{title}</Text>
        {badge !== undefined && badge !== null && badge > 0 && (
          <View style={styles.quickActionBadge}>
            <Text style={styles.quickActionBadgeText}>{badge}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const UpcomingWorkout = () => {
    const suggestedWorkouts = [
      { muscle: 'Chest', lastDone: 3, icon: '🎯' },
      { muscle: 'Back', lastDone: 2, icon: '🔙' },
      { muscle: 'Legs', lastDone: 4, icon: '🦵' },
    ];

    const nextWorkout = suggestedWorkouts.sort((a, b) => b.lastDone - a.lastDone)[0];

    return (
      <Card style={styles.upcomingCard}>
        <View style={styles.upcomingHeader}>
          <Text style={styles.upcomingTitle}>Suggested Next Workout</Text>
          <TouchableOpacity>
            <Ionicons name="refresh" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.upcomingContent}
          onPress={() => navigation.navigate('Workouts')}
        >
          <Text style={styles.upcomingIcon}>{nextWorkout.icon}</Text>
          <View style={styles.upcomingInfo}>
            <Text style={styles.upcomingMuscle}>{nextWorkout.muscle} Day</Text>
            <Text style={styles.upcomingTime}>Last done {nextWorkout.lastDone} days ago</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.username}>{userProfile?.username || 'Athlete'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Social')}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.profileGradient}
              >
                <Text style={styles.profileInitial}>
                  {userProfile?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Motivational Quote */}
        <Card style={styles.quoteCard}>
          <LinearGradient
            colors={['rgba(255, 71, 87, 0.1)', 'rgba(99, 102, 241, 0.1)']}
            style={styles.quoteGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="flash" size={20} color={colors.primary} />
            <Text style={styles.quoteText}>{motivationalQuote}</Text>
          </LinearGradient>
        </Card>

        {/* Today's Progress */}
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <Card style={styles.todayCard}>
            <View style={styles.todayContent}>
              <View style={styles.todayLeft}>
                <ProgressChart
                  data={getProgressData()}
                  width={80}
                  height={80}
                  strokeWidth={8}
                  radius={32}
                  chartConfig={{
                    backgroundGradientFrom: colors.surface,
                    backgroundGradientTo: colors.surface,
                    color: (opacity = 1) => `rgba(255, 71, 87, ${opacity})`,
                  }}
                  hideLegend={true}
                />
                <View style={styles.progressCenter}>
                  <Text style={styles.progressPercentage}>
                    {Math.round(stats.weeklyProgress)}%
                  </Text>
                </View>
              </View>
              <View style={styles.todayRight}>
                <View style={styles.todayStat}>
                  <Text style={styles.todayStatValue}>{stats.weeklyWorkouts}/{stats.weeklyGoal}</Text>
                  <Text style={styles.todayStatLabel}>Weekly Goal</Text>
                </View>
                <View style={styles.todayStat}>
                  <View style={styles.streakContainer}>
                    <Text style={styles.todayStatValue}>{stats.currentStreak}</Text>
                    {stats.currentStreak > 0 && <Text style={styles.fireEmoji}>🔥</Text>}
                  </View>
                  <Text style={styles.todayStatLabel}>Day Streak</Text>
                </View>
              </View>
            </View>
            
            {!stats.todayWorkout && (
              <TouchableOpacity style={styles.startTodayButton} onPress={startNewSession}>
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.startTodayGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="play" size={20} color="#FFFFFF" />
                  <Text style={styles.startTodayText}>Start Today's Workout</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsGrid}>
          <QuickAction
            icon="barbell"
            title="Quick Start"
            color={colors.primary}
            onPress={startNewSession}
          />
          <QuickAction
            icon="trophy"
            title="PRs"
            color={colors.warning}
            badge={Object.keys(personalRecords).length}
            onPress={() => navigation.navigate('Progress')}
          />
          <QuickAction
            icon="calendar"
            title="Schedule"
            color={colors.success}
            onPress={() => navigation.navigate('Workouts')}
          />
        </View>

        {/* Weekly Activity Chart */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>This Week</Text>
            <Text style={styles.chartSubtitle}>{stats.caloriesBurned} cal burned</Text>
          </View>
          <Card style={styles.chartCard}>
            <LineChart
              data={getWeeklyChartData()}
              width={width - spacing.xl * 4}
              height={180}
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(139, 148, 158, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: colors.primary,
                },
              }}
              bezier
              style={{
                marginVertical: spacing.sm,
                borderRadius: 16,
              }}
            />
          </Card>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <LinearGradient
                colors={['rgba(255, 71, 87, 0.1)', 'rgba(255, 71, 87, 0.05)']}
                style={styles.statGradient}
              >
                <Ionicons name="barbell" size={24} color={colors.primary} />
                <Text style={styles.statValue}>{workouts.length}</Text>
                <Text style={styles.statLabel}>Total Workouts</Text>
              </LinearGradient>
            </Card>
            
            <Card style={styles.statCard}>
              <LinearGradient
                colors={['rgba(99, 102, 241, 0.1)', 'rgba(99, 102, 241, 0.05)']}
                style={styles.statGradient}
              >
                <Ionicons name="trending-up" size={24} color={colors.info} />
                <Text style={styles.statValue}>
                  {stats.totalVolume >= 1000 ? `${(stats.totalVolume / 1000).toFixed(1)}k` : stats.totalVolume}
                </Text>
                <Text style={styles.statLabel}>Weekly Volume</Text>
              </LinearGradient>
            </Card>
          </View>
        </View>

        {/* Upcoming Workout Suggestion */}
        <UpcomingWorkout />

        {/* Recent Activity */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Progress')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {stats.lastWorkout ? (
            <Card style={styles.activityCard}>
              <TouchableOpacity 
                style={styles.activityContent}
                onPress={() => navigation.navigate('Progress')}
              >
                <View style={styles.activityIcon}>
                  <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>
                    {stats.lastWorkout.muscleGroup?.replace('_', ' ').charAt(0).toUpperCase() + 
                     stats.lastWorkout.muscleGroup?.slice(1).replace('_', ' ')} Workout
                  </Text>
                  <Text style={styles.activitySubtitle}>
                    {new Date(stats.lastWorkout.date).toLocaleDateString()} • {stats.lastWorkout.totalVolume} lbs
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </Card>
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>💪</Text>
              <Text style={styles.emptyTitle}>No workouts yet</Text>
              <Text style={styles.emptyText}>
                Start your first workout to see your activity here
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={startNewSession}>
                <Text style={styles.emptyButtonText}>Start Now</Text>
              </TouchableOpacity>
            </Card>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  greeting: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  username: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  notificationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 22,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  profileGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quoteCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  quoteGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  quoteText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
    fontStyle: 'italic',
  },
  todaySection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  todayCard: {
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
  },
  todayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  todayLeft: {
    position: 'relative',
    marginRight: spacing.xl,
  },
  progressCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  todayRight: {
    flex: 1,
    gap: spacing.md,
  },
  todayStat: {
    gap: spacing.xs,
  },
  todayStatValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  todayStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fireEmoji: {
    fontSize: 16,
  },
  startTodayButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startTodayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  startTodayText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  quickAction: {
    width: (width - spacing.xl * 2 - spacing.md * 3) / 4,
    aspectRatio: 1,
  },
  quickActionGradient: {
    flex: 1,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  quickActionTitle: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  quickActionBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  quickActionBadgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontSize: 10,
  },
  chartSection: {
    marginBottom: spacing.xl,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  chartSubtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  chartCard: {
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    overflow: 'hidden',
  },
  statGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  statValue: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  upcomingCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    padding: spacing.xl,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  upcomingTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  upcomingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingIcon: {
    fontSize: 32,
    marginRight: spacing.lg,
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingMuscle: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  upcomingTime: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  recentSection: {
    marginBottom: spacing.xl,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  viewAllText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  activityCard: {
    marginHorizontal: spacing.xl,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
  },
  activityIcon: {
    marginRight: spacing.lg,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  activitySubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  emptyCard: {
    marginHorizontal: spacing.xl,
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  emptyButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});

export default DashboardScreen;