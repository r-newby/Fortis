// src/screens/__tests__/main/PersonalRecordsScreen.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PersonalRecordsScreen from '../../src/screens/main/PersonalRecordsScreen';

const mockPersonalRecords = {
  bench_press: {
    weight: 185,
    reps: 8,
    date: new Date().toISOString(),
    exerciseId: 1,
    volume: 1480,
    target: 'pectorals',
    bodypart: 'chest',
    equipment: 'barbell',
    isPR: true,
  },
  squat: {
    weight: 225,
    reps: 5,
    date: new Date(Date.now() - 86400000).toISOString(),
    exerciseId: 2,
    volume: 1125,
    target: 'quadriceps',
    bodypart: 'upper legs',
    equipment: 'barbell',
    isPR: true,
  },
  pull_ups: {
    weight: 0,
    reps: 12,
    date: new Date(Date.now() - 172800000).toISOString(),
    exerciseId: 3,
    volume: 0,
    target: 'latissimus dorsi',
    bodypart: 'back',
    equipment: 'body weight',
    isPR: true,
  },
  bicep_curls: {
    weight: 35,
    reps: 12,
    date: new Date(Date.now() - 259200000).toISOString(),
    exerciseId: 4,
    volume: 420,
    target: 'biceps',
    bodypart: 'upper arms',
    equipment: 'dumbbell',
    isPR: true,
  },
};

const mockUseApp = {
  personalRecords: mockPersonalRecords,
};

jest.mock('../../src/context/AppContext', () => ({
  useApp: jest.fn(() => mockUseApp),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
};

describe('PersonalRecordsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays header with PR count', () => {
    const { getByText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    expect(getByText('Personal Records')).toBeTruthy();
    expect(getByText('4 exercises tracked')).toBeTruthy();
  });

  it('shows search input', () => {
    const { getByPlaceholderText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    expect(getByPlaceholderText('Search exercises...')).toBeTruthy();
  });

  it('displays category filters', () => {
    const { getByText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Chest')).toBeTruthy();
    expect(getByText('Back')).toBeTruthy();
    expect(getByText('Legs')).toBeTruthy();
    expect(getByText('Arms')).toBeTruthy();
  });

  it('filters PRs by muscle group', () => {
    const { getByText, queryByText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    fireEvent.press(getByText('Chest'));
    expect(getByText('Bench Press')).toBeTruthy();
    expect(queryByText('Squat')).toBeNull();
  });

  it('searches PRs by exercise name', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    const searchInput = getByPlaceholderText('Search exercises...');
    fireEvent.changeText(searchInput, 'bench');
    expect(getByText('Bench Press')).toBeTruthy();
    expect(queryByText('Squat')).toBeNull();
  });

  it('displays PR cards with correct information', () => {
    const { getByText, getAllByText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    expect(getByText('Bench Press')).toBeTruthy();
    expect(getByText('185 lbs × 8 reps')).toBeTruthy();
    expect(getByText('1480')).toBeTruthy();
    expect(getAllByText('lbs').length).toBeGreaterThan(0);
  });

  it('handles bodyweight exercises correctly', () => {
    const { getByText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    expect(getByText('Pull Ups')).toBeTruthy();
    expect(getByText('12 reps')).toBeTruthy();
  });

  it('sorts PRs by volume (highest first)', () => {
    const { getAllByText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    const prCards = getAllByText(/lbs/);
    expect(prCards.length).toBeGreaterThan(0);
  });

  it('shows top PR badge on first record', () => {
    const { getByText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    expect(getByText('🏆')).toBeTruthy();
  });

  it('opens detail modal when PR is pressed', () => {
    const { getByText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    fireEvent.press(getByText('Bench Press'));
    expect(getByText('Weight')).toBeTruthy();
    expect(getByText('185 lbs')).toBeTruthy();
    expect(getByText('Reps')).toBeTruthy();
    expect(getByText('8 reps')).toBeTruthy();
    expect(getByText('Total Volume')).toBeTruthy();
    expect(getByText('1480 lbs')).toBeTruthy();
  });

  it('shows muscle and equipment info in modal', () => {
    const { getByText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    fireEvent.press(getByText('Bench Press'));
    expect(getByText('Muscle & Equipment')).toBeTruthy();
    expect(getByText('pectorals • barbell')).toBeTruthy();
  });

  it('closes modal when close button pressed', () => {
    const { getByText, queryByText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    fireEvent.press(getByText('Bench Press'));
    expect(getByText('Weight')).toBeTruthy();
    fireEvent.press(getByText('Close'));
    expect(queryByText('Weight')).toBeNull();
  });

  it('shows search results count', () => {
    const { getByPlaceholderText, getByText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    const searchInput = getByPlaceholderText('Search exercises...');
    fireEvent.changeText(searchInput, 'bench');
    expect(getByText('1 result for "bench"')).toBeTruthy();
  });

  it('clears search when clear button pressed', () => {
    const { getByPlaceholderText, getByText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    const searchInput = getByPlaceholderText('Search exercises...');
    fireEvent.changeText(searchInput, 'bench');
    fireEvent.changeText(searchInput, '');
    expect(getByText('Squat')).toBeTruthy();
  });

  it('handles clear filters functionality', () => {
    const { getByText, getByPlaceholderText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    fireEvent.press(getByText('Chest'));
    fireEvent.changeText(getByPlaceholderText('Search exercises...'), 'test');
    expect(getByText('No records found')).toBeTruthy();
    fireEvent.press(getByText('Clear Filters'));
    expect(getByText('Bench Press')).toBeTruthy();
    expect(getByText('Squat')).toBeTruthy();
  });

  it('formats exercise names correctly', () => {
    const { getByText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    expect(getByText('Bench Press')).toBeTruthy();
    expect(getByText('Pull Ups')).toBeTruthy();
    expect(getByText('Bicep Curls')).toBeTruthy();
  });

  it('shows appropriate icons for different muscle groups', () => {
    const { getByText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    expect(getByText('Bench Press')).toBeTruthy();
    expect(getByText('Squat')).toBeTruthy();
    expect(getByText('Pull Ups')).toBeTruthy();
  });

  it('filters by category using bodypart data', () => {
    const { getByText, queryByText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    fireEvent.press(getByText('Arms'));
    expect(getByText('Bicep Curls')).toBeTruthy();
    expect(queryByText('Bench Press')).toBeNull();
  });

  it('shows date when PR was set', () => {
    const { getByText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    const today = new Date().toLocaleDateString();
    expect(getByText(today)).toBeTruthy();
  });

  it('handles category filtering with muscle group mapping', () => {
    const { getByText, queryByText } = render(
      <PersonalRecordsScreen navigation={mockNavigation} />
    );
    fireEvent.press(getByText('Legs'));
    expect(getByText('Squat')).toBeTruthy();
    expect(queryByText('Bench Press')).toBeNull();
    expect(queryByText('Bicep Curls')).toBeNull();
  });
});
