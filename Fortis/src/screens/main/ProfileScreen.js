import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../components/common/Card';
import GradientButton from '../../components/common/GradientButton';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { 
    clearAllData, 
    workouts, 
    personalRecords, 
    userProfile, 
    user, 
    updateUserProfile, 
    reloadData 
  } = useApp();
  
  // Settings state (stored in AsyncStorage since no user_settings table)
  const [settings, setSettings] = useState({
    notifications: true,
    privateProfile: false,
    autoRestTimer: true,
    soundEffects: true,
  });

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingField, setEditingField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // User statistics state
  const [userStats, setUserStats] = useState({
    totalWorkouts: 0,
    totalVolume: 0,
    currentStreak: 0,
    favoriteExercise: 'None',
    favoriteTime: 'Morning',
    totalPRs: 0,
    averageIntensity: 0,
    completionRate: 0,
    memberSince: userProfile?.created_at 
      ? new Date(userProfile.created_at).toLocaleDateString()
      : new Date().toLocaleDateString(),
  });

  // Load settings and calculate stats on component mount
  useEffect(() => {
    loadLocalSettings();
    calculateUserStats();
  }, [workouts, personalRecords, userProfile]);

  // Load settings from AsyncStorage
  const loadLocalSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(`settings_${user?.id}`);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Save settings to AsyncStorage
  const saveLocalSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem(`settings_${user?.id}`, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  // Calculate user statistics from backend data
  const calculateUserStats = () => {
    if (!workouts || !Array.isArray(workouts)) {
      return;
    }

    console.log('📊 Calculating stats from:', workouts.length, 'workouts');

    const totalWorkouts = workouts.length;
    
    // Calculate total volume from Supabase data
    const totalVolume = workouts.reduce((sum, workout) => {
      return sum + (workout.total_volume || workout.totalVolume || 0);
    }, 0);
    
    const totalPRs = Object.keys(personalRecords || {}).length;
    
    // Calculate average intensity
    const avgIntensity = workouts.length > 0 
      ? workouts.reduce((sum, w) => sum + (w.intensity || w.average_intensity || 3), 0) / workouts.length 
      : 0;

    // Calculate completion rate
    const completionRate = workouts.length > 0
      ? workouts.reduce((sum, w) => sum + (w.completion_percentage || 100), 0) / workouts.length
      : 100;

    // Calculate current streak
    const currentStreak = calculateWorkoutStreak();

    // Find favorite exercise from workout data
    const favoriteExercise = findFavoriteExercise();

    const newStats = {
      totalWorkouts,
      totalVolume: Math.round(totalVolume),
      currentStreak,
      favoriteExercise,
      favoriteTime: 'Morning', // Could be calculated from workout times
      totalPRs,
      averageIntensity: Math.round(avgIntensity * 10) / 10,
      completionRate: Math.round(completionRate),
      memberSince: userProfile?.created_at 
        ? new Date(userProfile.created_at).toLocaleDateString()
        : new Date().toLocaleDateString(),
    };

    console.log('📊 Calculated stats:', newStats);
    setUserStats(newStats);
  };

  // Calculate workout streak using Supabase data
  const calculateWorkoutStreak = () => {
    if (!workouts || workouts.length === 0) return 0;

    // Sort workouts by date (most recent first)
    const sortedWorkouts = [...workouts]
      .filter(w => w.date) // Only workouts with dates
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sortedWorkouts.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let checkDate = new Date(today);

    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.date);
      workoutDate.setHours(0, 0, 0, 0);
      
      const diffTime = checkDate - workoutDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        streak++;
        checkDate = new Date(workoutDate);
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  // Find favorite exercise from Supabase workout data
  const findFavoriteExercise = () => {
    const exerciseCount = {};
    
    workouts.forEach(workout => {
      if (workout.workout_exercises) {
        workout.workout_exercises.forEach(ex => {
          if (ex.exercises?.name) {
            exerciseCount[ex.exercises.name] = (exerciseCount[ex.exercises.name] || 0) + 1;
          }
        });
      }
    });

    if (Object.keys(exerciseCount).length === 0) return 'None';
    
    return Object.keys(exerciseCount).reduce((a, b) => 
      exerciseCount[a] > exerciseCount[b] ? a : b
    );
  };

  // Get fitness level display text using backend data
  const getFitnessLevelText = () => {
    if (!userProfile?.fitness_level && !userProfile?.fitnessLevel) return 'Beginner';
    const level = userProfile.fitness_level || userProfile.fitnessLevel;
    return `${level.charAt(0).toUpperCase()}${level.slice(1)}`;
  };

  // Get goal display text using backend data
  const getGoalText = () => {
    if (!userProfile?.goal) return 'General Fitness';
    const goalMap = {
      'strength': 'Strength',
      'muscle': 'Muscle Gain',
      'endurance': 'Endurance'
    };
    return goalMap[userProfile.goal] || 'General Fitness';
  };

  // Handle profile field editing with backend update
  const handleEditField = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue || '');
    setShowEditModal(true);
  };

  // Save edited field to Supabase
  const saveEditedField = async () => {
    if (!editValue.trim()) {
      Alert.alert('Error', 'Please enter a valid value');
      return;
    }

    setIsLoading(true);
    
    const updateData = {};
    
    if (editingField === 'username') {
      updateData.username = editValue.trim();
    } else if (editingField === 'fitness_level') {
      updateData.fitness_level = editValue.toLowerCase();
    } else if (editingField === 'goal') {
      updateData.goal = editValue.toLowerCase();
    }

    console.log('🔄 Updating profile:', updateData);

    const success = await updateUserProfile(updateData);
    
    if (success) {
      setShowEditModal(false);
      await reloadData(); // Reload data from Supabase
      Alert.alert('Success', 'Profile updated successfully');
    } else {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
    
    setIsLoading(false);
  };

  // Handle setting toggle
  const handleSettingToggle = (setting, value) => {
    const newSettings = { ...settings, [setting]: value };
    saveLocalSettings(newSettings);
  };

  // Handle logout with Supabase
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 Logging out...');
              await supabase.auth.signOut();
              // Clear local settings
              await AsyncStorage.removeItem(`settings_${user?.id}`);
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle data clear (using existing clearAllData function)
  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all your workout data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            console.log('🗑️ Clearing all data...');
            const success = await clearAllData();
            if (success) {
              Alert.alert('Success', 'All data cleared successfully');
              // Reload to show empty state
              await reloadData();
            } else {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  // Navigate to Personal Records with data
  const handlePersonalRecords = () => {
    console.log('📈 Navigating to Personal Records with', Object.keys(personalRecords).length, 'PRs');
    navigation.navigate('PersonalRecords');
  };

  // Profile items configuration
  const profileItems = [
    {
      id: 'username',
      title: 'Username',
      icon: 'person-outline',
      value: userProfile?.username || 'User',
      onPress: () => handleEditField('username', userProfile?.username),
    },
    {
      id: 'fitness-level',
      title: 'Fitness Level',
      icon: 'barbell-outline',
      value: getFitnessLevelText(),
      onPress: () => handleEditField('fitness_level', userProfile?.fitness_level || userProfile?.fitnessLevel),
    },
    {
      id: 'goal',
      title: 'Fitness Goal',
      icon: 'flag-outline',
      value: getGoalText(),
      onPress: () => handleEditField('goal', userProfile?.goal),
    },
  ];

  // Settings items configuration
  const settingsItems = [
    {
      id: 'notifications',
      title: 'Push Notifications',
      icon: 'notifications-outline',
      value: settings.notifications,
      onToggle: (value) => handleSettingToggle('notifications', value),
    },
    {
      id: 'privateProfile',
      title: 'Private Profile',
      icon: 'lock-closed-outline',
      value: settings.privateProfile,
      onToggle: (value) => handleSettingToggle('privateProfile', value),
    },
    {
      id: 'autoRestTimer',
      title: 'Auto Rest Timer',
      icon: 'timer-outline',
      value: settings.autoRestTimer,
      onToggle: (value) => handleSettingToggle('autoRestTimer', value),
    },
    {
      id: 'soundEffects',
      title: 'Sound Effects',
      icon: 'volume-high-outline',
      value: settings.soundEffects,
      onToggle: (value) => handleSettingToggle('soundEffects', value),
    },
  ];

  const actionItems = [
    {
      id: 'personalRecords',
      title: 'Personal Records',
      icon: 'trophy-outline',
      onPress: handlePersonalRecords,
    },
    {
      id: 'clearData',
      title: 'Clear All Data',
      icon: 'trash-outline',
      onPress: handleClearData,
      danger: true,
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: 'log-out-outline',
      onPress: handleLogout,
      danger: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowSettingsModal(true)}
          >
            <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Profile Card with Gradient Background */}
        <View style={styles.profileSection}>
          <LinearGradient
            colors={colors.gradientDark}
            style={styles.profileGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.profileContent}>
              <TouchableOpacity style={styles.avatarContainer}>
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>
                    {userProfile?.username?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </LinearGradient>
                <View style={styles.editBadge}>
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              
              <Text style={styles.profileName}>{userProfile?.username || 'User'}</Text>
              <Text style={styles.profileSubtitle}>
                {getFitnessLevelText()} • {getGoalText()}
              </Text>
              <Text style={styles.memberSince}>
                Member since {userStats.memberSince}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{userStats.totalWorkouts}</Text>
                <Text style={styles.statLabel}>Workouts</Text>
              </View>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{userStats.totalVolume.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Volume (lbs)</Text>
              </View>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{userStats.currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{userStats.completionRate}%</Text>
                <Text style={styles.statLabel}>Completion Rate</Text>
              </View>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{userStats.totalPRs}</Text>
                <Text style={styles.statLabel}>Personal Records</Text>
              </View>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{userStats.averageIntensity}</Text>
                <Text style={styles.statLabel}>Avg Intensity</Text>
              </View>
            </Card>
          </View>
        </View>

        {/* Favorite Exercise */}
        {userStats.favoriteExercise !== 'None' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Favorites</Text>
            <Card style={styles.favoriteCard}>
              <View style={styles.favoriteContent}>
                <Ionicons name="heart" size={24} color={colors.error} />
                <View style={styles.favoriteText}>
                  <Text style={styles.favoriteTitle}>Favorite Exercise</Text>
                  <Text style={styles.favoriteValue}>{userStats.favoriteExercise}</Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Profile Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          {profileItems.map((item) => (
            <Card key={item.id} style={styles.listItem} onPress={item.onPress}>
              <View style={styles.listItemContent}>
                <View style={styles.listItemLeft}>
                  <Ionicons name={item.icon} size={24} color={colors.primary} />
                  <View style={styles.listItemText}>
                    <Text style={styles.listItemTitle}>{item.title}</Text>
                    <Text style={styles.listItemValue}>{item.value}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          ))}
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          {actionItems.map((item) => (
            <Card key={item.id} style={styles.listItem} onPress={item.onPress}>
              <View style={styles.listItemContent}>
                <View style={styles.listItemLeft}>
                  <Ionicons 
                    name={item.icon} 
                    size={24} 
                    color={item.danger ? colors.error : colors.primary} 
                  />
                  <Text style={[
                    styles.listItemTitle,
                    item.danger && { color: colors.error }
                  ]}>
                    {item.title}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>FORTIS Fitness Tracker</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit {editingField}</Text>
            <TouchableOpacity onPress={saveEditedField} disabled={isLoading}>
              <Text style={[styles.modalSave, isLoading && { opacity: 0.5 }]}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            {editingField === 'fitness_level' ? (
              <View>
                {['beginner', 'intermediate', 'advanced'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.optionButton,
                      editValue === level && styles.optionButtonSelected
                    ]}
                    onPress={() => setEditValue(level)}
                  >
                    <Text style={[
                      styles.optionText,
                      editValue === level && styles.optionTextSelected
                    ]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : editingField === 'goal' ? (
              <View>
                {['strength', 'muscle', 'endurance'].map((goal) => (
                  <TouchableOpacity
                    key={goal}
                    style={[
                      styles.optionButton,
                      editValue === goal && styles.optionButtonSelected
                    ]}
                    onPress={() => setEditValue(goal)}
                  >
                    <Text style={[
                      styles.optionText,
                      editValue === goal && styles.optionTextSelected
                    ]}>
                      {goal.charAt(0).toUpperCase() + goal.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TextInput
                style={styles.modalInput}
                value={editValue}
                onChangeText={setEditValue}
                placeholder={`Enter ${editingField}`}
                placeholderTextColor={colors.textTertiary}
                autoFocus
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={{ width: 60 }} />
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Text style={styles.modalSave}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {settingsItems.map((item) => (
              <View key={item.id} style={styles.settingItem}>
                <View style={styles.listItemLeft}>
                  <Ionicons name={item.icon} size={24} color={colors.primary} />
                  <Text style={styles.listItemTitle}>{item.title}</Text>
                </View>
                <Switch
                  value={item.value}
                  onValueChange={item.onToggle}
                  trackColor={{ false: colors.surface, true: colors.primary }}
                  thumbColor={item.value ? '#FFFFFF' : colors.textTertiary}
                />
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    ...typography.h1,
    color: colors.textPrimary,
  },
  settingsButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
  profileSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileGradient: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  profileContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.h1,
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileName: {
    ...typography.h1,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  profileSubtitle: {
    ...typography.bodyLarge,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.sm,
  },
  memberSince: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    width: (width - spacing.xl * 2 - spacing.md) / 2,
    padding: spacing.lg,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  favoriteCard: {
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
  },
  favoriteContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteText: {
    marginLeft: spacing.md,
  },
  favoriteTitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  favoriteValue: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  listItem: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    padding: spacing.lg,
  },
  listItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  listItemTitle: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  listItemValue: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  footerText: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  versionText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  modalCancel: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  modalSave: {
    ...typography.bodyLarge,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: spacing.xl,
  },
  modalInput: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionButton: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});

export default ProfileScreen;