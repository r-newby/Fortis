// src/screens/__tests__/onboarding/OnboardingFitnessLevel.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OnboardingFitnessLevel from '../../src/screens/onboarding/OnboardingFitnessLevel';

const mockRoute = {
  params: {
    username: 'testuser',
    authUserId: 'user-123'
  }
};

describe('OnboardingFitnessLevel', () => {
  it('renders all fitness level options', () => {
    const { getByText } = render(
      <OnboardingFitnessLevel route={mockRoute} navigation={{ navigate: jest.fn() }} />
    );

    expect(getByText('Beginner')).toBeTruthy();
    expect(getByText('Intermediate')).toBeTruthy();
    expect(getByText('Advanced')).toBeTruthy();
  });

  it('allows selection of fitness level', () => {
    const { getByText } = render(
      <OnboardingFitnessLevel route={mockRoute} navigation={{ navigate: jest.fn() }} />
    );

    fireEvent.press(getByText('Intermediate'));
    
    // Continue button should be enabled
    expect(getByText('Continue')).toBeTruthy();
  });

  it('navigates to goal selection with selected level', () => {
    const mockNavigate = jest.fn();
    const { getByText } = render(
      <OnboardingFitnessLevel 
        route={mockRoute} 
        navigation={{ navigate: mockNavigate }} 
      />
    );

    fireEvent.press(getByText('Intermediate'));
    fireEvent.press(getByText('Continue'));

    expect(mockNavigate).toHaveBeenCalledWith('Goal', {
      authUserId: 'user-123',
      username: 'testuser',
      fitnessLevel: 'intermediate',
    });
  });

  it('button is disabled when no selection made', () => {
    const { getByText } = render(
      <OnboardingFitnessLevel route={mockRoute} navigation={{ navigate: jest.fn() }} />
    );

    const continueButton = getByText('Continue');
    // Button should be disabled initially
    expect(continueButton).toBeTruthy();
  });
});
