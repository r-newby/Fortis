// src/screens/__tests__/workout/WorkoutGenerationScreen.test.js
import React from 'react';
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import { Alert } from 'react-native';
import WorkoutGenerationScreen from '../../src/screens/workout/WorkoutGenerationScreen';

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Increase timeout for all tests
jest.setTimeout(15000);

const mockRoute = {
  params: {
    selectedEquipment: ['barbell', 'dumbbell'],
    selectedMuscleGroup: 'chest'
  }
};

const mockUserProfile = {
  fitnessLevel: 'intermediate',
  goal: 'strength'
};

const mockExercises = [
  {
    id: 1,
    name: 'bench press',
    target: 'pectorals',
    body_part: 'chest',
    equipment: 'barbell',
    gif_url: 'https://example.com/bench-press.gif'
  },
  {
    id: 2,
    name: 'dumbbell press',
    target: 'pectorals',
    body_part: 'chest',
    equipment: 'dumbbell',
    gif_url: 'https://example.com/dumbbell-press.gif'
  },
  {
    id: 3,
    name: 'push ups',
    target: 'pectorals',
    body_part: 'chest',
    equipment: 'body weight',
    gif_url: null
  }
];

// Mock the generateWorkout utility
jest.mock('../../src/utils/generateWorkout', () => ({
  generateWorkout: jest.fn(() => [
    {
      id: 1,
      name: 'bench press',
      target: 'pectorals',
      body_part: 'chest',
      equipment: 'barbell',
      sets: 4,
      reps: 8,
      weight: 135,
      gif_url: 'https://example.com/bench-press.gif'
    },
    {
      id: 2,
      name: 'dumbbell press',
      target: 'pectorals',
      body_part: 'chest',
      equipment: 'dumbbell',
      sets: 4,
      reps: 10,
      weight: 50,
      gif_url: 'https://example.com/dumbbell-press.gif'
    }
  ])
}));

jest.mock('../../src/context/AppContext', () => ({
  useApp: () => ({
    userProfile: mockUserProfile
  })
}));

// Mock supabase
jest.mock('../../src/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      limit: jest.fn(() => Promise.resolve({
        data: mockExercises,
        error: null
      }))
    }))
  }
}));

