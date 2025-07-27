// src/screens/__tests__/workout/WorkoutSummaryScreen.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WorkoutSummaryScreen from '../../src/screens/workout/WorkoutSummaryScreen';

const mockNavigate = jest.fn();
const mockReset = jest.fn();

const mockNavigation = {
  navigate: mockNavigate,
  reset: mockReset,
};

// Mock workout data with completed exercises
const mockWorkout = {
  duration: 45,
  exercises: [
    {
      id: 1,
      name: 'bench press',
      completedSets: [
        { reps: 8, weight: 135 },
        { reps: 8, weight: 135 },
        { reps: 7, weight: 135 },
      ]
    },
    {
      id: 2,
      name: 'dumbbell press',
      completedSets: [
        { reps: 10, weight: 50 },
        { reps: 10, weight: 50 },
        { reps: 9, weight: 50 },
        { reps: 8, weight: 50 },
      ]
    },
    {
      id: 3,
      name: 'push ups',
      completedSets: [
        { reps: 15, weight: 0 },
        { reps: 12, weight: 0 },
        { reps: 10, weight: 0 },
      ]
    }
  ]
};

const mockRouteWithWorkout = {
  params: {
    workout: mockWorkout,
  },
};

const mockRouteWithoutWorkout = {
  params: {},
};

