// __tests__/prCalculation.test.js

// Extract and test just the PR calculation logic
const calculatePersonalRecords = (workoutExercises) => {
  const records = {};
  const exerciseHistory = {};

  // Sort by date
  const sortedWorkoutExercises = workoutExercises?.sort((a, b) => 
    new Date(a.workouts.date) - new Date(b.workouts.date)
  ) || [];

  sortedWorkoutExercises?.forEach(we => {
    const exerciseName = we.exercises?.name;
    const exerciseDetails = we.exercises;
    
    if (!exerciseName || !exerciseDetails) return;

    // Use actual values if available, fallback to planned values
    const weight = we.actual_weight || we.weight || 0;
    const reps = we.actual_reps || we.reps || 0;
    const workoutDate = we.workouts?.date;

    // Skip if no meaningful data
    if (reps <= 0) return;

    // Initialize exercise history if first time seeing this exercise
    if (!exerciseHistory[exerciseName]) {
      exerciseHistory[exerciseName] = [];
    }

    // Calculate score for this attempt
    let currentScore;
    if (weight > 0) {
      // Weighted exercise: prioritize by total volume
      currentScore = weight * reps;
    } else {
      // Bodyweight exercise: prioritize by max reps
      currentScore = reps;
    }

    // Add this attempt to history
    exerciseHistory[exerciseName].push({
      weight,
      reps,
      score: currentScore,
      date: workoutDate,
      exerciseDetails
    });

    // Only create a PR if this beats a previous attempt
    const previousAttempts = exerciseHistory[exerciseName];
    const isNewPR = previousAttempts.length > 1 && // Must have done this exercise before
      currentScore > Math.max(...previousAttempts.slice(0, -1).map(attempt => attempt.score));

    // If this is a new PR (or we're updating an existing PR with a better score)
    if (isNewPR) {
      records[exerciseName] = {
        weight,
        reps,
        date: workoutDate,
        exerciseId: exerciseDetails.id,
        target: exerciseDetails.target,
        bodypart: exerciseDetails.body_part,
        equipment: exerciseDetails.equipment,
        volume: weight * reps,
        isPR: true
      };
    }
  });

  return records;
};