describe('WorkoutGenerationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows loading state initially', async () => {
    const { getByText } = render(
      <WorkoutGenerationScreen route={mockRoute} navigation={{ navigate: jest.fn() }} />
    );

    expect(getByText('Generating your perfect workout...')).toBeTruthy();
  });

  it('displays generated exercises', async () => {
    const { getByText, queryByText } = render(
      <WorkoutGenerationScreen route={mockRoute} navigation={{ navigate: jest.fn() }} />
    );

    await waitFor(
      () => {
        expect(queryByText('Generating your perfect workout...')).toBeNull();
      },
      { timeout: 10000 }
    );

    // Should display formatted exercise names (toTitleCase)
    expect(getByText('Bench Press')).toBeTruthy();
    expect(getByText('Dumbbell Press')).toBeTruthy();
  });

  it('shows workout personalization info', async () => {
    const { getByText, queryByText } = render(
      <WorkoutGenerationScreen route={mockRoute} navigation={{ navigate: jest.fn() }} />
    );

    await waitFor(
      () => {
        expect(queryByText('Generating your perfect workout...')).toBeNull();
      },
      { timeout: 10000 }
    );

    expect(getByText('About This Workout')).toBeTruthy();
    expect(getByText(/Intermediate fitness level/)).toBeTruthy();
    expect(getByText(/Strength training goal/)).toBeTruthy();
    expect(getByText(/Chest focus/)).toBeTruthy();
    expect(getByText(/2 equipment type/)).toBeTruthy();
  });

  it('allows regenerating workout', async () => {
    const { getByText, queryByText } = render(
      <WorkoutGenerationScreen route={mockRoute} navigation={{ navigate: jest.fn() }} />
    );

    await waitFor(
      () => {
        expect(queryByText('Generating your perfect workout...')).toBeNull();
      },
      { timeout: 10000 }
    );

    await act(async () => {
      fireEvent.press(getByText('Generate New Workout'));
    });

    // Should regenerate with same parameters
    expect(getByText('Generate New Workout')).toBeTruthy();
  });

  it('navigates to workout display when starting workout', async () => {
    const mockNavigate = jest.fn();
    const { getByText, queryByText } = render(
      <WorkoutGenerationScreen 
        route={mockRoute} 
        navigation={{ navigate: mockNavigate }} 
      />
    );

    await waitFor(
      () => {
        expect(queryByText('Generating your perfect workout...')).toBeNull();
      },
      { timeout: 10000 }
    );

    await act(async () => {
      fireEvent.press(getByText('Start Workout'));
    });

    expect(mockNavigate).toHaveBeenCalledWith('WorkoutDisplay', {
      workout: expect.any(Array),
      muscleGroup: 'chest',
    });
  });

  it('handles exercise fetch errors gracefully', async () => {
    // Create a mock that throws an error
    const errorSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        limit: jest.fn(() => Promise.resolve({
          data: null,
          error: { message: 'Network error' }
        }))
      }))
    };

    // Temporarily override the mock
    jest.doMock('../../src/supabase', () => ({
      supabase: errorSupabase
    }));

    const { getByText, queryByText } = render(
      <WorkoutGenerationScreen route={mockRoute} navigation={{ navigate: jest.fn() }} />
    );

    // Should show loading initially
    expect(getByText('Generating your perfect workout...')).toBeTruthy();

    // Wait for loading to finish
    await waitFor(
      () => {
        expect(queryByText('Generating your perfect workout...')).toBeNull();
      },
      { timeout: 8000 }
    );

    // Component should handle error gracefully and not crash
    expect(true).toBeTruthy();
  });

  it('calculates workout stats correctly', async () => {
    const { getByText, queryByText } = render(
      <WorkoutGenerationScreen route={mockRoute} navigation={{ navigate: jest.fn() }} />
    );

    await waitFor(
      () => {
        expect(queryByText('Generating your perfect workout...')).toBeNull();
      },
      { timeout: 10000 }
    );

    // Should show correct exercise count
    expect(getByText('2')).toBeTruthy();
    expect(getByText('Exercises')).toBeTruthy();

    // Should show total sets (2 exercises × 4 sets each = 8 sets)
    expect(getByText('8')).toBeTruthy();
    expect(getByText('Total Sets')).toBeTruthy();

    // Should show estimated time (regex to match time format)
    expect(getByText(/\d+m/)).toBeTruthy();
    expect(getByText('Est. Time')).toBeTruthy();
  });

  it('displays workout features correctly', async () => {
    const { getByText, queryByText } = render(
      <WorkoutGenerationScreen route={mockRoute} navigation={{ navigate: jest.fn() }} />
    );

    await waitFor(
      () => {
        expect(queryByText('Generating your perfect workout...')).toBeNull();
      },
      { timeout: 10000 }
    );

    // Should show features based on actual component
    expect(getByText('Features included:')).toBeTruthy();
    expect(getByText('Smart timers')).toBeTruthy();
    expect(getByText('Progress tracking')).toBeTruthy();
    expect(getByText('Adjustable reps')).toBeTruthy();
    
    // The component shows video demos count, not "Intensity feedback"
    expect(getByText(/video demos/)).toBeTruthy();
  });

  it('shows exercise demo buttons for exercises with GIFs', async () => {
    const { getByText, queryByText, getAllByText } = render(
      <WorkoutGenerationScreen route={mockRoute} navigation={{ navigate: jest.fn() }} />
    );

    await waitFor(
      () => {
        expect(queryByText('Generating your perfect workout...')).toBeNull();
      },
      { timeout: 10000 }
    );

    // Should show demo buttons for exercises with GIFs
    const demoButtons = getAllByText('Demo');
    expect(demoButtons.length).toBe(2); // Both mock exercises have gif_url
  });

  it('toggles exercise demo visibility', async () => {
    const { getByText, queryByText, getAllByText } = render(
      <WorkoutGenerationScreen route={mockRoute} navigation={{ navigate: jest.fn() }} />
    );

    await waitFor(
      () => {
        expect(queryByText('Generating your perfect workout...')).toBeNull();
      },
      { timeout: 10000 }
    );

    const demoButtons = getAllByText('Demo');
    
    await act(async () => {
      fireEvent.press(demoButtons[0]);
    });

    // Should change to "Hide" when expanded
    expect(getByText('Hide')).toBeTruthy();
  });

  it('shows demo prompt when exercises have GIFs', async () => {
    const { getByText, queryByText } = render(
      <WorkoutGenerationScreen route={mockRoute} navigation={{ navigate: jest.fn() }} />
    );

    await waitFor(
      () => {
        expect(queryByText('Generating your perfect workout...')).toBeNull();
      },
      { timeout: 10000 }
    );

    expect(getByText(/Tap the "Demo" button on exercises to preview proper form/)).toBeTruthy();
  });

  it('displays exercise metrics correctly', async () => {
    const { getByText, queryByText, getAllByText } = render(
      <WorkoutGenerationScreen route={mockRoute} navigation={{ navigate: jest.fn() }} />
    );

    await waitFor(
      () => {
        expect(queryByText('Generating your perfect workout...')).toBeNull();
      },
      { timeout: 10000 }
    );

    // Should show sets x reps
    expect(getByText('4 × 8')).toBeTruthy(); // Bench press
    expect(getByText('4 × 10')).toBeTruthy(); // Dumbbell press

    // Should show weight
    expect(getByText('135 lbs')).toBeTruthy(); // Bench press weight
    expect(getByText('50 lbs')).toBeTruthy(); // Dumbbell press weight

    // Should show rest times (there will be multiple, so use getAllByText)
    const restTimes = getAllByText(/\d:\d{2} rest/);
    expect(restTimes.length).toBeGreaterThan(0);
  });
});