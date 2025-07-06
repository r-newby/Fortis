import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../components/common/Card';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../supabase';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { clearAllData, workouts, personalRecords } = useApp();
  const [notifications, setNotifications] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [autoRestTimer, setAutoRestTimer] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);


  const { userProfile } = useApp();


  const [userStats, setUserStats] = useState({
    totalWorkouts: 0,
    totalVolume: 0,
    currentStreak: 0,
    favoriteTime: 'Morning',
    memberSince: userProfile?.created_at
  ? new Date(userProfile.created_at).toLocaleDateString()
  : new Date().toLocaleDateString(),

    level: 1,
    experience: 0,
  });

  useEffect(() => {
    calculateUserStats();
  }, [workouts, userProfile]);

  const calculateUserStats = () => {
    const totalWorkouts = workouts.length;
    const totalVolume = workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);

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

    const level = Math.floor(totalWorkouts / 10) + 1;
    const experience = (totalWorkouts % 10) * 10;

    setUserStats({
      totalWorkouts,
      totalVolume,
      currentStreak: streak,
      favoriteTime: 'Morning',
      memberSince: userProfile?.created_at
  ? new Date(userProfile.created_at).toLocaleDateString()
  : new Date().toLocaleDateString(),
      level,
      experience,
    });
  };

  const getFitnessLevelText = () => {
    if (!userProfile?.fitnessLevel) return 'Beginner';
    const level = userProfile.fitnessLevel;
    return `${level.charAt(0).toUpperCase()}${level.slice(1)}`;
  };

  const profileItems = [
  {
    id: 'username',
    title: 'Username',
    icon: 'person-outline',
    value: userProfile?.username || 'User',
    onPress: () => navigation.navigate('Username'), // or another screen
  },
  {
    id: 'fitness-level',
    title: 'Fitness Level',
    icon: 'barbell-outline',
    value: getFitnessLevelText(),
    onPress: () => {}, // maybe open a modal or another screen
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
          <TouchableOpacity style={styles.settingsButton}>
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
              <Text style={styles.profileLevel}>{getFitnessLevelText()} • Level {userStats.level}</Text>
              
              {/* Progress Bar */}
              <View style={styles.experienceContainer}>
                <View style={styles.experienceBar}>
                  <View style={[styles.experienceFill, { width: `${userStats.experience}%` }]} />
                </View>
                <Text style={styles.experienceText}>{userStats.experience}% to Level {userStats.level + 1}</Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userStats.totalWorkouts}</Text>
                <Text style={styles.statLabel}>Workouts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userStats.currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Object.keys(personalRecords).length}</Text>
                <Text style={styles.statLabel}>PRs</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Achievement Badges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
            {[
              { id: '1', icon: '🔥', name: 'First Workout', unlocked: true },
              { id: '2', icon: '💪', name: '7 Day Streak', unlocked: userStats.currentStreak >= 7 },
              { id: '3', icon: '🏆', name: '10 PRs', unlocked: Object.keys(personalRecords).length >= 10 },
              { id: '4', icon: '👑', name: 'Volume King', unlocked: userStats.totalVolume > 100000 },
              { id: '5', icon: '🎯', name: 'Goal Crusher', unlocked: false },
            ].map((badge) => (
              <View 
                key={badge.id} 
                style={[styles.badge, !badge.unlocked && styles.badgeLocked]}
              >
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
                {!badge.unlocked && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={20} color={colors.textTertiary} />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Profile Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          {profileItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.listItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.listItemLeft}>
                <Ionicons name={item.icon} size={24} color={colors.textSecondary} />
                <Text style={styles.listItemTitle}>{item.title}</Text>
              </View>
              <View style={styles.listItemRight}>
                {item.value && (
                  <Text style={styles.listItemValue}>{item.value}</Text>
                )}
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
     

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Member since {userStats.memberSince}</Text>
          <Text style={styles.versionText}>FORTIS v1.0</Text>
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
  title: {
    ...typography.displayMedium,
    color: colors.textPrimary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
  profileSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileGradient: {
    padding: spacing.xxl,
  },
  profileContent: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    borderColor: colors.background,
  },
  profileName: {
    ...typography.h1,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  profileLevel: {
    ...typography.bodyLarge,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.lg,
  },
  experienceContainer: {
    width: '100%',
    alignItems: 'center',
  },
  experienceBar: {
    width: '80%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  experienceFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  experienceText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...typography.h1,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  section: {
    marginBottom: spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  viewAllText: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  badgesScroll: {
    paddingHorizontal: spacing.xl,
  },
  badge: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    marginRight: spacing.md,
    minWidth: 100,
    position: 'relative',
  },
  badgeLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  badgeName: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemTitle: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    marginLeft: spacing.lg,
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemValue: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  dangerText: {
    ...typography.bodyLarge,
    color: colors.error,
    marginLeft: spacing.lg,
  },
  signOutButton: {
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  signOutText: {
    ...typography.bodyLarge,
    color: colors.error,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
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
});

export default ProfileScreen;