describe('Personal Records Calculation', () => {
  test('should return empty object when no exercises provided', () => {
    const result = calculatePersonalRecords([]);
    expect(result).toEqual({});
  });

  test('should not create PR for first attempt', () => {
    const mockData = [
      {
        actual_weight: 135,
        actual_reps: 8,
        weight: 135,
        reps: 8,
        exercises: {
          id: 1,
          name: 'bench_press',
          target: 'pectorals',
          body_part: 'chest',
          equipment: 'barbell'
        },
        workouts: {
          user_id: 'test-user',
          date: '2024-01-01'
        }
      }
    ];

    const result = calculatePersonalRecords(mockData);
    
    // Should be empty since it's only first attempt
    expect(Object.keys(result)).toHaveLength(0);
  });

  test('should create PR when improving on previous attempt', () => {
    const mockData = [
      // First attempt
      {
        actual_weight: 135,
        actual_reps: 8,
        weight: 135,
        reps: 8,
        exercises: {
          id: 1,
          name: 'bench_press',
          target: 'pectorals',
          body_part: 'chest',
          equipment: 'barbell'
        },
        workouts: {
          user_id: 'test-user',
          date: '2024-01-01'
        }
      },
      // Second attempt - improvement!
      {
        actual_weight: 145,
        actual_reps: 8,
        weight: 145,
        reps: 8,
        exercises: {
          id: 1,
          name: 'bench_press',
          target: 'pectorals',
          body_part: 'chest',
          equipment: 'barbell'
        },
        workouts: {
          user_id: 'test-user',
          date: '2024-01-02'
        }
      }
    ];

    const result = calculatePersonalRecords(mockData);
    
    // Should have one PR
    expect(Object.keys(result)).toHaveLength(1);
    expect(result.bench_press).toBeDefined();
    expect(result.bench_press.weight).toBe(145);
    expect(result.bench_press.reps).toBe(8);
    expect(result.bench_press.volume).toBe(1160); // 145 * 8
  });

  test('should not create PR when performance decreases', () => {
    const mockData = [
      // First attempt - higher volume
      {
        actual_weight: 145,
        actual_reps: 8,
        weight: 145,
        reps: 8,
        exercises: {
          id: 1,
          name: 'bench_press',
          target: 'pectorals',
          body_part: 'chest',
          equipment: 'barbell'
        },
        workouts: {
          user_id: 'test-user',
          date: '2024-01-01'
        }
      },
      // Second attempt - lower volume
      {
        actual_weight: 135,
        actual_reps: 8,
        weight: 135,
        reps: 8,
        exercises: {
          id: 1,
          name: 'bench_press',
          target: 'pectorals',
          body_part: 'chest',
          equipment: 'barbell'
        },
        workouts: {
          user_id: 'test-user',
          date: '2024-01-02'
        }
      }
    ];

    const result = calculatePersonalRecords(mockData);
    
    // Should have no PRs since second attempt was worse
    expect(Object.keys(result)).toHaveLength(0);
  });

  test('should handle bodyweight exercises correctly', () => {
    const mockData = [
      // First push-up attempt
      {
        actual_weight: 0,
        actual_reps: 20,
        weight: 0,
        reps: 20,
        exercises: {
          id: 2,
          name: 'push_up',
          target: 'pectorals',
          body_part: 'chest',
          equipment: 'body weight'
        },
        workouts: {
          user_id: 'test-user',
          date: '2024-01-01'
        }
      },
      // Second push-up attempt - more reps
      {
        actual_weight: 0,
        actual_reps: 25,
        weight: 0,
        reps: 25,
        exercises: {
          id: 2,
          name: 'push_up',
          target: 'pectorals',
          body_part: 'chest',
          equipment: 'body weight'
        },
        workouts: {
          user_id: 'test-user',
          date: '2024-01-02'
        }
      }
    ];

    const result = calculatePersonalRecords(mockData);
    
    expect(Object.keys(result)).toHaveLength(1);
    expect(result.push_up).toBeDefined();
    expect(result.push_up.weight).toBe(0);
    expect(result.push_up.reps).toBe(25);
    expect(result.push_up.volume).toBe(0); // Bodyweight has 0 volume
  });

  test('should skip exercises with invalid data', () => {
    const mockData = [
      {
        actual_weight: 135,
        actual_reps: 0, // Invalid - 0 reps
        weight: 135,
        reps: 0,
        exercises: {
          id: 1,
          name: 'bench_press',
          target: 'pectorals',
          body_part: 'chest',
          equipment: 'barbell'
        },
        workouts: {
          user_id: 'test-user',
          date: '2024-01-01'
        }
      }
    ];

    const result = calculatePersonalRecords(mockData);
    
    // Should be empty due to invalid reps
    expect(Object.keys(result)).toHaveLength(0);
  });

  test('should use actual values over planned values', () => {
    const mockData = [
      // First attempt
      {
        actual_weight: null,
        actual_reps: null,
        weight: 135,
        reps: 8,
        exercises: {
          id: 1,
          name: 'bench_press',
          target: 'pectorals',
          body_part: 'chest',
          equipment: 'barbell'
        },
        workouts: {
          user_id: 'test-user',
          date: '2024-01-01'
        }
      },
      // Second attempt with actual values
      {
        actual_weight: 145,
        actual_reps: 8,
        weight: 135, // This should be ignored
        reps: 10,    // This should be ignored
        exercises: {
          id: 1,
          name: 'bench_press',
          target: 'pectorals',
          body_part: 'chest',
          equipment: 'barbell'
        },
        workouts: {
          user_id: 'test-user',
          date: '2024-01-02'
        }
      }
    ];

    const result = calculatePersonalRecords(mockData);
    
    expect(Object.keys(result)).toHaveLength(1);
    expect(result.bench_press.weight).toBe(145); // Should use actual_weight
    expect(result.bench_press.reps).toBe(8);     // Should use actual_reps
  });
});

console.log('Test file created! Run with: npm test');