// src/screens/__tests__/auth/LoginScreen.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../../src/screens/auth/LoginScreen';
import { supabase } from '../../src/supabase';

const mockUseApp = {
  reloadData: jest.fn(),
  completeOnboarding: jest.fn(),
};

jest.mock('../../src/context/AppContext', () => ({
  useApp: () => mockUseApp,
}));

const mockNavigate = jest.fn();
const mockGetState = jest.fn();

const mockNavigation = {
  navigate: mockNavigate,
  getState: mockGetState,
};

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert.mockClear();
    mockGetState.mockReturnValue({ routes: [] });
  });

  it('renders all required input fields', () => {
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(getByText('Continue')).toBeTruthy();
  });


  it('handles successful login', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(mockUseApp.reloadData).toHaveBeenCalled();
    expect(mockUseApp.completeOnboarding).toHaveBeenCalled();
  });

  it('handles login error', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' }
    });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'wrongpassword');
    
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Login Failed',
        'Invalid credentials'
      );
    });
  });

  it('processes onboarding data from navigation params', async () => {
    const onboardingData = {
      username: 'testuser',
      fitnessLevel: 'intermediate',
      goal: 'strength'
    };

    mockGetState.mockReturnValue({
      routes: [{ params: { onboardingData } }]
    });

    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    });

    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    });

    supabase.from.mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { username: null, fitness_level: null, goal: null },
            error: null
          }),
          update: jest.fn().mockReturnThis(),
        };
      }
    });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });
  });

  it('updates profile with onboarding data when needed', async () => {
    const onboardingData = {
      username: 'testuser',
      fitnessLevel: 'intermediate',
      goal: 'strength'
    };

    mockGetState.mockReturnValue({
      routes: [{ params: { onboardingData } }]
    });

    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    });

    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    });

    const mockUpdate = jest.fn().mockResolvedValue({ error: null });

    supabase.from.mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { username: null, fitness_level: null, goal: null },
            error: null
          }),
          update: mockUpdate,
        };
      }
    });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        username: 'testuser',
        fitness_level: 'intermediate',
        goal: 'strength',
      });
    });
  });

  it('shows loading state during login', async () => {
    supabase.auth.signInWithPassword.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    
    fireEvent.press(getByText('Continue'));

    expect(getByText('Logging in...')).toBeTruthy();
  });

  it('navigates to sign up screen', () => {
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Sign up'));

    expect(mockNavigate).toHaveBeenCalledWith('SignUp');
  });

});