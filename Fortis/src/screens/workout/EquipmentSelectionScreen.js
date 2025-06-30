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

const equipmentOptions = [
  {
    id: 'dumbbells',
    name: 'Dumbbells',
    icon: '🏋️',
    description: 'Free weights',
  },
  {
    id: 'barbell',
    name: 'Barbell',
    icon: '🏋️‍♂️',
    description: 'Olympic bar',
  },
  {
    id: 'bodyweight',
    name: 'Bodyweight',
    icon: '💪',
    description: 'No equipment',
  },
  {
    id: 'resistance_bands',
    name: 'Bands',
    icon: '🎯',
    description: 'Resistance bands',
  },
  {
    id: 'kettlebell',
    name: 'Kettlebell',
    icon: '🔔',
    description: 'Kettlebells',
  },
  {
    id: 'pullup_bar',
    name: 'Pull-up Bar',
    icon: '🚪',
    description: 'Door/wall bar',
  },
  {
    id: 'bench',
    name: 'Bench',
    icon: '🪑',
    description: 'Flat/incline',
  },
  {
    id: 'cable',
    name: 'Cables',
    icon: '🔗',
    description: 'Cable machine',
  },
];

const EquipmentSelectionScreen = ({ navigation, route }) => {
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const { selectedEquipment: contextEquipment } = useWorkout();
  const preselectedMuscleGroup = route.params?.preselectedMuscleGroup;

  useEffect(() => {
    // Pre-select bodyweight by default
    setSelectedEquipment(['bodyweight']);
  }, []);

  const toggleEquipment = (equipmentId) => {
    setSelectedEquipment(prev => {
      if (prev.includes(equipmentId)) {
        // Don't allow deselecting if it's the only one selected
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

  const handleContinue = () => {
    if (selectedEquipment.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one equipment type.');
      return;
    }

    // Navigate to muscle group selection
    navigation.navigate('MuscleGroupSelection', {
      selectedEquipment,
      preselectedMuscleGroup,
    });
  };

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
        {/* Header */}
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

        {/* Selection Info */}
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>
            {selectedEquipment.length} selected • Tap to select multiple
          </Text>
        </View>

        {/* Equipment Grid */}
        <View style={styles.equipmentGrid}>
          {equipmentOptions.map((equipment) => (
            <EquipmentCard key={equipment.id} equipment={equipment} />
          ))}
        </View>

        {/* Quick Select Options */}
        <View style={styles.quickSelectSection}>
          <Text style={styles.quickSelectTitle}>Quick Select</Text>
          <View style={styles.quickSelectButtons}>
            <TouchableOpacity
              style={styles.quickSelectButton}
              onPress={() => setSelectedEquipment(['bodyweight'])}
            >
              <Text style={styles.quickSelectText}>Bodyweight Only</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickSelectButton}
              onPress={() => setSelectedEquipment(['dumbbells', 'bench'])}
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

        {/* Continue Button */}
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
    marginBottom: spacing.xxxl,
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
  },
  quickSelectText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
  },
});

export default EquipmentSelectionScreen;