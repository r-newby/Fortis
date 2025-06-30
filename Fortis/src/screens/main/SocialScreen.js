// src/screens/main/SocialScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  Modal,
  TextInput,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../components/common/Card';
import GradientButton from '../../components/common/GradientButton';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';
import { useApp } from '../../context/AppContext';

const SocialScreen = ({ navigation }) => {
  const { userProfile, workouts, personalRecords } = useApp();
  const [activeTab, setActiveTab] = useState('feed');
  const [refreshing, setRefreshing] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showShareProgressModal, setShowShareProgressModal] = useState(false);

  // Mock data for social features with like state
  const [friendActivity, setFriendActivity] = useState([
    {
      id: '1',
      username: 'JohnDoe',
      avatar: '👤',
      action: 'completed a workout',
      details: 'Chest Day - 12,500 lbs total volume',
      time: '2 hours ago',
      likes: 23,
      hasLiked: false,
    },
    {
      id: '2',
      username: 'SarahFit',
      avatar: '👩',
      action: 'set a new PR',
      details: 'Bench Press: 135 lbs × 8 reps',
      time: '4 hours ago',
      likes: 45,
      hasLiked: true,
      isPR: true,
    },
    {
      id: '3',
      username: 'MikeStrong',
      avatar: '💪',
      action: 'completed a challenge',
      details: '7-Day Workout Streak Challenge',
      time: '6 hours ago',
      likes: 67,
      hasLiked: false,
      isChallenge: true,
    },
  ]);

  // Mock users for search
  const [allUsers] = useState([
    { id: '1', username: 'JohnDoe', avatar: '👤', isFollowing: true },
    { id: '2', username: 'SarahFit', avatar: '👩', isFollowing: true },
    { id: '3', username: 'MikeStrong', avatar: '💪', isFollowing: false },
    { id: '4', username: 'FitGuru', avatar: '🏋️', isFollowing: false },
    { id: '5', username: 'GymRat', avatar: '🐀', isFollowing: false },
    { id: '6', username: 'IronLady', avatar: '🦾', isFollowing: false },
  ]);

  const [challenges] = useState([
    {
      id: '1',
      name: '30-Day Consistency',
      description: 'Work out every day for 30 days',
      participants: 245,
      daysLeft: 23,
      progress: 0.23,
      reward: '🏆 Elite Badge',
      difficulty: 'Medium',
    },
    {
      id: '2',
      name: 'Volume King',
      description: 'Lift 100,000 lbs total this month',
      participants: 189,
      daysLeft: 15,
      progress: 0.67,
      reward: '👑 Volume Crown',
      difficulty: 'Hard',
    },
    {
      id: '3',
      name: 'PR Hunter',
      description: 'Set 5 new personal records',
      participants: 412,
      daysLeft: 7,
      progress: 0.4,
      reward: '🎯 PR Master Badge',
      difficulty: 'Easy',
    },
  ]);

  const [leaderboard] = useState([
    {
      id: '1',
      rank: 1,
      username: 'FitLegend',
      avatar: '🥇',
      score: 2847,
      change: 'up',
    },
    {
      id: '2',
      rank: 2,
      username: 'IronWarrior',
      avatar: '🥈',
      score: 2654,
      change: 'up',
    },
    {
      id: '3',
      rank: 3,
      username: 'GymShark',
      avatar: '🥉',
      score: 2489,
      change: 'down',
    },
    {
      id: '4',
      rank: 15,
      username: userProfile?.username || 'You',
      avatar: '💪',
      score: 1876,
      change: 'up',
      isCurrentUser: true,
    },
  ]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const handleLike = (activityId) => {
    setFriendActivity(prev => 
      prev.map(item => 
        item.id === activityId 
          ? { 
              ...item, 
              hasLiked: !item.hasLiked, 
              likes: item.hasLiked ? item.likes - 1 : item.likes + 1 
            }
          : item
      )
    );
  };

  const handleShare = async (item) => {
    try {
      const message = `Check out @${item.username}'s progress on FORTIS! 💪\n\n${item.action} - ${item.details}\n\n#FORTIS #FitnessProgress`;
      
      await Share.share({
        message,
        title: 'Share Workout',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleShareProgress = async () => {
    try {
      const totalWorkouts = workouts.length;
      const totalPRs = Object.keys(personalRecords).length;
      const recentWorkout = workouts[workouts.length - 1];
      
      let message = `🎯 My FORTIS Progress Update!\n\n`;
      message += `💪 Total Workouts: ${totalWorkouts}\n`;
      message += `🏆 Personal Records: ${totalPRs}\n`;
      
      if (recentWorkout) {
        message += `📈 Last Workout: ${recentWorkout.muscleGroup?.replace('_', ' ').toUpperCase()} - ${recentWorkout.totalVolume} lbs\n`;
      }
      
      message += `\nJoin me on FORTIS to track your fitness journey! 💪\n#FORTIS #ProgressiveOverload #FitnessJourney`;

      await Share.share({
        message,
        title: 'My Fitness Progress',
      });
      
      setShowShareProgressModal(false);
    } catch (error) {
      console.error('Error sharing progress:', error);
    }
  };

  const handleJoinChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    setShowChallengeModal(true);
  };

  // Search Modal Component
  const SearchModal = () => {
    const filteredUsers = allUsers.filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <Modal
        visible={showSearchModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <SafeAreaView style={styles.modalFullScreen}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.searchTitle}>Search Users</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for users..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.userItem}>
                <View style={styles.userLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.avatar}</Text>
                  </View>
                  <Text style={styles.username}>{item.username}</Text>
                </View>
                <TouchableOpacity style={[
                  styles.followButton,
                  item.isFollowing && styles.followingButton
                ]}>
                  <Text style={[
                    styles.followButtonText,
                    item.isFollowing && styles.followingButtonText
                  ]}>
                    {item.isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>No users found</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    );
  };

  // Share Progress Modal
  const ShareProgressModal = () => {
    const stats = {
      totalWorkouts: workouts.length,
      totalVolume: workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0),
      totalPRs: Object.keys(personalRecords).length,
      currentStreak: 5, // Mock streak
    };

    return (
      <Modal
        visible={showShareProgressModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowShareProgressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.shareProgressContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Your Progress</Text>
              <TouchableOpacity onPress={() => setShowShareProgressModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.progressPreview}>
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.progressCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.progressCardTitle}>
                  {userProfile?.username || 'User'}'s Progress
                </Text>
                
                <View style={styles.progressStats}>
                  <View style={styles.progressStat}>
                    <Text style={styles.progressStatValue}>{stats.totalWorkouts}</Text>
                    <Text style={styles.progressStatLabel}>Workouts</Text>
                  </View>
                  <View style={styles.progressStatDivider} />
                  <View style={styles.progressStat}>
                    <Text style={styles.progressStatValue}>{stats.totalPRs}</Text>
                    <Text style={styles.progressStatLabel}>PRs</Text>
                  </View>
                  <View style={styles.progressStatDivider} />
                  <View style={styles.progressStat}>
                    <Text style={styles.progressStatValue}>{stats.currentStreak}</Text>
                    <Text style={styles.progressStatLabel}>Streak</Text>
                  </View>
                </View>

                <Text style={styles.progressTagline}>
                  Crushing goals with FORTIS! 💪
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.shareOptions}>
              <Text style={styles.shareOptionsTitle}>Share to:</Text>
              <View style={styles.shareButtons}>
                <TouchableOpacity 
                  style={styles.shareButton}
                  onPress={handleShareProgress}
                >
                  <Ionicons name="share-social" size={32} color={colors.primary} />
                  <Text style={styles.shareButtonLabel}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderFeedItem = ({ item }) => (
    <Card style={styles.feedCard}>
      <View style={styles.feedHeader}>
        <View style={styles.feedUserInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.avatar}</Text>
          </View>
          <View>
            <Text style={styles.feedUsername}>{item.username}</Text>
            <Text style={styles.feedTime}>{item.time}</Text>
          </View>
        </View>
        {item.isPR && (
          <View style={styles.prBadge}>
            <Text style={styles.prBadgeText}>PR 🏆</Text>
          </View>
        )}
      </View>

      <View style={styles.feedContent}>
        <Text style={styles.feedAction}>{item.action}</Text>
        <Text style={styles.feedDetails}>{item.details}</Text>
      </View>

      <View style={styles.feedActions}>
        <TouchableOpacity 
          style={styles.feedActionButton}
          onPress={() => handleLike(item.id)}
        >
          <Ionicons 
            name={item.hasLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={item.hasLiked ? colors.error : colors.textSecondary} 
          />
          <Text style={[
            styles.feedActionText,
            item.hasLiked && styles.likedText
          ]}>{item.likes}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.feedActionButton}
          onPress={() => handleShare(item)}
        >
          <Ionicons name="share-social-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.feedActionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderChallenge = ({ item }) => (
    <TouchableOpacity onPress={() => handleJoinChallenge(item)}>
      <Card style={styles.challengeCard}>
        <View style={styles.challengeHeader}>
          <View>
            <Text style={styles.challengeName}>{item.name}</Text>
            <Text style={styles.challengeDescription}>{item.description}</Text>
          </View>
          <View style={[styles.difficultyBadge, 
            item.difficulty === 'Easy' && styles.difficultyEasy,
            item.difficulty === 'Medium' && styles.difficultyMedium,
            item.difficulty === 'Hard' && styles.difficultyHard
          ]}>
            <Text style={styles.difficultyText}>{item.difficulty}</Text>
          </View>
        </View>

        <View style={styles.challengeProgress}>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${item.progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(item.progress * 100)}%</Text>
        </View>

        <View style={styles.challengeFooter}>
          <View style={styles.challengeStats}>
            <Ionicons name="people" size={16} color={colors.textSecondary} />
            <Text style={styles.challengeStatText}>{item.participants} joined</Text>
          </View>
          <View style={styles.challengeStats}>
            <Ionicons name="time" size={16} color={colors.textSecondary} />
            <Text style={styles.challengeStatText}>{item.daysLeft} days left</Text>
          </View>
        </View>

        <View style={styles.challengeReward}>
          <Text style={styles.rewardLabel}>Reward:</Text>
          <Text style={styles.rewardText}>{item.reward}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderLeaderboardItem = ({ item, index }) => (
    <Card style={[styles.leaderboardCard, item.isCurrentUser && styles.currentUserCard]}>
      <View style={styles.leaderboardLeft}>
        <Text style={[styles.rank, index < 3 && styles.topRank]}>#{item.rank}</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.avatar}</Text>
        </View>
        <View>
          <Text style={[styles.leaderboardUsername, item.isCurrentUser && styles.currentUsername]}>
            {item.username}
          </Text>
          <Text style={styles.scoreText}>{item.score.toLocaleString()} pts</Text>
        </View>
      </View>
      <View style={styles.changeIndicator}>
        <Ionicons 
          name={item.change === 'up' ? 'trending-up' : 'trending-down'} 
          size={20} 
          color={item.change === 'up' ? colors.success : colors.error} 
        />
      </View>
    </Card>
  );

  const ChallengeModal = () => (
    <Modal
      visible={showChallengeModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowChallengeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Join Challenge</Text>
            <TouchableOpacity onPress={() => setShowChallengeModal(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {selectedChallenge && (
            <>
              <View style={styles.modalBody}>
                <Text style={styles.challengeModalName}>{selectedChallenge.name}</Text>
                <Text style={styles.challengeModalDescription}>
                  {selectedChallenge.description}
                </Text>
                
                <View style={styles.challengeModalStats}>
                  <View style={styles.modalStat}>
                    <Ionicons name="people" size={24} color={colors.primary} />
                    <Text style={styles.modalStatValue}>{selectedChallenge.participants}</Text>
                    <Text style={styles.modalStatLabel}>Participants</Text>
                  </View>
                  <View style={styles.modalStat}>
                    <Ionicons name="calendar" size={24} color={colors.primary} />
                    <Text style={styles.modalStatValue}>{selectedChallenge.daysLeft}</Text>
                    <Text style={styles.modalStatLabel}>Days Left</Text>
                  </View>
                  <View style={styles.modalStat}>
                    <Ionicons name="trophy" size={24} color={colors.primary} />
                    <Text style={styles.modalStatValue}>1</Text>
                    <Text style={styles.modalStatLabel}>Reward</Text>
                  </View>
                </View>

                <View style={styles.challengeRules}>
                  <Text style={styles.rulesTitle}>Rules:</Text>
                  <Text style={styles.ruleItem}>• Complete daily requirements</Text>
                  <Text style={styles.ruleItem}>• Track progress automatically</Text>
                  <Text style={styles.ruleItem}>• Compete with community</Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <GradientButton
                  title="Join Challenge"
                  onPress={() => {
                    setShowChallengeModal(false);
                    Alert.alert('Success!', 'You have joined the challenge!');
                  }}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowSearchModal(true)}
          >
            <Ionicons name="search" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => Alert.alert('Coming Soon', 'Friend adding feature coming soon!')}
          >
            <Ionicons name="person-add" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
            Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'challenges' && styles.activeTab]}
          onPress={() => setActiveTab('challenges')}
        >
          <Text style={[styles.tabText, activeTab === 'challenges' && styles.activeTabText]}>
            Challenges
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
            Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'feed' && (
        <FlatList
          data={friendActivity}
          renderItem={renderFeedItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <TouchableOpacity 
              style={styles.shareCard}
              onPress={() => setShowShareProgressModal(true)}
            >
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.shareGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="add-circle" size={32} color="#FFFFFF" />
                <Text style={styles.shareText}>Share Your Progress</Text>
              </LinearGradient>
            </TouchableOpacity>
          }
        />
      )}

      {activeTab === 'challenges' && (
        <FlatList
          data={challenges}
          renderItem={renderChallenge}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View style={styles.challengesHeader}>
              <Card style={styles.myChallengesCard}>
                <Text style={styles.myChallengesTitle}>Active Challenges</Text>
                <View style={styles.activeChallenges}>
                  <View style={styles.activeChallengeBadge}>
                    <Text style={styles.activeChallengeEmoji}>🔥</Text>
                    <Text style={styles.activeChallengeText}>Streak: 5 days</Text>
                  </View>
                  <View style={styles.activeChallengeBadge}>
                    <Text style={styles.activeChallengeEmoji}>💪</Text>
                    <Text style={styles.activeChallengeText}>Volume: 67%</Text>
                  </View>
                </View>
              </Card>
            </View>
          }
        />
      )}

      {activeTab === 'leaderboard' && (
        <FlatList
          data={leaderboard}
          renderItem={renderLeaderboardItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View style={styles.leaderboardHeader}>
              <Card style={styles.periodSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {['Weekly', 'Monthly', 'All Time'].map((period) => (
                    <TouchableOpacity key={period} style={styles.periodButton}>
                      <Text style={styles.periodButtonText}>{period}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Card>
              <Text style={styles.leaderboardSubtitle}>
                Compete with the community and climb the ranks!
              </Text>
            </View>
          }
        />
      )}

      <SearchModal />
      <ShareProgressModal />
      <ChallengeModal />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.displayMedium,
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  shareCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    borderRadius: 16,
    overflow: 'hidden',
  },
  shareGradient: {
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  shareText: {
    ...typography.h3,
    color: '#FFFFFF',
  },
  feedCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.xl,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  feedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  feedUsername: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  feedTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  prBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  prBadgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  feedContent: {
    marginBottom: spacing.lg,
  },
  feedAction: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  feedDetails: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  feedActions: {
    flexDirection: 'row',
    gap: spacing.xxl,
  },
  feedActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  feedActionText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  likedText: {
    color: colors.error,
    fontWeight: '600',
  },
  // Search Modal Styles
  modalFullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyLarge,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  username: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  followButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  followingButtonText: {
    color: colors.textPrimary,
  },
  emptySearch: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  emptySearchText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  // Share Progress Modal Styles
  shareProgressContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  progressPreview: {
    marginVertical: spacing.xl,
  },
  progressCard: {
    padding: spacing.xxl,
    borderRadius: 16,
    alignItems: 'center',
  },
  progressCardTitle: {
    ...typography.h2,
    color: '#FFFFFF',
    marginBottom: spacing.xl,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.xl,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    ...typography.displaySmall,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  progressStatLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
  },
  progressStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressTagline: {
    ...typography.bodyLarge,
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  shareOptions: {
    marginTop: spacing.xl,
  },
  shareOptionsTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  shareButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  shareButton: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  shareButtonLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  // Rest of the styles remain the same...
  challengesHeader: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  myChallengesCard: {
    padding: spacing.xl,
  },
  myChallengesTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  activeChallenges: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  activeChallengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: spacing.sm,
  },
  activeChallengeEmoji: {
    fontSize: 16,
  },
  activeChallengeText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  challengeCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.xl,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  challengeName: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  challengeDescription: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  difficultyEasy: {
    backgroundColor: colors.success + '20',
  },
  difficultyMedium: {
    backgroundColor: colors.warning + '20',
  },
  difficultyHard: {
    backgroundColor: colors.error + '20',
  },
  difficultyText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  challengeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  challengeFooter: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  challengeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  challengeStatText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  challengeReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rewardLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  rewardText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
  },
  leaderboardHeader: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  periodSelector: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  periodButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
  },
  periodButtonText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  leaderboardSubtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  leaderboardCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rank: {
    ...typography.h3,
    color: colors.textSecondary,
    minWidth: 30,
  },
  topRank: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  leaderboardUsername: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  currentUsername: {
    color: colors.primary,
  },
  scoreText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  changeIndicator: {
    padding: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
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
  challengeModalName: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  challengeModalDescription: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  challengeModalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },
  modalStat: {
    alignItems: 'center',
  },
  modalStatValue: {
    ...typography.h2,
    color: colors.textPrimary,
    marginVertical: spacing.sm,
  },
  modalStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  challengeRules: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.lg,
    borderRadius: 12,
  },
  rulesTitle: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  ruleItem: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  modalActions: {
    gap: spacing.md,
  },
});

export default SocialScreen;