// src/utils/mockData.js
export const mockExercises = [
  // CHEST EXERCISES
  {
    id: '1',
    name: 'Barbell Bench Press',
    category: 'chest',
    equipment: 'barbell',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    instructions: 'Lie on bench, grip bar slightly wider than shoulders, lower to chest, press up.',
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: '2',
    name: 'Dumbbell Bench Press',
    category: 'chest',
    equipment: 'dumbbells',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    instructions: 'Lie on bench with dumbbells, lower to sides of chest, press up.',
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: '3',
    name: 'Push-Ups',
    category: 'chest',
    equipment: 'bodyweight',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps', 'core'],
    instructions: 'Start in plank position, lower body to ground, push back up.',
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: '4',
    name: 'Cable Fly',
    category: 'chest',
    equipment: 'cable',
    primaryMuscles: ['chest'],
    secondaryMuscles: [],
    instructions: 'Stand between cables, bring handles together in front of chest.',
    image: 'https://via.placeholder.com/300x200',
  },

  // BACK EXERCISES
  {
    id: '5',
    name: 'Pull-Ups',
    category: 'back',
    equipment: 'pullup_bar',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    instructions: 'Hang from bar, pull body up until chin over bar, lower with control.',
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: '6',
    name: 'Barbell Row',
    category: 'back',
    equipment: 'barbell',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    instructions: 'Bend forward, pull bar to lower chest, squeeze shoulder blades.',
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: '7',
    name: 'Dumbbell Row',
    category: 'back',
    equipment: 'dumbbells',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    instructions: 'Support with one hand, row dumbbell to hip with other.',
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: '8',
    name: 'Lat Pulldown',
    category: 'back',
    equipment: 'cable',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    instructions: 'Pull bar down to upper chest, control the weight back up.',
    image: 'https://via.placeholder.com/300x200',
  },

  // LEGS EXERCISES
  {
    id: '9',
    name: 'Barbell Squat',
    category: 'legs',
    equipment: 'barbell',
    primaryMuscles: ['legs'],
    secondaryMuscles: ['core'],
    instructions: 'Bar on shoulders, squat down to parallel, drive back up.',
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: '10',
    name: 'Dumbbell Lunges',
    category: 'legs',
    equipment: 'dumbbells',
    primaryMuscles: ['legs'],
    secondaryMuscles: ['core'],
    instructions: 'Step forward, lower back knee toward ground, push back to start.',
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: '11',
    name: 'Bodyweight Squat',
    category: 'legs',
    equipment: 'bodyweight',
    primaryMuscles: ['legs'],
    secondaryMuscles: ['core'],
    instructions: 'Lower body by bending knees, keep chest up, return to standing.',
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: '12',
    name: 'Kettlebell Swing',
    category: 'legs',
    equipment: 'kettlebell',
    primaryMuscles: ['legs'],
    secondaryMuscles: ['core', 'shoulders'],
    instructions: 'Hinge at hips, swing kettlebell between legs and up to shoulder height.',
    image: 'https://via.placeholder.com/300x200',
  },

  // SHOULDERS EXERCISES
  {
    id: '13',
    name: 'Barbell Overhead Press',
    category: 'shoulders',
    equipment: 'barbell',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    instructions: 'Press bar from shoulders straight overhead, lower with control.',
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: '14',
    name: 'Dumbbell Shoulder Press',
    category: 'shoulders',
    equipment: 'dumbbells',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    instructions: 'Press dumbbells from shoulders overhead, bring back down.',
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: '15',
    name: 'Lateral Raises',
    category: 'shoulders',
    equipment: 'dumbbells',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: [],
    instructions: 'Raise dumbbells to sides until arms parallel to ground.',
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: '16',
    name: 'Band Pull-Apart',
    category: 'shoulders',
    equipment: 'resistance_bands',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['back'],
    instructions: 'Hold band in front, pull apart by moving arms to sides.',
    image: 'https://via.placeholder.com/300x200',
  },

  // ARMS EXERCISES
  {
    id: '17',
    name: 'Barbell Curl',
    category: 'arms',
    equipment: 'barbell',
    primaryMuscles: ['arms'],
    secondaryMuscles: [],
    instructions: 'Curl bar up to chest, lower with control.',
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: '18',
    name: 'Dumbbell Curl',
    category: 'arms',
    equipment: 'dumbbells',
    primaryMuscles: ['arms'],
    secondaryMuscles: [],
    instructions: 'Curl dumbbells up, rotate wrists, lower with control.',
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: '19',
    name: 'Diamond Push-Ups',
    category: 'arms',
    equipment: 'bodyweight',
    primaryMuscles: ['arms'],
    secondaryMuscles: ['chest'],
    instructions: 'Push-ups with hands together forming diamond shape.',
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: '20',
    name: 'Cable Tricep Extension',
    category: 'arms',
    equipment: 'cable',
    primaryMuscles: ['arms'],
    secondaryMuscles: [],
    instructions: 'Push cable down by extending elbows, keep upper arms still.',
    image: 'https://via.placeholder.com/300x200',
  },

  // CORE EXERCISES
  {
    id: '21',
    name: 'Plank',
    category: 'core',
    equipment: 'bodyweight',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    instructions: 'Hold body straight in push-up position on forearms.',
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: '22',
    name: 'Russian Twists',
    category: 'core',
    equipment: 'bodyweight',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    instructions: 'Sit with knees bent, lean back, rotate torso side to side.',
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: '23',
    name: 'Weighted Sit-Ups',
    category: 'core',
    equipment: 'dumbbells',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    instructions: 'Hold weight on chest, perform sit-ups with control.',
    image: 'https://via.placeholder.com/300x200',
  },
  {
    id: '24',
    name: 'Cable Woodchop',
    category: 'core',
    equipment: 'cable',
    primaryMuscles: ['core'],
    secondaryMuscles: ['shoulders'],
    instructions: 'Pull cable diagonally across body from high to low.',
    image: 'https://via.placeholder.com/300x200',
  },
];

