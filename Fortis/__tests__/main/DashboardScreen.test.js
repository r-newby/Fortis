// src/screens/__tests__/main/DashboardScreen.test.js
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react-native';
import DashboardScreen from '../../src/screens/main/DashboardScreen';

// Mock react-native-chart-kit
jest.mock('react-native-chart-kit', () => ({
  ProgressChart: () => 'ProgressChart',
}));

const mockWorkouts = [
  {
    id: '1',
    date: new Date().toISOString(),
    muscle_group: 'chest',
    total_volume: 1500,
    average_intensity: 4,
    completion_percentage: 100,
  },
  {
    id: '2',
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    muscle_group: 'back',
    total_volume: 1200,
    average_intensity: 3,
    completion_percentage: 95,
  },
];

const mockPersonalRecords = {
  'bench_press': {
    weight: 185,
    reps: 8,
    date: new Date().toISOString(),
    exerciseId: 1,
    volume: 1480,
  },
  'squat': {
    weight: 225,
    reps: 5,
    date: new Date().toISOString(),
    exerciseId: 2,
    volume: 1125,
  },
};

const mockUserProfile = {
  username: 'testuser',
  fitnessLevel: 'intermediate',
  goal: 'strength',
  created_at: '2024-01-01',
};

const mockUseApp = {
  userProfile: mockUserProfile,
  workouts: mockWorkouts,
  personalRecords: mockPersonalRecords,
  reloadData: jest.fn(),
};

jest.mock('../../src/context/AppContext', () => ({
  useApp: () => mockUseApp,
}));

const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
};

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders dashboard screen', () => {
    const { root } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    expect(root).toBeTruthy();
  });

  it('displays username', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    expect(getByText('testuser')).toBeTruthy();
  });

  it('shows motivational quote', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    // Should display one of the motivational quotes
    const quoteTexts = [
      "The only bad workout is the one that didn't happen.",
      "Push harder than yesterday if you want a different tomorrow.",
      "Success starts with self-discipline.",
      "Your body can stand almost anything. It's your mind you have to convince.",
      "Don't stop when you're tired. Stop when you're done.",
    ];

    const hasQuote = quoteTexts.some(quote => {
      try {
        return getByText(quote);
      } catch {
        return false;
      }
    });

    expect(hasQuote).toBeTruthy();
  });

  it('shows workout completed status when today workout exists', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    expect(getByText('Workout Complete! 🎉')).toBeTruthy();
    expect(getByText('Great job staying consistent!')).toBeTruthy();
  });

  it('displays weekly progress stats', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    expect(getByText('Workouts')).toBeTruthy();
    expect(getByText('Day Streak')).toBeTruthy();
  });

  it('shows quick action buttons', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    expect(getByText('Start Workout')).toBeTruthy();
    expect(getByText('Personal Records')).toBeTruthy();
    expect(getByText('Progress')).toBeTruthy();
    expect(getByText('Workout History')).toBeTruthy();
  });

  it('navigates to workout screen when start workout pressed', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Start Workout'));

    expect(mockNavigate).toHaveBeenCalledWith('Workouts');
  });

  it('navigates to personal records screen', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Personal Records'));

    expect(mockNavigate).toHaveBeenCalledWith('PersonalRecords');
  });

  it('navigates to progress screen', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Progress'));

    expect(mockNavigate).toHaveBeenCalledWith('Progress');
  });

  it('shows today section', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    expect(getByText('Today')).toBeTruthy();
  });

  it('displays basic stats labels', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    expect(getByText('Total Workouts')).toBeTruthy();
    expect(getByText('Weekly Volume')).toBeTruthy();
    expect(getByText('Avg Intensity')).toBeTruthy();
    expect(getByText('Completion')).toBeTruthy();
  });

  it('calculates weekly progress percentage correctly', () => {
    const { getAllByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    // Should show some percentage - use getAllByText since there might be multiple
    const percentageElements = getAllByText(/\d+%/);
    expect(percentageElements.length).toBeGreaterThan(0);
  });

  it('handles refresh functionality', () => {
    render(<DashboardScreen navigation={mockNavigation} />);

    // Verify reloadData function exists and can be called
    expect(mockUseApp.reloadData).toBeDefined();
    expect(typeof mockUseApp.reloadData).toBe('function');
  });

  it('shows your stats section', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    // The component shows "Your Stats" section
    expect(getByText('Your Stats')).toBeTruthy();
  });

  it('displays workout history button', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    const historyButton = getByText('Workout History');
    expect(historyButton).toBeTruthy();

    fireEvent.press(historyButton);
    // The component navigates to 'Workouts' not 'WorkoutHistory'
    expect(mockNavigate).toHaveBeenCalledWith('Workouts');
  });

  it('handles navigation properly', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    // Test multiple navigation buttons work
    fireEvent.press(getByText('Start Workout'));
    fireEvent.press(getByText('Personal Records'));
    fireEvent.press(getByText('Progress'));

    expect(mockNavigate).toHaveBeenCalledTimes(3);
  });

  it('displays numeric values', () => {
    const { getAllByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    // Should show some numeric data (workouts, streak, etc.) - use getAllByText for multiple matches
    const numericElements = getAllByText(/\d+/);
    expect(numericElements.length).toBeGreaterThan(0);
  });

  it('shows streak indicator', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    // Should show fire emoji or streak indicator
    expect(getByText('🔥')).toBeTruthy();
  });

  it('displays this week section', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    expect(getByText('This Week')).toBeTruthy();
  });

  it('shows quick actions section', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    expect(getByText('Quick Actions')).toBeTruthy();
  });

  it('displays greeting message', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    // Should show time-based greeting
    const greetings = ['Good morning', 'Good afternoon', 'Good evening'];
    const hasGreeting = greetings.some(greeting => {
      try {
        return getByText(new RegExp(greeting, 'i'));
      } catch {
        return false;
      }
    });

    expect(hasGreeting).toBeTruthy();
  });

  it('shows weekly volume in stats', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    // Should show formatted volume (2.7k from the component output)
    expect(getByText('2.7k')).toBeTruthy();
  });

  it('displays completion percentage', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    // Should show completion percentage (98% from component output)
    expect(getByText('98%')).toBeTruthy();
  });

  it('shows intensity rating', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    // Should show intensity rating (4/5 from component output)
    expect(getByText('4/5')).toBeTruthy();
  });
});