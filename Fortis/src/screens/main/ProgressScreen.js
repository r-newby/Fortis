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
  const [selectedMetric, setSelectedMetric] = useState('workouts');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPR, setSelectedPR] = useState(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  
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

  const timePeriods = [
    { id: 'week', label: 'Last 7 Days', days: 7 },
    { id: 'month', label: 'Last 30 Days', days: 30 },
    { id: 'quarter', label: 'Last 3 Months', days: 90 },
    { id: 'semester', label: 'Last 6 Months', days: 180 },
    { id: 'year', label: 'Last Year', days: 365 },
  ];

  const metrics = [
    { id: 'workouts', label: 'Workouts', icon: 'calendar', unit: 'count' },
    { id: 'volume', label: 'Volume', icon: 'barbell', unit: 'lbs' },
    { id: 'intensity', label: 'Intensity', icon: 'trending-up', unit: '/5' },
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

    console.log('Progress Screen Debug:');
    console.log('Selected period:', selectedPeriod, 'days:', periodDays);
    console.log('Total workouts:', workouts.length);
    console.log('Filtered workouts:', filteredWorkouts.length);
    console.log('Workout dates:', workouts.map(w => ({ date: w.date, volume: w.total_volume || w.totalVolume })));

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

    // Calculate total volume - use existing data structure
    const totalVolume = filteredWorkouts.reduce((sum, workout) => {
      return sum + (workout.total_volume || workout.totalVolume || 0);
    }, 0);

    // Calculate average workout time (duration)
    const totalTime = filteredWorkouts.reduce((sum, workout) => {
      return sum + (workout.duration || 0);
    }, 0);
    const avgTime = Math.round(totalTime / filteredWorkouts.length / 60);

    // Calculate muscle group distribution - use muscle_group field
    const muscleGroupCount = {};
    filteredWorkouts.forEach(workout => {
      const group = workout.muscle_group || 'other';
      muscleGroupCount[group] = (muscleGroupCount[group] || 0) + 1;
    });

    // Calculate average intensity
    const avgIntensity = filteredWorkouts.reduce((sum, workout) => {
      return sum + (workout.intensity || 3);
    }, 0) / filteredWorkouts.length;

    // Calculate completion rate
    const completionRate = filteredWorkouts.reduce((sum, workout) => {
      return sum + (workout.completion_percentage || 100);
    }, 0) / filteredWorkouts.length;

    // Calculate progress vs previous period
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

    // Calculate streak
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

  const calculateWorkoutStreak = () => {
    if (workouts.length === 0) return 0;
    
    const sortedWorkouts = workouts.sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    // Check if there's a workout today, if not start from yesterday
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

  const getFavoriteExercise = (muscleGroupCount) => {
    const muscleGroups = Object.entries(muscleGroupCount);
    if (muscleGroups.length === 0) return 'None yet';
    
    const favorite = muscleGroups.sort((a, b) => b[1] - a[1])[0];
    return favorite[0].charAt(0).toUpperCase() + favorite[0].slice(1);
  };

  const calculateAchievements = () => {
    const achievements = [];
    const now = new Date();
    
    // Get workouts for different time periods
    const weeklyWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return workoutDate >= weekAgo;
    });
    
    const monthlyWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return workoutDate >= monthAgo;
    });

    // 1. Current Streak - Always show
    achievements.push({
      icon: 'flame',
      title: `${stats.streak} Day Streak`,
      subtitle: stats.streak > 0 ? 'Keep It Up!' : 'Start today',
      color: colors.warning
    });

    // 2. Getting Started - First workout milestone
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

    // 3. Volume achievements - Lower thresholds
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

    // 4. Weekly achievements - More attainable
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

    // 5. Personal Records
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

    // 6. Intensity achievements
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

    // 7. Muscle group variety
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

    // 8. Progress achievements
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

    return achievements.slice(0, 6); // Show max 6 achievements
  };

  const getChartData = () => {
    const periodDays = timePeriods.find(p => p.id === selectedPeriod).days;
    
    // Dynamic data points based on period
    let dataPoints, groupBy, labelFormat;
    
    if (periodDays <= 7) {
      // Last 7 days - show each day
      dataPoints = 7;
      groupBy = 'day';
      labelFormat = (date) => date.getDate().toString();
    } else if (periodDays <= 30) {
      // Last 30 days - show each week
      dataPoints = 4;
      groupBy = 'week';
      labelFormat = (date, weekNum) => `W${weekNum}`;
    } else if (periodDays <= 90) {
      // Last 3 months - show each month
      dataPoints = 3;
      groupBy = 'month';
      labelFormat = (date) => date.toLocaleDateString('en', { month: 'short' });
    } else if (periodDays <= 180) {
      // Last 6 months - show each month
      dataPoints = 6;
      groupBy = 'month';
      labelFormat = (date) => date.toLocaleDateString('en', { month: 'short' });
    } else {
      // Last year - show each month
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
        // Each day for the last 7 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - (dataPoints - 1 - i));
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        startDate.setHours(0, 0, 0, 0);
        label = labelFormat(startDate);
      } else if (groupBy === 'week') {
        // Each week for the last month (W1 = oldest week, W4 = current week)
        const weeksBack = dataPoints - 1 - i;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - (weeksBack * 7 + 6)); // Start of week
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // End of week
        label = `W${i + 1}`; // W1 for oldest, W4 for most recent
      } else if (groupBy === 'month') {
        // Each month
        const monthsBack = dataPoints - 1 - i;
        startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        label = labelFormat(startDate);
      }
      
      // Filter workouts for this period
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

  const getMuscleGroupChartData = () => {
    const groups = Object.entries(stats.muscleGroupDistribution);
    if (groups.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [1] }],
      };
    }

    // Sort by count and take top 5
    const topGroups = groups
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      labels: topGroups.map(([group]) => 
        group.charAt(0).toUpperCase() + group.slice(1).replace('_', ' ')
      ),
      datasets: [{
        data: topGroups.map(([, count]) => count),
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
        `📊 ${timePeriods.find(p => p.id === selectedPeriod)?.label} Stats:\n` +
        `💪 Workouts: ${stats.totalWorkouts}\n` +
        `📈 Total Volume: ${formatVolume(stats.totalVolume)} lbs\n` +
        `🔥 Streak: ${stats.streak} days\n` +
        `⚡ Avg Intensity: ${stats.avgIntensity}/5\n` +
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

        {/* Key Stats - Unified Card */}
        <Card style={styles.primaryStatCard}>
          <View style={styles.mainStatContainer}>
            <Text style={styles.primaryStatValue}>{stats.totalWorkouts}</Text>
            <Text style={styles.primaryStatLabel}>Workouts Completed - {timePeriods.find(p => p.id === selectedPeriod)?.label}</Text>
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

        {/* Personal Records - Horizontal List */}
        <View style={styles.prSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Records</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {Object.keys(personalRecords).length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.prList}>
                {Object.entries(personalRecords).slice(0, 6).map(([exerciseId, record]) => (
                  <TouchableOpacity
                    key={exerciseId}
                    style={styles.prItem}
                    onPress={() => {
                      setSelectedPR({ ...record, exerciseName: exerciseId });
                      setShowDetailModal(true);
                    }}
                  >
                    <View style={styles.prIconSmall}>
                      <Ionicons name="trophy" size={16} color={colors.primary} />
                    </View>
                    <View style={styles.prInfo}>
                      <Text style={styles.prExerciseSmall} numberOfLines={1}>
                        {exerciseId.replace(/_/g, ' ').charAt(0).toUpperCase() + 
                         exerciseId.slice(1).replace(/_/g, ' ')}
                      </Text>
                      <Text style={styles.prValueSmall}>{record.weight} × {record.reps}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
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

        {/* Muscle Group Distribution - Only if sufficient data */}
        {Object.keys(stats.muscleGroupDistribution).length > 1 && (
          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>Muscle Group Focus</Text>
            <BarChart
              data={getMuscleGroupChartData()}
              width={width - spacing.xl * 4}
              height={160}
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(139, 148, 158, ${opacity})`,
                barPercentage: 0.6,
              }}
              style={styles.chart}
              showValuesOnTopOfBars
            />
          </Card>
        )}

        {/* Achievements */}
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
    height: 35, // Match the periodSelector height
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
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressChange: {
    ...typography.h3,
    color: colors.success,
    fontWeight: 'bold',
  },
  progressNegative: {
    color: colors.error,
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
  comparisonCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  comparisonTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  comparisonText: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  comparisonSubtext: {
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
    minWidth: 140,
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