describe('WorkoutSummaryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when no workout data provided', () => {
    const { getByText } = render(
      <WorkoutSummaryScreen 
        navigation={mockNavigation} 
        route={mockRouteWithoutWorkout} 
      />
    );

    expect(getByText('Loading summary...')).toBeTruthy();
  });

  it('displays workout summary header', () => {
    const { getByText } = render(
      <WorkoutSummaryScreen 
        navigation={mockNavigation} 
        route={mockRouteWithWorkout} 
      />
    );

    expect(getByText('Workout Summary')).toBeTruthy();
    expect(getByText('Great job finishing your workout!')).toBeTruthy();
  });

  it('calculates and displays total sets correctly', () => {
    const { getByText } = render(
      <WorkoutSummaryScreen 
        navigation={mockNavigation} 
        route={mockRouteWithWorkout} 
      />
    );

    // Total sets: 3 + 4 + 3 = 10
    expect(getByText('10')).toBeTruthy();
    expect(getByText('Sets')).toBeTruthy();
  });

  it('calculates and displays total reps correctly', () => {
    const { getByText } = render(
      <WorkoutSummaryScreen 
        navigation={mockNavigation} 
        route={mockRouteWithWorkout} 
      />
    );

    // Total reps: (8+8+7) + (10+10+9+8) + (15+12+10) = 23 + 37 + 37 = 97
    expect(getByText('97')).toBeTruthy();
    expect(getByText('Reps')).toBeTruthy();
  });

  it('displays workout duration correctly', () => {
    const { getByText } = render(
      <WorkoutSummaryScreen 
        navigation={mockNavigation} 
        route={mockRouteWithWorkout} 
      />
    );

    expect(getByText('~45')).toBeTruthy();
    expect(getByText('Minutes')).toBeTruthy();
  });

  it('calculates and displays total volume correctly', () => {
    const { getByText } = render(
      <WorkoutSummaryScreen 
        navigation={mockNavigation} 
        route={mockRouteWithWorkout} 
      />
    );

    // Total volume calculation:
    // Bench press: (8*135) + (8*135) + (7*135) = 1080 + 1080 + 945 = 3105
    // Dumbbell press: (10*50) + (10*50) + (9*50) + (8*50) = 500 + 500 + 450 + 400 = 1850
    // Push ups: (15*0) + (12*0) + (10*0) = 0
    // Total: 3105 + 1850 + 0 = 4955
    expect(getByText('4955 lbs')).toBeTruthy();
    expect(getByText('Total Volume')).toBeTruthy();
  });

  it('handles workout with zero duration', () => {
    const workoutWithZeroDuration = {
      ...mockWorkout,
      duration: 0,
    };

    const routeWithZeroDuration = {
      params: {
        workout: workoutWithZeroDuration,
      },
    };

    const { getByText } = render(
      <WorkoutSummaryScreen 
        navigation={mockNavigation} 
        route={routeWithZeroDuration} 
      />
    );

    expect(getByText('~0')).toBeTruthy();
    expect(getByText('Minutes')).toBeTruthy();
  });

  it('handles workout with no exercises', () => {
    const workoutWithNoExercises = {
      duration: 30,
      exercises: [],
    };

    const routeWithNoExercises = {
      params: {
        workout: workoutWithNoExercises,
      },
    };

    const { getByText, getAllByText } = render(
      <WorkoutSummaryScreen 
        navigation={mockNavigation} 
        route={routeWithNoExercises} 
      />
    );

    // Should show zeros for all metrics - use getAllByText since there will be multiple 0s
    const zeros = getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
    expect(getByText('~30')).toBeTruthy(); // Duration should still show
    expect(getByText('0 lbs')).toBeTruthy(); // Volume should show "0 lbs"
  });

  it('handles exercises with no completed sets', () => {
    const workoutWithEmptySets = {
      duration: 20,
      exercises: [
        {
          id: 1,
          name: 'bench press',
          completedSets: []
        }
      ],
    };

    const routeWithEmptySets = {
      params: {
        workout: workoutWithEmptySets,
      },
    };

    const { getByText, getAllByText } = render(
      <WorkoutSummaryScreen 
        navigation={mockNavigation} 
        route={routeWithEmptySets} 
      />
    );

    // Should show zeros for all metrics except duration
    const zeros = getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
    expect(getByText('~20')).toBeTruthy();
    expect(getByText('0 lbs')).toBeTruthy(); // Volume should show "0 lbs"
  });

  it('navigates back to dashboard when button pressed', () => {
    const { getByText } = render(
      <WorkoutSummaryScreen 
        navigation={mockNavigation} 
        route={mockRouteWithWorkout} 
      />
    );

    fireEvent.press(getByText('Back to Dashboard'));

    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  });

  it('handles workout with undefined duration', () => {
    const workoutWithUndefinedDuration = {
      exercises: mockWorkout.exercises,
      // duration is undefined
    };

    const routeWithUndefinedDuration = {
      params: {
        workout: workoutWithUndefinedDuration,
      },
    };

    const { getByText } = render(
      <WorkoutSummaryScreen 
        navigation={mockNavigation} 
        route={routeWithUndefinedDuration} 
      />
    );

    expect(getByText('~0')).toBeTruthy(); // Should default to 0
  });

  it('handles workout with undefined exercises array', () => {
    const workoutWithUndefinedExercises = {
      duration: 25,
      // exercises is undefined
    };

    const routeWithUndefinedExercises = {
      params: {
        workout: workoutWithUndefinedExercises,
      },
    };

    const { getByText, getAllByText } = render(
      <WorkoutSummaryScreen 
        navigation={mockNavigation} 
        route={routeWithUndefinedExercises} 
      />
    );

    // Should handle gracefully and show zeros
    const zeros = getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
    expect(getByText('~25')).toBeTruthy();
    expect(getByText('0 lbs')).toBeTruthy(); // Volume should show "0 lbs"
  });

  it('calculates volume correctly for bodyweight exercises', () => {
    const bodyweightOnlyWorkout = {
      duration: 30,
      exercises: [
        {
          id: 1,
          name: 'push ups',
          completedSets: [
            { reps: 20, weight: 0 },
            { reps: 18, weight: 0 },
          ]
        }
      ],
    };

    const routeWithBodyweight = {
      params: {
        workout: bodyweightOnlyWorkout,
      },
    };

    const { getByText } = render(
      <WorkoutSummaryScreen 
        navigation={mockNavigation} 
        route={routeWithBodyweight} 
      />
    );

    // Volume should be 0 for bodyweight exercises (weight = 0)
    expect(getByText('0 lbs')).toBeTruthy();
    expect(getByText('38')).toBeTruthy(); // Total reps: 20 + 18
    expect(getByText('2')).toBeTruthy(); // Total sets
  });

  it('renders all summary card sections', () => {
    const { getByText } = render(
      <WorkoutSummaryScreen 
        navigation={mockNavigation} 
        route={mockRouteWithWorkout} 
      />
    );

    // Check that all three summary items are present
    expect(getByText('Sets')).toBeTruthy();
    expect(getByText('Reps')).toBeTruthy();
    expect(getByText('Minutes')).toBeTruthy();
    
    // Check detail card
    expect(getByText('Total Volume')).toBeTruthy();
  });
});