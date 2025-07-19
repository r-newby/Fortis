// src/screens/__tests__/workout/EquipmentSelectionScreen.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import EquipmentSelectionScreen from '../../src/screens/workout/EquipmentSelectionScreen';

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock the WorkoutContext
jest.mock('../../src/context/WorkoutContext', () => ({
  useWorkout: () => ({
    selectedEquipment: [],
  }),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
};

const mockRoute = {
  params: {},
};

describe('EquipmentSelectionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all equipment options', () => {
    const { getByText } = render(
      <EquipmentSelectionScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    expect(getByText('Dumbbells')).toBeTruthy();
    expect(getByText('Barbell')).toBeTruthy();
    expect(getByText('Bodyweight')).toBeTruthy();
    expect(getByText('Cable Machine')).toBeTruthy();
    expect(getByText('Resistance Bands')).toBeTruthy();
    expect(getByText('Kettlebells')).toBeTruthy();
  });

  it('pre-selects bodyweight by default', () => {
    const { getByText } = render(
      <EquipmentSelectionScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );
    
    // Should show "1 selected" since bodyweight is pre-selected
    expect(getByText(/1 selected/)).toBeTruthy();
  });

  it('allows multiple equipment selection', () => {
    const { getByText } = render(
      <EquipmentSelectionScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    fireEvent.press(getByText('Dumbbells'));
    
    // Should now show "2 selected" (bodyweight + dumbbells)
    expect(getByText(/2 selected/)).toBeTruthy();
  });

  it('prevents deselecting all equipment', async () => {
    const { getByText } = render(
      <EquipmentSelectionScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    // Try to deselect the pre-selected bodyweight (only one selected)
    fireEvent.press(getByText('Bodyweight'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Selection Required',
        'Please select at least one equipment type.'
      );
    });
  });

  it('navigates to muscle group selection with selected equipment', () => {
    const { getByText } = render(
      <EquipmentSelectionScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    fireEvent.press(getByText('Dumbbells')); // Add dumbbells
    fireEvent.press(getByText('Continue'));

    expect(mockNavigate).toHaveBeenCalledWith('MuscleGroupSelection', {
      selectedEquipment: ['body weight', 'dumbbell'],
    });
  });

  it('handles quick select options', () => {
    const { getByText } = render(
      <EquipmentSelectionScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    fireEvent.press(getByText('Home Gym'));
    
    // Should select dumbbells and barbell (2 items)
    expect(getByText(/2 selected/)).toBeTruthy();
  });

  it('handles pre-selected muscle group from navigation params (Quick Start flow)', () => {
    const routeWithPreselected = { 
      params: { preselectedMuscleGroup: 'chest' } 
    };
    
    const { getByText } = render(
      <EquipmentSelectionScreen 
        navigation={mockNavigation} 
        route={routeWithPreselected} 
      />
    );

    fireEvent.press(getByText('Continue'));

    // For Quick Start flow, should navigate to WorkoutGenerator instead of MuscleGroupSelection
    expect(mockNavigate).toHaveBeenCalledWith('WorkoutGenerator', {
      selectedEquipment: ['body weight'],
      selectedMuscleGroup: 'chest',
    });
  });

  it('handles bodyweight only quick select', () => {
    const { getByText } = render(
      <EquipmentSelectionScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    // First add another equipment to test the reset
    fireEvent.press(getByText('Dumbbells'));
    expect(getByText(/2 selected/)).toBeTruthy();

    // Then use bodyweight only quick select
    fireEvent.press(getByText('Bodyweight Only'));
    
    // Should reset to only bodyweight (1 selected)
    expect(getByText(/1 selected/)).toBeTruthy();
  });

  it('handles full gym quick select', () => {
    const { getByText } = render(
      <EquipmentSelectionScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    fireEvent.press(getByText('Full Gym'));
    
    // Should select all 8 equipment types
    expect(getByText(/8 selected/)).toBeTruthy();
  });
});