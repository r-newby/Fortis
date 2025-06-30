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
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error fetching user:', userError);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setUserProfile(data);
      }
    };

    fetchUserProfile();
  }, []);

  const [userStats, setUserStats] = useState({
    totalWorkouts: 0,
    totalVolume: 0,
    currentStreak: 0,
    favoriteTime: 'Morning',
    memberSince: new Date().toLocaleDateString(),
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
      memberSince: userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
      level,
      experience,
    });
  };

  const getFitnessLevelText = () => {
    if (!userProfile?.fitnessLevel) return 'Beginner';
    const level = userProfile.fitnessLevel;
    return `${level.charAt(0).toUpperCase()}${level.slice(1)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Existing UI logic remains unchanged */}
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
  // ... rest of the styles remain unchanged
});

export default ProfileScreen;
