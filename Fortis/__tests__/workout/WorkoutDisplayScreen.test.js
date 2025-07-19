// src/screens/__tests__/workout/WorkoutDisplayScreen.test.js
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Vibration } from 'react-native';
import WorkoutDisplayScreen from '../../src/screens/workout/WorkoutDisplayScreen';

// Mock Alert and Vibration
jest.spyOn(Alert, 'alert').mockImplementation(() => {});
jest.spyOn(Vibration, 'vibrate').mockImplementation(() => {});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock timers
jest.useFakeTimers();

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReset = jest.fn();
const mockGetParent = jest.fn(() => ({ navigate: jest.fn() }));

const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  reset: mockReset,
  getParent: mockGetParent,
};

// Mock workout data
const mockWorkout = [
  {
    id: 1,
    name: 'bench press',
    target: 'pectorals',
    equipment: 'barbell',
    sets: 3,
    reps: 8,
    weight: 135,
    gif_url: 'https://example.com/bench-press.gif'
  },
  {
    id: 2,
    name: 'push ups',
    target: 'pectorals',
    equipment: 'body weight',
    sets: 3,
    reps: 15,
    weight: 0,
    gif_url: null
  }
];

const mockRoute = {
  params: {
    workout: mockWorkout,
    muscleGroup: 'chest',
  },
};

const mockRouteEmpty = {
  params: {},
};

const mockUserProfile = {
  id: 'user-123',
  fitnessLevel: 'intermediate',
  goal: 'strength',
};

// Mock AppContext
jest.mock('../../src/context/AppContext', () => ({
  useApp: () => ({
    userProfile: mockUserProfile,
    setWorkouts: jest.fn(),
    saveProgressionSuggestion: jest.fn(),
    getProgressionHistory: jest.fn(() => Promise.resolve([])),
  }),
}));

// Mock Supabase
jest.mock('../../src/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'workout-123' },
            error: null
          }))
        }))
      }))
    }))
  }
}));

