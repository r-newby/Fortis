// This is a setup file, not a test file

// Suppress console logs during tests for cleaner output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = (...args) => {
  // Only show console.log if it's an actual test assertion
  if (!args[0]?.includes('===') && !args[0]?.includes('💪') && !args[0]?.includes('Input params')) {
    originalConsoleLog(...args);
  }
};

console.error = (...args) => {
  const errorMessage = args[0]?.toString() || '';
  // Suppress React act() warnings, Supabase mock errors, and other test noise
  if (!errorMessage.includes('act(...)') && 
      !errorMessage.includes('Error fetching exercises:') &&
      !errorMessage.includes('Error updating onboarding data:') &&
      !errorMessage.includes('Cannot read properties of undefined') &&
      !errorMessage.includes('reading \'data\'')) {
    originalConsoleError(...args);
  }
};

console.warn = (...args) => {
  // Suppress warnings during tests
  if (!args[0]?.includes('Warning:')) {
    originalConsoleWarn(...args);
  }
};

// Mock React Native Alert as a proper jest spy
import { Alert } from 'react-native';
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock Expo Constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        supabaseUrl: 'test-url',
        supabaseAnonKey: 'test-key',
      },
    },
  },
}));

// Mock Expo Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, size, color, ...props }) => `Ionicons-${name}`,
}));

// Mock Expo Linear Gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }) => children,
}));

// Mock React Native Chart Kit
jest.mock('react-native-chart-kit', () => ({
  LineChart: ({ data, ...props }) => 'LineChart',
  BarChart: ({ data, ...props }) => 'BarChart',
  ProgressChart: ({ data, ...props }) => 'ProgressChart',
}));

// Mock Supabase with more comprehensive responses
jest.mock('./src/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user' } }, 
        error: null 
      })),
      signInWithPassword: jest.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user' } }, 
        error: null 
      })),
      getUser: jest.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user' } }, 
        error: null 
      })),
      onAuthStateChange: jest.fn(() => ({
        subscription: { unsubscribe: jest.fn() }
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ 
        data: { username: 'test', fitness_level: 'beginner', goal: 'strength' }, 
        error: null 
      })),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
    })),
  },
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    reset: jest.fn(),
    goBack: jest.fn(),
    getParent: jest.fn(),
    getState: jest.fn(() => ({
      routes: [{ params: null }]
    })),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock Context providers - return actual context values
jest.mock('./src/context/AppContext', () => ({
  useApp: jest.fn(() => ({
    user: null,
    userProfile: null,
    workouts: [],
    personalRecords: {},
    isLoading: false,
    isOnboarded: false,
    updateUserProfile: jest.fn(),
    saveWorkout: jest.fn(),
    reloadData: jest.fn(() => Promise.resolve()),
    completeOnboarding: jest.fn(),
  })),
  AppProvider: ({ children }) => children,
}));

jest.mock('./src/context/WorkoutContext', () => ({
  useWorkout: jest.fn(() => ({
    currentWorkout: null,
    selectedEquipment: [],
    selectedMuscleGroup: '',
    startNewWorkout: jest.fn(),
    addSet: jest.fn(),
    addExerciseToWorkout: jest.fn(),
    completeWorkout: jest.fn(),
  })),
  WorkoutProvider: ({ children }) => children,
}));

// Global test utilities
global.mockWorkout = {
  id: 1,
  date: '2024-01-01',
  muscle_group: 'chest',
  total_volume: 1000,
  intensity: 3,
};

global.mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

global.mockProfile = {
  id: 'user-123',
  username: 'testuser',
  fitness_level: 'intermediate',
  goal: 'strength',
  created_at: '2024-01-01',
};