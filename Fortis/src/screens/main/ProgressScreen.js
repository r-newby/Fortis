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
  Modal,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../components/common/Card';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');

const ProgressScreen = ({ navigation }) => {
  const { personalRecords, workouts, userProfile } = useApp();
  
  // Component state
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('workouts');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPR, setSelectedPR] = useState(null);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalVolume: 0,
    avgWorkoutTime: 0,
    favoriteExercise: '',
    weeklyProgress: 0,
    muscleGroupDistribution: {},
    streak: 0,
    avgIntensity: 0,
    completionRate: 0,
  });

  // Time period options for filtering
  const timePeriods = [
    { id: 'week', label: 'Last 7 Days', days: 7 },
    { id: 'month', label: 'Last 30 Days', days: 30 },
    { id: 'quarter', label: 'Last 3 Months', days: 90 },
    { id: 'semester', label: 'Last 6 Months', days: 180 },
    { id: 'year', label: 'Last Year', days: 365 },
  ];

  // Metric options for chart display
  const metrics = [
    { id: 'workouts', label: 'Workouts', icon: 'calendar', unit: 'count' },
    { id: 'volume', label: 'Volume', icon: 'barbell', unit: 'lbs' },
    { id: 'intensity', label: 'Intensity', icon: 'trending-up', unit: '/5' },
  ];

  // Recalculate stats when dependencies change
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
        streak: 0,
        avgIntensity: 0,
        completionRate: 0,
      });
      return;
    }

    // Calculate volume and time metrics
    const totalVolume = filteredWorkouts.reduce((sum, workout) => {
      return sum + (workout.total_volume || workout.totalVolume || 0);
    }, 0);

    const totalTime = filteredWorkouts.reduce((sum, workout) => {
      return sum + (workout.duration || 0);
    }, 0);
    const avgTime = Math.round(totalTime / filteredWorkouts.length / 60);

    // Build muscle group distribution
    const muscleGroupCount = {};
    filteredWorkouts.forEach(workout => {
      const group = workout.muscle_group || 'other';
      muscleGroupCount[group] = (muscleGroupCount[group] || 0) + 1;
    });

    // Calculate performance metrics
    const avgIntensity = filteredWorkouts.reduce((sum, workout) => {
      return sum + (workout.intensity || 3);
    }, 0) / filteredWorkouts.length;

    const completionRate = filteredWorkouts.reduce((sum, workout) => {
      return sum + (workout.completion_percentage || 100);
    }, 0) / filteredWorkouts.length;

    // Compare with previous period for progress tracking
    const previousPeriodWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      const previousCutoff = new Date(cutoffDate);
      previousCutoff.setDate(previousCutoff.getDate() - periodDays);
      return workoutDate >= previousCutoff && workoutDate < cutoffDate;
    });

    const previousVolume = previousPeriodWorkouts.reduce((sum, w) => 
      sum + (w.total_volume || w.totalVolume || 0), 0);
    const weeklyProgress = previousVolume > 0 
      ? Math.round(((totalVolume - previousVolume) / previousVolume) * 100)
      : 0;

    const streak = calculateWorkoutStreak();

    setStats({
      totalWorkouts: filteredWorkouts.length,
      totalVolume,
      avgWorkoutTime: avgTime,
      favoriteExercise: getFavoriteExercise(muscleGroupCount),
      weeklyProgress,
      muscleGroupDistribution: muscleGroupCount,
      streak,
      avgIntensity: Math.round(avgIntensity * 10) / 10,
      completionRate: Math.round(completionRate),
    });
  };

  // Calculate consecutive workout days
  const calculateWorkoutStreak = () => {
    if (workouts.length === 0) return 0;
    
    const sortedWorkouts = workouts.sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    const todayWorkout = workouts.some(w => {
      const workoutDate = new Date(w.date);
      return workoutDate.toDateString() === new Date().toDateString();
    });
    
    if (!todayWorkout) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.date);
      workoutDate.setHours(0, 0, 0, 0);
      
      if (workoutDate.getTime() === checkDate.getTime()) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (workoutDate.getTime() < checkDate.getTime()) {
        break;
      }
    }
    
    return streak;
  };

  // Find most frequently trained muscle group
  const getFavoriteExercise = (muscleGroupCount) => {
    const muscleGroups = Object.entries(muscleGroupCount);
    if (muscleGroups.length === 0) return 'None yet';
    
    const favorite = muscleGroups.sort((a, b) => b[1] - a[1])[0];
    return favorite[0].charAt(0).toUpperCase() + favorite[0].slice(1);
  };

  // Generate achievement badges based on user milestones
  const calculateAchievements = () => {
    const achievements = [];
    const now = new Date();
    
    const weeklyWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return workoutDate >= weekAgo;
    });

    // Current streak achievement
    achievements.push({
      icon: 'flame',
      title: `${stats.streak} Day Streak`,
      subtitle: stats.streak > 0 ? 'Keep It Up!' : 'Start today',
      color: colors.warning
    });

    // Workout milestone achievements
    if (workouts.length >= 1) {
      if (workouts.length >= 100) {
        achievements.push({
          icon: 'trophy',
          title: 'Century Club',
          subtitle: `${workouts.length} Workouts`,
          color: colors.accent
        });
      } else if (workouts.length >= 50) {
        achievements.push({
          icon: 'medal',
          title: 'Half Century',
          subtitle: `${workouts.length} Workouts`,
          color: colors.success
        });
      } else if (workouts.length >= 25) {
        achievements.push({
          icon: 'star',
          title: 'Quarter Century',
          subtitle: `${workouts.length} Workouts`,
          color: colors.info
        });
      } else if (workouts.length >= 10) {
        achievements.push({
          icon: 'fitness',
          title: 'Committed',
          subtitle: `${workouts.length} Workouts`,
          color: colors.primary
        });
      } else if (workouts.length >= 3) {
        achievements.push({
          icon: 'checkmark-circle',
          title: 'Building Habits',
          subtitle: `${workouts.length} Workouts`,
          color: colors.success
        });
      } else {
        achievements.push({
          icon: 'play-circle',
          title: 'First Steps',
          subtitle: `${workouts.length} Workout${workouts.length > 1 ? 's' : ''}`,
          color: colors.info
        });
      }
    }

    // Volume-based achievements
    const totalVolumeAllTime = workouts.reduce((sum, w) => 
      sum + (w.total_volume || w.totalVolume || 0), 0);
    
    if (totalVolumeAllTime >= 100000) {
      achievements.push({
        icon: 'barbell',
        title: 'Volume King',
        subtitle: `${formatVolume(totalVolumeAllTime)} lbs Total`,
        color: colors.primary
      });
    } else if (totalVolumeAllTime >= 50000) {
      achievements.push({
        icon: 'barbell',
        title: 'Heavy Lifter',
        subtitle: `${formatVolume(totalVolumeAllTime)} lbs Total`,
        color: colors.primary
      });
    } else if (totalVolumeAllTime >= 10000) {
      achievements.push({
        icon: 'barbell',
        title: 'Volume Veteran',
        subtitle: `${formatVolume(totalVolumeAllTime)} lbs Total`,
        color: colors.primary
      });
    } else if (totalVolumeAllTime >= 5000) {
      achievements.push({
        icon: 'barbell',
        title: 'Strong Start',
        subtitle: `${formatVolume(totalVolumeAllTime)} lbs Total`,
        color: colors.primary
      });
    } else if (totalVolumeAllTime >= 1000) {
      achievements.push({
        icon: 'barbell',
        title: 'Getting Strong',
        subtitle: `${formatVolume(totalVolumeAllTime)} lbs Total`,
        color: colors.primary
      });
    }

    // Weekly consistency achievements
    if (weeklyWorkouts.length >= 7) {
      achievements.push({
        icon: 'calendar',
        title: 'Perfect Week',
        subtitle: '7 Workouts This Week',
        color: colors.success
      });
    } else if (weeklyWorkouts.length >= 5) {
      achievements.push({
        icon: 'calendar',
        title: 'Strong Week',
        subtitle: `${weeklyWorkouts.length} Workouts This Week`,
        color: colors.success
      });
    } else if (weeklyWorkouts.length >= 3) {
      achievements.push({
        icon: 'calendar',
        title: 'Consistent',
        subtitle: `${weeklyWorkouts.length} Workouts This Week`,
        color: colors.success
      });
    }

    // Personal records achievements
    const prCount = Object.keys(personalRecords).length;
    if (prCount >= 20) {
      achievements.push({
        icon: 'trophy',
        title: 'PR Legend',
        subtitle: `${prCount} Personal Records`,
        color: colors.accent
      });
    } else if (prCount >= 10) {
      achievements.push({
        icon: 'trophy',
        title: 'PR Machine',
        subtitle: `${prCount} Personal Records`,
        color: colors.accent
      });
    } else if (prCount >= 5) {
      achievements.push({
        icon: 'medal',
        title: 'Record Setter',
        subtitle: `${prCount} Personal Records`,
        color: colors.primary
      });
    } else if (prCount >= 1) {
      achievements.push({
        icon: 'star',
        title: 'First PR',
        subtitle: `${prCount} Personal Record${prCount > 1 ? 's' : ''}`,
        color: colors.warning
      });
    }

    // Intensity achievements
    const avgIntensity = workouts.length > 0 
      ? workouts.reduce((sum, w) => sum + (w.intensity || 3), 0) / workouts.length 
      : 0;
    
    if (avgIntensity >= 4.5) {
      achievements.push({
        icon: 'flash',
        title: 'Intensity Beast',
        subtitle: `${avgIntensity.toFixed(1)}/5 Avg Intensity`,
        color: colors.warning
      });
    } else if (avgIntensity >= 4.0) {
      achievements.push({
        icon: 'flash',
        title: 'High Intensity',
        subtitle: `${avgIntensity.toFixed(1)}/5 Avg Intensity`,
        color: colors.warning
      });
    } else if (avgIntensity >= 3.5) {
      achievements.push({
        icon: 'trending-up',
        title: 'Pushing Hard',
        subtitle: `${avgIntensity.toFixed(1)}/5 Avg Intensity`,
        color: colors.info
      });
    }

    // Muscle group variety achievements
    const uniqueMuscleGroups = new Set(
      workouts.map(w => w.muscle_group).filter(Boolean)
    );
    
    if (uniqueMuscleGroups.size >= 6) {
      achievements.push({
        icon: 'body',
        title: 'Full Body Pro',
        subtitle: `${uniqueMuscleGroups.size} Muscle Groups`,
        color: colors.info
      });
    } else if (uniqueMuscleGroups.size >= 4) {
      achievements.push({
        icon: 'body',
        title: 'Well Rounded',
        subtitle: `${uniqueMuscleGroups.size} Muscle Groups`,
        color: colors.info
      });
    } else if (uniqueMuscleGroups.size >= 2) {
      achievements.push({
        icon: 'fitness',
        title: 'Exploring',
        subtitle: `${uniqueMuscleGroups.size} Muscle Groups`,
        color: colors.info
      });
    }

    // Progress achievements
    if (stats.weeklyProgress >= 50) {
      achievements.push({
        icon: 'trending-up',
        title: 'Strength Surge',
        subtitle: `+${stats.weeklyProgress}% Volume`,
        color: colors.success
      });
    } else if (stats.weeklyProgress >= 25) {
      achievements.push({
        icon: 'trending-up',
        title: 'Making Gains',
        subtitle: `+${stats.weeklyProgress}% Volume`,
        color: colors.success
      });
    } else if (stats.weeklyProgress >= 10) {
      achievements.push({
        icon: 'trending-up',
        title: 'Progressing',
        subtitle: `+${stats.weeklyProgress}% Volume`,
        color: colors.success
      });
    }

    return achievements.slice(0, 6);
  };

  // Prepare chart data based on selected period and metric
  const getChartData = () => {
    const periodDays = timePeriods.find(p => p.id === selectedPeriod).days;
    
    let dataPoints, groupBy, labelFormat;
    
    if (periodDays <= 7) {
      dataPoints = 7;
      groupBy = 'day';
      labelFormat = (date) => date.getDate().toString();
    } else if (periodDays <= 30) {
      dataPoints = 4;
      groupBy = 'week';
      labelFormat = (date, weekNum) => `W${weekNum}`;
    } else if (periodDays <= 90) {
      dataPoints = 3;
      groupBy = 'month';
      labelFormat = (date) => date.toLocaleDateString('en', { month: 'short' });
    } else if (periodDays <= 180) {
      dataPoints = 6;
      groupBy = 'month';
      labelFormat = (date) => date.toLocaleDateString('en', { month: 'short' });
    } else {
      dataPoints = 12;
      groupBy = 'month';
      labelFormat = (date) => date.toLocaleDateString('en', { month: 'short' });
    }
    
    const data = [];
    const labels = [];
    const now = new Date();
    
    for (let i = 0; i < dataPoints; i++) {
      let startDate, endDate, label;
      
      if (groupBy === 'day') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - (dataPoints - 1 - i));
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        startDate.setHours(0, 0, 0, 0);
        label = labelFormat(startDate);
      } else if (groupBy === 'week') {
        const weeksBack = dataPoints - 1 - i;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - (weeksBack * 7 + 6));
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        label = `W${i + 1}`;
      } else if (groupBy === 'month') {
        const monthsBack = dataPoints - 1 - i;
        startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        label = labelFormat(startDate);
      }
      
      const periodWorkouts = workouts.filter(w => {
        const workoutDate = new Date(w.date);
        return workoutDate >= startDate && workoutDate <= endDate;
      });

      let value = 0;
      switch (selectedMetric) {
        case 'volume':
          value = periodWorkouts.reduce((sum, w) => 
            sum + (w.total_volume || w.totalVolume || 0), 0);
          break;
        case 'workouts':
          value = periodWorkouts.length;
          break;
        case 'intensity':
          value = periodWorkouts.length > 0 
            ? periodWorkouts.reduce((sum, w) => sum + (w.intensity || 3), 0) / periodWorkouts.length
            : 0;
          break;
      }

      data.push(value);
      labels.push(label);
    }

    return {
      labels,
      datasets: [{
        data: data.length > 0 && data.some(d => d > 0) ? data : [0],
        strokeWidth: 3,
      }],
    };
  };

  // Format large numbers for display
  const formatVolume = (volume) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
  };

  // Modal component for PR details
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
                <Text style={styles.prDetailValue}>
                  {selectedPR.weight > 0 ? `${selectedPR.weight} lbs` : 'Bodyweight'}
                </Text>
              </View>
              <View style={styles.prDetailRow}>
                <Text style={styles.prDetailLabel}>Reps</Text>
                <Text style={styles.prDetailValue}>{selectedPR.reps}</Text>
              </View>
              <View style={styles.prDetailRow}>
                <Text style={styles.prDetailLabel}>Total Volume</Text>
                <Text style={styles.prDetailValue}>
                  {selectedPR.weight > 0 ? `${selectedPR.weight * selectedPR.reps} lbs` : 'N/A'}
                </Text>
              </View>
              <View style={styles.prDetailRow}>
                <Text style={styles.prDetailLabel}>Date Set</Text>
                <Text style={styles.prDetailValue}>
                  {new Date(selectedPR.date || Date.now()).toLocaleDateString()}
                </Text>
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
            <Text style={styles.subtitle}>Track Your Fitness Journey</Text>
          </View>
        </View>

        {/* Time Period Selector */}
        <View style={styles.periodSelectorContainer}>
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
          
          <LinearGradient
            colors={['transparent', '#0D1117']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scrollFade}
            pointerEvents="none"
          />
        </View>

        {/* Key Stats Summary */}
        <Card style={styles.primaryStatCard}>
          <View style={styles.mainStatContainer}>
            <Text style={styles.primaryStatValue}>{stats.totalWorkouts}</Text>
            <Text style={styles.primaryStatLabel}>
              Workouts Completed - {timePeriods.find(p => p.id === selectedPeriod)?.label}
            </Text>
          </View>
          
          <View style={styles.subStats}>
            <View style={styles.subStat}>
              <Text style={styles.subStatValue}>{formatVolume(stats.totalVolume)}</Text>
              <Text style={styles.subStatLabel}>lbs lifted</Text>
            </View>
            <View style={styles.subStat}>
              <Text style={styles.subStatValue}>{stats.streak}</Text>
              <Text style={styles.subStatLabel}>day streak</Text>
            </View>
            <View style={styles.subStat}>
              <Text style={styles.subStatValue}>{stats.avgIntensity}</Text>
              <Text style={styles.subStatLabel}>avg intensity</Text>
            </View>
          </View>
        </Card>

        {/* Metric Selector */}
        <View style={styles.metricSection}>
          <View style={styles.metricSelector}>
            {metrics.map((metric) => (
              <TouchableOpacity
                key={metric.id}
                style={[
                  styles.metricPill,
                  selectedMetric === metric.id && styles.metricPillActive
                ]}
                onPress={() => setSelectedMetric(metric.id)}
              >
                <Ionicons 
                  name={metric.icon} 
                  size={18} 
                  color={selectedMetric === metric.id ? '#FFFFFF' : colors.textSecondary} 
                />
                <Text style={[
                  styles.metricPillText,
                  selectedMetric === metric.id && styles.metricPillTextActive
                ]}>
                  {metric.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress Chart */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>
              {metrics.find(m => m.id === selectedMetric)?.label} Trend
            </Text>
            <Text style={styles.chartPeriod}>
              {timePeriods.find(p => p.id === selectedPeriod)?.label}
            </Text>
          </View>
          <LineChart
            data={getChartData()}
            width={width - spacing.xl * 4}
            height={200}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: selectedMetric === 'workouts' ? 0 : selectedMetric === 'intensity' ? 1 : 0,
              color: (opacity = 1) => `rgba(255, 71, 87, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(139, 148, 158, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: colors.primary,
                fill: colors.primary,
              },
            }}
            bezier
            style={styles.chart}
          />
        </Card>

        {/* Personal Records Section */}
        <View style={styles.prSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Records</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('PersonalRecords')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {Object.keys(personalRecords).length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.prList}>
                {Object.entries(personalRecords)
                  .sort((a, b) => {
                    // Sort by date (most recent first), then by volume
                    const dateA = new Date(a[1].date || 0);
                    const dateB = new Date(b[1].date || 0);
                    
                    if (dateA.getTime() !== dateB.getTime()) {
                      return dateB.getTime() - dateA.getTime();
                    }
                    
                    const volumeA = a[1].volume || (a[1].weight * a[1].reps) || 0;
                    const volumeB = b[1].volume || (b[1].weight * b[1].reps) || 0;
                    return volumeB - volumeA;
                  })
                  .slice(0, 6)
                  .map(([exerciseId, record], index) => (
                    <TouchableOpacity
                      key={exerciseId}
                      style={[styles.prItem, index === 0 && styles.prItemTop]}
                      onPress={() => {
                        setSelectedPR({ 
                          ...record, 
                          exerciseName: exerciseId.replace(/_/g, ' ')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')
                        });
                        setShowDetailModal(true);
                      }}
                    >
                      <View style={styles.prIconSmall}>
                        <Ionicons 
                          name={index === 0 ? "trophy" : "medal"} 
                          size={16} 
                          color={index === 0 ? colors.warning : colors.primary} 
                        />
                      </View>
                      <View style={styles.prInfo}>
                        <Text style={styles.prExerciseSmall} numberOfLines={1}>
                          {exerciseId.replace(/_/g, ' ')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')}
                        </Text>
                        <Text style={styles.prValueSmall}>
                          {record.weight > 0 ? `${record.weight} lbs × ` : ''}
                          {record.reps} {exerciseId.toLowerCase().includes('plank') && record.reps > 30 ? 'sec' : 'reps'}
                        </Text>
                        <Text style={styles.prDateSmall}>
                          {new Date(record.date || Date.now()).toLocaleDateString('en', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </Text>
                      </View>
                      {index === 0 && (
                        <View style={styles.prTopBadge}>
                          <Text style={styles.prTopBadgeText}>🔥</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
              </View>
            </ScrollView>
          ) : (
            <TouchableOpacity 
              style={styles.emptyCard}
              onPress={() => navigation.navigate('Workouts')}
            >
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyTitle}>No records yet</Text>
              <Text style={styles.emptyText}>
                Complete workouts to set your personal records
              </Text>
              <View style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>Start Your First Workout</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Achievements Section */}
        <View style={styles.achievementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
          </View>
          <View style={styles.achievementsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {calculateAchievements().map((achievement, index) => (
                <Card key={index} style={styles.achievementCard}>
                  <View style={[styles.achievementIcon, { backgroundColor: `${achievement.color}15` }]}>
                    <Ionicons name={achievement.icon} size={32} color={achievement.color} />
                  </View>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDate}>{achievement.subtitle}</Text>
                </Card>
              ))}
            </ScrollView>
            
            <LinearGradient
              colors={['transparent', '#0D1117']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.achievementsFade}
              pointerEvents="none"
            />
          </View>
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
    marginBottom: spacing.md,
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
  periodSelectorContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  scrollFade: {
    position: 'absolute',
    right: 0,
    top: 8,
    height: 35,
    width: 40,
    pointerEvents: 'none',
  },
  periodSelector: {
    height: 50,
  },
  periodSelectorContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  periodButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: spacing.xs,
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
  primaryStatCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.xl,
  },
  primaryStatValue: {
    ...typography.displayLarge,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  primaryStatLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  subStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    borderTopWidth: 0.5,
    borderTopColor: colors.primary,
  },
  subStat: {
    alignItems: 'center',
  },
  subStatValue: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metricSection: {
    marginBottom: spacing.lg,
  },
  metricSelector: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  metricPillActive: {
    backgroundColor: colors.primary,
  },
  metricPillText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  metricPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chartCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.xl,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  chartTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  chartPeriod: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: 16,
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
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  viewAllText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  prList: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  prItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    position: 'relative',
    minWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  prItemTop: {
    borderWidth: 1,
    borderColor: `${colors.warning}30`,
    shadowColor: colors.warning,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prInfo: {
    flex: 1,
  },
  prExerciseSmall: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  prValueSmall: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  prDateSmall: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  prTopBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
  prTopBadgeText: {
    fontSize: 12,
  },
  emptyCard: {
    marginHorizontal: spacing.xl,
    padding: spacing.xxxl,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 20,
    gap: spacing.xs,
  },
  emptyButtonText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
  },
  achievementsContainer: {
    position: 'relative',
  },
  achievementsFade: {
    position: 'absolute',
    right: 0,
    top: -2,
    bottom: 0,
    height: 165,
    width: 70,
    pointerEvents: 'none',
  },
  achievementsSection: {
    marginBottom: spacing.xl,
  },
  achievementCard: {
    marginLeft: spacing.xl,
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