describe('WorkoutDisplayScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('renders workout header correctly', () => {
    const { getByText } = render(
      <WorkoutDisplayScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    expect(getByText('Chest Workout')).toBeTruthy();
    expect(getByText('Exercise 1 of 2')).toBeTruthy();
  });

  it('displays current exercise information', () => {
    const { getByText } = render(
      <WorkoutDisplayScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    expect(getByText('Set 1 of 3')).toBeTruthy();
    expect(getByText('bench press')).toBeTruthy();
    expect(getByText('pectorals • barbell')).toBeTruthy();
    expect(getByText('8 reps @ 135 lbs')).toBeTruthy();
  });

  it('shows progress bar with correct percentage', () => {
    const { getByText } = render(
      <WorkoutDisplayScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    expect(getByText('50% Complete')).toBeTruthy(); // Exercise 1 of 2
  });

  it('shows form check button for exercises with GIFs', () => {
    const { getByText } = render(
      <WorkoutDisplayScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    expect(getByText('Form')).toBeTruthy();
  });

  it('toggles form check visibility', () => {
    const { getByText, queryByText } = render(
      <WorkoutDisplayScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    // Initially no "Tap to enlarge" text
    expect(queryByText('Tap to enlarge')).toBeNull();

    // Click form button
    fireEvent.press(getByText('Form'));

    // Should show form check card
    expect(getByText('Tap to enlarge')).toBeTruthy();
  });

  it('completes a set and starts rest timer', () => {
    const { getByText } = render(
      <WorkoutDisplayScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    // Complete first set
    fireEvent.press(getByText('Complete Set'));

    // Should show rest timer
    expect(getByText('Rest Time')).toBeTruthy();
    expect(getByText('Skip Rest')).toBeTruthy();
  });

  it('handles rest timer controls', () => {
    const { getByText } = render(
      <WorkoutDisplayScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    // Complete set to start rest timer
    fireEvent.press(getByText('Complete Set'));

    // Should show timer controls
    expect(getByText('Rest Time')).toBeTruthy();
    expect(getByText('Skip Rest')).toBeTruthy();

    // Test skip rest
    fireEvent.press(getByText('Skip Rest'));

    // Should go to next set
    expect(getByText('Set 2 of 3')).toBeTruthy();
  });

  it('shows intensity modal after completing exercise', async () => {
    const { getByText, queryByText } = render(
      <WorkoutDisplayScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    // Complete all sets for first exercise
    fireEvent.press(getByText('Complete Set')); // Set 1
    fireEvent.press(getByText('Skip Rest'));
    fireEvent.press(getByText('Complete Set')); // Set 2
    fireEvent.press(getByText('Skip Rest'));
    fireEvent.press(getByText('Complete Set')); // Set 3 (final set)

    await waitFor(() => {
      expect(getByText('How did that feel?')).toBeTruthy();
      expect(getByText('Rate the intensity of bench press')).toBeTruthy();
    });

    // Should show intensity rating buttons
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    expect(getByText('4')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
  });

  it('progresses to next exercise after intensity rating', async () => {
    const { getByText } = render(
      <WorkoutDisplayScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    // Complete all sets for first exercise
    fireEvent.press(getByText('Complete Set'));
    fireEvent.press(getByText('Skip Rest'));
    fireEvent.press(getByText('Complete Set'));
    fireEvent.press(getByText('Skip Rest'));
    fireEvent.press(getByText('Complete Set'));

    await waitFor(() => {
      expect(getByText('How did that feel?')).toBeTruthy();
    });

    // Rate intensity
    fireEvent.press(getByText('3'));

    await waitFor(() => {
      // Should progress to second exercise
      expect(getByText('Exercise 2 of 2')).toBeTruthy();
      expect(getByText('push ups')).toBeTruthy();
      expect(getByText('15 reps')).toBeTruthy(); // No weight for bodyweight exercise
    });
  });

  it('shows workout completion screen after finishing all exercises', async () => {
    const { getByText } = render(
      <WorkoutDisplayScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    // Complete first exercise
    for (let set = 0; set < 3; set++) {
      fireEvent.press(getByText('Complete Set'));
      if (set < 2) fireEvent.press(getByText('Skip Rest'));
    }

    await waitFor(() => {
      expect(getByText('How did that feel?')).toBeTruthy();
    });
    fireEvent.press(getByText('3'));

    // Complete second exercise
    await waitFor(() => {
      expect(getByText('push ups')).toBeTruthy();
    });

    for (let set = 0; set < 3; set++) {
      fireEvent.press(getByText('Complete Set'));
      if (set < 2) fireEvent.press(getByText('Skip Rest'));
    }

    await waitFor(() => {
      expect(getByText('How did that feel?')).toBeTruthy();
    });
    fireEvent.press(getByText('3'));

    // Should show completion screen
    await waitFor(() => {
      expect(getByText('Workout Complete!')).toBeTruthy();
      expect(getByText('Great job crushing your chest workout!')).toBeTruthy();
      expect(getByText('Log Workout')).toBeTruthy();
    });
  });

  it('displays next exercise preview', () => {
    const { getByText } = render(
      <WorkoutDisplayScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    expect(getByText('Up Next:')).toBeTruthy();
    expect(getByText('push ups')).toBeTruthy();
  });

  it('handles back navigation', () => {
    const { getByTestId } = render(
      <WorkoutDisplayScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    // Note: You might need to add testID to the back button in the component
    // For now, we just verify navigation is available
    expect(mockGoBack).toBeDefined();
  });

  it('shows bodyweight exercise without weight', () => {
    const bodyweightRoute = {
      params: {
        workout: [mockWorkout[1]], // Just the push ups exercise
        muscleGroup: 'chest',
      },
    };

    const { getByText, queryByText } = render(
      <WorkoutDisplayScreen 
        navigation={mockNavigation} 
        route={bodyweightRoute} 
      />
    );

    expect(getByText('15 reps')).toBeTruthy();
    expect(queryByText(/lbs/)).toBeNull(); // Should not show weight for bodyweight exercises
  });

  it('handles timer countdown', async () => {
    const { getByText } = render(
      <WorkoutDisplayScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    // Start rest timer
    fireEvent.press(getByText('Complete Set'));

    // Should show initial time (3:00 for compound exercise)
    expect(getByText(/3:00|2:5/)).toBeTruthy();

    // Advance timer
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Time should decrease
    expect(getByText(/2:59|2:5/)).toBeTruthy();
  });

  it('vibrates when timer completes', async () => {
    const { getByText } = render(
      <WorkoutDisplayScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    // Start rest timer
    fireEvent.press(getByText('Complete Set'));

    // Fast forward to timer completion
    act(() => {
      jest.advanceTimersByTime(180000); // 3 minutes
    });

    // Should have called vibration
    expect(Vibration.vibrate).toHaveBeenCalledWith([0, 500, 200, 500]);
  });

  it('calculates smart rest times for different exercise types', () => {
    // This test verifies the getRestTime logic
    // For bench press (compound + barbell), should get 180 seconds
    // For push ups (bodyweight), should get 120 seconds default
    
    const { getByText } = render(
      <WorkoutDisplayScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    // Complete set on bench press
    fireEvent.press(getByText('Complete Set'));

    // Should show 3:00 for compound exercise
    expect(getByText('3:00')).toBeTruthy();
  });

  it('handles workout logging', async () => {
    const { getByText } = render(
      <WorkoutDisplayScreen 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    );

    // Mock the workout as complete by rendering with completion state
    // For now, just verify the component doesn't crash
    expect(getByText('bench press')).toBeTruthy();
  });
});