// Mock data for workout recommendations based on fitness level and goal
export const workoutTemplates = {
  beginner: {
    strength: {
      setsRange: [3, 3],
      repsRange: [8, 12],
      exercisesPerMuscle: 2,
    },
    muscle: {
      setsRange: [3, 4],
      repsRange: [10, 15],
      exercisesPerMuscle: 3,
    },
    endurance: {
      setsRange: [2, 3],
      repsRange: [15, 20],
      exercisesPerMuscle: 2,
    },
  },
  intermediate: {
    strength: {
      setsRange: [4, 5],
      repsRange: [6, 8],
      exercisesPerMuscle: 3,
    },
    muscle: {
      setsRange: [4, 5],
      repsRange: [8, 12],
      exercisesPerMuscle: 4,
    },
    endurance: {
      setsRange: [3, 4],
      repsRange: [15, 20],
      exercisesPerMuscle: 3,
    },
  },
  advanced: {
    strength: {
      setsRange: [5, 6],
      repsRange: [3, 6],
      exercisesPerMuscle: 3,
    },
    muscle: {
      setsRange: [4, 6],
      repsRange: [8, 12],
      exercisesPerMuscle: 5,
    },
    endurance: {
      setsRange: [4, 5],
      repsRange: [15, 25],
      exercisesPerMuscle: 4,
    },
  },
};

// Mock function to generate workout based on user selections
export const generateWorkout = (equipment, muscleGroup, fitnessLevel, goal) => {
  // Filter exercises by equipment and muscle group
  let availableExercises = mockExercises.filter(exercise => {
    const hasEquipment = equipment.includes(exercise.equipment);
    const targetsMuscle = exercise.primaryMuscles.includes(muscleGroup) || 
                         (muscleGroup === 'full_body');
    return hasEquipment && targetsMuscle;
  });

  // Get workout template
  const template = workoutTemplates[fitnessLevel][goal];
  
  // Randomly select exercises up to the limit
  const selectedExercises = [];
  const exerciseCount = Math.min(template.exercisesPerMuscle, availableExercises.length);
  
  for (let i = 0; i < exerciseCount; i++) {
    const randomIndex = Math.floor(Math.random() * availableExercises.length);
    const exercise = availableExercises[randomIndex];
    
    // Add workout details to exercise
    selectedExercises.push({
      ...exercise,
      sets: template.setsRange[0],
      reps: template.repsRange[1],
      restSeconds: goal === 'strength' ? 180 : goal === 'muscle' ? 90 : 60,
    });
    
    // Remove selected exercise to avoid duplicates
    availableExercises.splice(randomIndex, 1);
  }
  
  return selectedExercises;
};

// Mock workout history
export const mockWorkoutHistory = [
  {
    id: '1',
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    exercises: [
      {
        exerciseId: '1',
        exerciseName: 'Barbell Bench Press',
        sets: [
          { weight: 135, reps: 10 },
          { weight: 155, reps: 8 },
          { weight: 175, reps: 6 },
        ],
      },
      {
        exerciseId: '6',
        exerciseName: 'Barbell Row',
        sets: [
          { weight: 95, reps: 12 },
          { weight: 115, reps: 10 },
          { weight: 115, reps: 10 },
        ],
      },
    ],
    duration: 3600, // 1 hour in seconds
    totalVolume: 5130, // Total weight lifted
  },
  {
    id: '2',
    date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    exercises: [
      {
        exerciseId: '9',
        exerciseName: 'Barbell Squat',
        sets: [
          { weight: 185, reps: 8 },
          { weight: 205, reps: 6 },
          { weight: 225, reps: 5 },
        ],
      },
      {
        exerciseId: '10',
        exerciseName: 'Dumbbell Lunges',
        sets: [
          { weight: 40, reps: 12 },
          { weight: 40, reps: 12 },
          { weight: 40, reps: 10 },
        ],
      },
    ],
    duration: 2700, // 45 minutes
    totalVolume: 6910,
  },
];



