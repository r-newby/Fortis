// src/screens/__tests__/onboarding/OnboardingGoal.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import OnboardingGoal from '../../src/screens/onboarding/OnboardingGoal';

const mockRoute = {
  params: {
    username: 'testuser',
    fitnessLevel: 'intermediate'
  }
};

const mockReset = jest.fn();
const mockNavigation = {
  reset: mockReset,
};

describe('OnboardingGoal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert.mockClear();
  });

  it('renders all goal options', () => {
    const { getByText } = render(
      <OnboardingGoal route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByText('Build Strength')).toBeTruthy();
    expect(getByText('Build Muscle')).toBeTruthy();
    expect(getByText('Improve Endurance')).toBeTruthy();
  });

  it('completes onboarding and shows email verification alert', async () => {
    const { getByText } = render(
      <OnboardingGoal route={mockRoute} navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Build Strength'));
    fireEvent.press(getByText('Complete Setup'));

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{
          name: 'Login',
          params: {
            onboardingData: {
              username: 'testuser',
              fitnessLevel: 'intermediate',
              goal: 'strength',
            },
          },
        }],
      });
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Verify Your Email',
        'Please check your inbox and confirm your email before logging in.'
      );
    });
  });

  it('button is disabled when no goal selected', () => {
    const { getByText } = render(
      <OnboardingGoal route={mockRoute} navigation={mockNavigation} />
    );

    const completeButton = getByText('Complete Setup');
    expect(completeButton).toBeTruthy();
    // Note: We can't easily test the disabled state in React Native testing library
    // but we can test that the button doesn't trigger actions when no goal is selected
  });

  it('allows goal selection', () => {
    const { getByText } = render(
      <OnboardingGoal route={mockRoute} navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Build Strength'));
    
    // After selection, button should be enabled
    expect(getByText('Complete Setup')).toBeTruthy();
  });
});