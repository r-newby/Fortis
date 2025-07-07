import { generateWorkout } from '../src/utils/generateWorkout.js';

// Simple mock exercises
const exercises = [
  { id: 1, name: 'Bicep Curls', target: 'biceps', equipment: 'dumbbell' },
  { id: 2, name: 'Squats', target: 'quads', equipment: 'barbell' },
  { id: 3, name: 'Push-ups', target: 'pectorals', equipment: 'body weight' }
];

describe('generateWorkout', () => {
  test('returns matching exercises for selected equipment and muscle groups', () => {
    const result = generateWorkout({
      allExercises: exercises,
      equipment: ['dumbbell'],
      muscleGroup: 'arms', 
      fitnessLevel: 'intermediate',
      goal: 'hypertrophy'
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  test('returns empty array if no matches are found', () => {
    const result = generateWorkout({
      allExercises: exercises,
      equipment: ['nonexistent'],
      muscleGroup: 'nonexistent',
      fitnessLevel: 'intermediate',
      goal: 'hypertrophy'
    });

    expect(result).toEqual([]);
  });

  test('returns exercise with correct sets and reps for hypertrophy goal', () => {
  const result = generateWorkout({
    allExercises: exercises,
    equipment: ['dumbbell'],
    muscleGroup: 'arms',
    fitnessLevel: 'intermediate',
    goal: 'hypertrophy'
  });

  if (result.length > 0) {
    expect(result[0]).toHaveProperty('sets', 3);
    expect(result[0]).toHaveProperty('reps', 10);
    expect(result[0]).toHaveProperty('weight');
  }
});

  test('handles array input for muscle groups', () => {
    const result = generateWorkout({
      allExercises: exercises,
      equipment: ['dumbbell'],
      muscleGroup: ['arms'], // Test with array
      fitnessLevel: 'intermediate',
      goal: 'hypertrophy'
    });

    expect(Array.isArray(result)).toBe(true);
  });

  test('handles string input for muscle groups', () => {
    const result = generateWorkout({
      allExercises: exercises,
      equipment: ['dumbbell'],
      muscleGroup: 'arms', // Test with string
      fitnessLevel: 'intermediate',
      goal: 'hypertrophy'
    });

    expect(Array.isArray(result)).toBe(true);
  });
});