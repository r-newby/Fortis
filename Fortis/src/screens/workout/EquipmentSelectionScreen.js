// src/screens/workout/EquipmentSelectionScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import GradientButton from '../../components/common/GradientButton';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';
import { useWorkout } from '../../context/WorkoutContext';

// Available equipment types for workout generation
const equipmentOptions = [
  {
    id: 'dumbbell',
    name: 'Dumbbells',
    icon: '🏋️',
    description: 'Free weights',
  },
  {
    id: 'barbell',
    name: 'Barbell',
    icon: '🏋️‍♂️',
    description: 'Olympic/standard bar',
  },
  {
    id: 'body weight',
    name: 'Bodyweight',
    icon: '💪',
    description: 'No equipment needed',
  },
  {
    id: 'cable',
    name: 'Cable Machine',
    icon: '🔗',
    description: 'Cable/pulley system',
  },
  {
    id: 'resistance band',
    name: 'Resistance Bands',
    icon: '♾️',
    description: 'Elastic bands',
  },
  {
    id: 'kettlebell',
    name: 'Kettlebells',
    icon: '🔔',
    description: 'Bell-shaped weights',
  },
  {
    id: 'medicine ball',
    name: 'Medicine Ball',
    icon: '⚽',
    description: 'Weighted ball',
  },
  {
    id: 'smith machine',
    name: 'Smith Machine',
    icon: '⚙️',
    description: 'Guided barbell system',
  },
];

const EquipmentSelectionScreen = ({ navigation, route }) => {
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const { selectedEquipment: contextEquipment } = useWorkout();
  const preselectedMuscleGroup = route.params?.preselectedMuscleGroup;

  // Set default equipment selection on component mount
  useEffect(() => {
    setSelectedEquipment(['body weight']);
  }, []);

  // Handle equipment selection/deselection with validation
  const toggleEquipment = (equipmentId) => {
    setSelectedEquipment(prev => {
      if (prev.includes(equipmentId)) {
        if (prev.length === 1) {
          Alert.alert('Selection Required', 'Please select at least one equipment type.');
          return prev;
        }
        return prev.filter(id => id !== equipmentId);
      } else {
        return [...prev, equipmentId];
      }
    });
  };

  // Navigation logic: skip muscle selection for Quick Start, normal flow for Smart Plan
  const handleContinue = () => {
    if (selectedEquipment.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one equipment type.');
      return;
    }

    if (preselectedMuscleGroup) {
      // Quick Start flow: skip muscle selection screen
      navigation.navigate('WorkoutGenerator', {
        selectedEquipment,
        selectedMuscleGroup: preselectedMuscleGroup,
      });
    } else {
      // Smart Plan flow: proceed to muscle selection
      navigation.navigate('MuscleGroupSelection', {
        selectedEquipment,
      });
    }
  };

  // Equipment card component with selection state
  const EquipmentCard = ({ equipment }) => {
    const isSelected = selectedEquipment.includes(equipment.id);

    return (
      <TouchableOpacity
        style={styles.equipmentCard}
        onPress={() => toggleEquipment(equipment.id)}
        activeOpacity={0.7}
      >
        <Card style={[
          styles.card,
          isSelected && styles.cardSelected,
        ]}>
          <View style={styles.cardContent}>
            <Text style={styles.equipmentIcon}>{equipment.icon}</Text>
            <Text style={styles.equipmentName}>{equipment.name}</Text>
            <Text style={styles.equipmentDescription}>{equipment.description}</Text>
            {isSelected && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back button and title */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>Select Equipment</Text>
            <Text style={styles.subtitle}>Choose what's available to you</Text>
          </View>
        </View>

        {/* Selection counter and instructions */}
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>
            {selectedEquipment.length} selected • Tap to select multiple
          </Text>
        </View>

        {/* Equipment selection grid */}
        <View style={styles.equipmentGrid}>
          {equipmentOptions.map((equipment) => (
            <EquipmentCard key={equipment.id} equipment={equipment} />
          ))}
        </View>

        {/* Quick selection presets for common setups */}
        <View style={styles.quickSelectSection}>
          <Text style={styles.quickSelectTitle}>Quick Select</Text>
          <View style={styles.quickSelectButtons}>
            <TouchableOpacity
              style={styles.quickSelectButton}
              onPress={() => setSelectedEquipment(['body weight'])}
            >
              <Text style={styles.quickSelectText}>Bodyweight Only</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickSelectButton}
              onPress={() => setSelectedEquipment(['dumbbell', 'barbell'])}
            >
              <Text style={styles.quickSelectText}>Home Gym</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickSelectButton}
              onPress={() => setSelectedEquipment(equipmentOptions.map(e => e.id))}
            >
              <Text style={styles.quickSelectText}>Full Gym</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Continue to next step */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title="Continue"
            onPress={handleContinue}
            disabled={selectedEquipment.length === 0}
          />
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
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -spacing.sm,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  selectionInfo: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  selectionText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  equipmentCard: {
    width: '47%',
  },
  card: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSecondary,
  },
  cardContent: {
    alignItems: 'center',
  },
  equipmentIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  equipmentName: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  equipmentDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  quickSelectSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  quickSelectTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  quickSelectButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickSelectButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  quickSelectText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
  },
});

export default EquipmentSelectionScreen;