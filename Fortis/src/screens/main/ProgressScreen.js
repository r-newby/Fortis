// src/screens/main/ProgressScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
  Modal,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../components/common/Card';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');

const ProgressScreen = () => {
  const { personalRecords, workouts, userProfile } = useApp();
  
  // State for time period selection
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('volume');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPR, setSelectedPR] = useState(null);
  
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalVolume: 0,
    avgWorkoutTime: 0,
    favoriteExercise: '',
    weeklyProgress: 0,
    muscleGroupDistribution: {},
  });

  const timePeriods = [
    { id: 'week', label: 'Week', days: 7 },
    { id: 'month', label: 'Month', days: 30 },
    { id: 'quarter', label: '3 Months', days: 90 },
    { id: 'year', label: 'Year', days: 365 },
  ];

  const metrics = [
    { id: 'volume', label: 'Volume', icon: 'barbell', unit: 'lbs' },
    { id: 'workouts', label: 'Workouts', icon: 'calendar', unit: 'count' },
    { id: 'duration', label: 'Duration', icon: 'time', unit: 'mins' },
    { id: 'strength', label: 'Strength', icon: 'trending-up', unit: 'PR' },
  ];

  useEffect(() => {
    calculateStats();
  }, [workouts, selectedPeriod, selectedMetric]);

  const calculateStats = () => {
    const periodDays = timePeriods.find(p => p.id === selectedPeriod).days;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    const filteredWorkouts = workouts.filter(w => 
      new Date(w.date) >= cutoffDate
    );

    if (filteredWorkouts.length === 0) {
      setStats({
        totalWorkouts: 0,
        totalVolume: 0,
        avgWorkoutTime: 0,
        favoriteExercise: 'None yet',
        weeklyProgress: 0,
        muscleGroupDistribution: {},
      });
      return;
    }

    // Calculate total volume
    const totalVolume = filteredWorkouts.reduce((sum, workout) => {
      return sum + (workout.totalVolume || 0);
    }, 0);

    // Calculate average workout time
    const totalTime = filteredWorkouts.reduce((sum, workout) => {
      return sum + (workout.duration || 0);
    }, 0);
    const avgTime = Math.round(totalTime / filteredWorkouts.length / 60);

    // Calculate muscle group distribution
    const muscleGroupCount = {};
    filteredWorkouts.forEach(workout => {
      const group = workout.muscleGroup || 'other';
      muscleGroupCount[group] = (muscleGroupCount[group] || 0) + 1;
    });

    // Find favorite exercise
    const exerciseCount = {};
    filteredWorkouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        const name = exercise.exerciseName || 'Unknown';
        exerciseCount[name] = (exerciseCount[name] || 0) + 1;
      });
    });

    const favoriteExercise = Object.keys(exerciseCount).length > 0
      ? Object.entries(exerciseCount).sort((a, b) => b[1] - a[1])[0][0]
      : 'None yet';

    // Calculate weekly progress
    const previousPeriodWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      const previousCutoff = new Date(cutoffDate);
      previousCutoff.setDate(previousCutoff.getDate() - periodDays);
      return workoutDate >= previousCutoff && workoutDate < cutoffDate;
    });

    const previousVolume = previousPeriodWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
    const weeklyProgress = previousVolume > 0 
      ? Math.round(((totalVolume - previousVolume) / previousVolume) * 100)
      : 0;

    setStats({
      totalWorkouts: filteredWorkouts.length,
      totalVolume,
      avgWorkoutTime: avgTime,
      favoriteExercise,
      weeklyProgress,
      muscleGroupDistribution: muscleGroupCount,
    });
  };

  const getChartData = () => {
    const periodDays = timePeriods.find(p => p.id === selectedPeriod).days;
    const dataPoints = Math.min(periodDays, 7); // Show max 7 data points
    
    const data = [];
    const labels = [];
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayWorkouts = workouts.filter(w => {
        const workoutDate = new Date(w.date);
        return workoutDate.toDateString() === date.toDateString();
      });

      let value = 0;
      switch (selectedMetric) {
        case 'volume':
          value = dayWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
          break;
        case 'workouts':
          value = dayWorkouts.length;
          break;
        case 'duration':
          value = dayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) / 60;
          break;
        case 'strength':
          // Count PRs on this day
          value = dayWorkouts.filter(w => w.hasNewPR).length;
          break;
      }

      data.push(value);
      labels.push(date.getDate().toString());
    }

    return {
      labels,
      datasets: [{
        data: data.length > 0 ? data : [0],
        strokeWidth: 2,
      }],
    };
  };

  const getMuscleGroupChartData = () => {
    const groups = Object.entries(stats.muscleGroupDistribution);
    if (groups.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [1] }],
      };
    }

    return {
      labels: groups.map(([group]) => 
        group.charAt(0).toUpperCase() + group.slice(1).replace('_', ' ')
      ),
      datasets: [{
        data: groups.map(([, count]) => count),
      }],
    };
  };

  const formatVolume = (volume) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
  };

  const handleShare = async () => {
    try {
      const message = `🎯 FORTIS Progress Update\n\n` +
        `📊 ${selectedPeriod === 'week' ? 'Weekly' : selectedPeriod === 'month' ? 'Monthly' : 'Quarterly'} Stats:\n` +
        `💪 Workouts: ${stats.totalWorkouts}\n` +
        `📈 Total Volume: ${formatVolume(stats.totalVolume)} lbs\n` +
        `⏱️ Avg Duration: ${stats.avgWorkoutTime} mins\n` +
        `🏆 Progress: ${stats.weeklyProgress > 0 ? '+' : ''}${stats.weeklyProgress}%\n\n` +
        `Keep pushing forward! 💪`;

      await Share.share({
        message,
        title: 'My Fitness Progress',
      });
    } catch (error) {
      console.error('Error sharing:', error);
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPR.exerciseName}</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.prDetailRow}>
                <Text style={styles.prDetailLabel}>Weight</Text>
                <Text style={styles.prDetailValue}>{selectedPR.weight} lbs</Text>
              </View>
              <View style={styles.prDetailRow}>
                <Text style={styles.prDetailLabel}>Reps</Text>
                <Text style={styles.prDetailValue}>{selectedPR.reps}</Text>
              </View>
              <View style={styles.prDetailRow}>
                <Text style={styles.prDetailLabel}>Total Volume</Text>
                <Text style={styles.prDetailValue}>{selectedPR.weight * selectedPR.reps} lbs</Text>
              </View>
              <View style={styles.prDetailRow}>
                <Text style={styles.prDetailLabel}>Date Set</Text>
                <Text style={styles.prDetailValue}>{new Date(selectedPR.date || Date.now()).toLocaleDateString()}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.sharePRButton} onPress={() => {
              Share.share({
                message: `🏆 New Personal Record!\n${selectedPR.exerciseName}: ${selectedPR.weight} lbs × ${selectedPR.reps} reps\n#FORTIS #PersonalRecord`,
              });
            }}>
              <Text style={styles.sharePRButtonText}>Share Achievement</Text>
              <Ionicons name="share-social" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Progress</Text>
            <Text style={styles.subtitle}>Track your fitness journey</Text>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Time Period Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.periodSelector}
          contentContainerStyle={styles.periodSelectorContent}
        >
          {timePeriods.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                selectedPeriod === period.id && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.id && styles.periodButtonTextActive
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, styles.statCardLarge]}>
            <View style={styles.statCardHeader}>
              <Ionicons name="trending-up" size={24} color={colors.primary} />
              <Text style={[
                styles.progressPercentage,
                stats.weeklyProgress < 0 && styles.progressNegative
              ]}>
                {stats.weeklyProgress > 0 ? '+' : ''}{stats.weeklyProgress}%
              </Text>
            </View>
            <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Total Workouts</Text>
          </Card>
          
          <View style={styles.statCardColumn}>
            <Card style={styles.statCardSmall}>
              <Text style={styles.statValueSmall}>{formatVolume(stats.totalVolume)}</Text>
              <Text style={styles.statLabelSmall}>Volume (lbs)</Text>
            </Card>
            <Card style={styles.statCardSmall}>
              <Text style={styles.statValueSmall}>{stats.avgWorkoutTime}</Text>
              <Text style={styles.statLabelSmall}>Avg Minutes</Text>
            </Card>
          </View>
        </View>

        {/* Metric Selector */}
        <View style={styles.metricSection}>
          <Text style={styles.sectionTitle}>Metrics</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.metricSelector}
          >
            {metrics.map((metric) => (
              <TouchableOpacity
                key={metric.id}
                style={[
                  styles.metricCard,
                  selectedMetric === metric.id && styles.metricCardActive
                ]}
                onPress={() => setSelectedMetric(metric.id)}
              >
                <LinearGradient
                  colors={selectedMetric === metric.id 
                    ? colors.gradientPrimary 
                    : [colors.surface, colors.surface]
                  }
                  style={styles.metricGradient}
                >
                  <Ionicons 
                    name={metric.icon} 
                    size={24} 
                    color={selectedMetric === metric.id ? '#FFFFFF' : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.metricLabel,
                    selectedMetric === metric.id && styles.metricLabelActive
                  ]}>
                    {metric.label}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Progress Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            {metrics.find(m => m.id === selectedMetric)?.label} Progress
          </Text>
          <LineChart
            data={getChartData()}
            width={width - spacing.xl * 4}
            height={200}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 71, 87, ${opacity})`,
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

        {/* Muscle Group Distribution */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Muscle Group Distribution</Text>
          <BarChart
            data={getMuscleGroupChartData()}
            width={width - spacing.xl * 4}
            height={180}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(139, 148, 158, ${opacity})`,
              barPercentage: 0.7,
            }}
            style={{
              marginVertical: spacing.sm,
              borderRadius: 16,
            }}
            showValuesOnTopOfBars
          />
        </Card>

        {/* Personal Records */}
        <View style={styles.prSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Records</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {Object.keys(personalRecords).length > 0 ? (
            <View style={styles.prGrid}>
              {Object.entries(personalRecords).slice(0, 4).map(([exerciseId, record]) => (
                <TouchableOpacity
                  key={exerciseId}
                  style={styles.prCard}
                  onPress={() => {
                    setSelectedPR({ ...record, exerciseName: exerciseId });
                    setShowDetailModal(true);
                  }}
                >
                  <LinearGradient
                    colors={colors.gradientPrimary}
                    style={styles.prGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.prIcon}>
                      <Ionicons name="trophy" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.prExercise} numberOfLines={1}>
                      {exerciseId.replace(/_/g, ' ').charAt(0).toUpperCase() + 
                       exerciseId.slice(1).replace(/_/g, ' ')}
                    </Text>
                    <View style={styles.prStats}>
                      <Text style={styles.prValue}>{record.weight} lbs</Text>
                      <Text style={styles.prReps}>× {record.reps}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyTitle}>No records yet</Text>
              <Text style={styles.emptyText}>
                Complete workouts to set your personal records
              </Text>
            </Card>
          )}
        </View>

        {/* Achievements Section */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Card style={styles.achievementCard}>
              <View style={styles.achievementIcon}>
                <Ionicons name="flame" size={32} color={colors.warning} />
              </View>
              <Text style={styles.achievementTitle}>7 Day Streak</Text>
              <Text style={styles.achievementDate}>Achieved Today</Text>
            </Card>
            
            <Card style={styles.achievementCard}>
              <View style={styles.achievementIcon}>
                <Ionicons name="barbell" size={32} color={colors.primary} />
              </View>
              <Text style={styles.achievementTitle}>10K lbs Lifted</Text>
              <Text style={styles.achievementDate}>This Week</Text>
            </Card>
            
            <Card style={styles.achievementCard}>
              <View style={styles.achievementIcon}>
                <Ionicons name="medal" size={32} color={colors.accent} />
              </View>
              <Text style={styles.achievementTitle}>PR Champion</Text>
              <Text style={styles.achievementDate}>3 New Records</Text>
            </Card>
          </ScrollView>
        </View>
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
  title: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  shareButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 22,
  },
  periodSelector: {
    height: 50,
    marginBottom: spacing.xl,
  },
  periodSelectorContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  periodButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  statCard: {
    padding: spacing.xl,
  },
  statCardLarge: {
    flex: 2,
  },
  statCardColumn: {
    flex: 1,
    gap: spacing.md,
  },
  statCardSmall: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressPercentage: {
    ...typography.bodyLarge,
    color: colors.success,
    fontWeight: 'bold',
  },
  progressNegative: {
    color: colors.error,
  },
  statValue: {
    ...typography.displaySmall,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statValueSmall: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  statLabelSmall: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metricSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  metricSelector: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  metricCard: {
    marginRight: spacing.md,
  },
  metricGradient: {
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 100,
  },
  metricCardActive: {
    transform: [{ scale: 1.05 }],
  },
  metricLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  metricLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chartCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    padding: spacing.xl,
  },
  chartTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  prSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
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
  prGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  prCard: {
    width: (width - spacing.xl * 2 - spacing.md) / 2,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
  },
  prGradient: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  prIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prExercise: {
    ...typography.bodyLarge,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  prStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  prValue: {
    ...typography.h3,
    color: '#FFFFFF',
  },
  prReps: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    marginLeft: spacing.xs,
    opacity: 0.9,
  },
  achievementsSection: {
    marginBottom: spacing.xl,
  },
  achievementCard: {
    marginLeft: spacing.xl,
    marginRight: spacing.md,
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: 150,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  achievementTitle: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  achievementDate: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xxl,
    width: '90%',
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
  },
  modalBody: {
    marginBottom: spacing.xl,
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
  sharePRButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    gap: spacing.sm,
  },
  sharePRButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});

export default ProgressScreen;