export function generateWorkout({ allExercises, equipment, muscleGroup, fitnessLevel, goal }) {


  // Equipment mapping - now using exact database values as IDs
  // No mapping needed since we're using database values directly
  const equipmentMapping = {
    'dumbbell': 'dumbbell',
    'barbell': 'barbell',
    'body weight': 'body weight',
    'cable': 'cable',
    'resistance band': 'resistance band',
    'kettlebell': 'kettlebell',
    'medicine ball': 'medicine ball',
    'smith machine': 'smith machine',
    // Handle legacy/alternative names
    'dumbbells': 'dumbbell',
    'bodyweight': 'body weight',
    'cables': 'cable',
    'resistance bands': 'resistance band',
    'kettlebells': 'kettlebell'
  };

  // Updated muscle group mapping based onactual body_part values
  const muscleGroupMapping = {
    chest: ['chest'],
    back: ['back'],
    legs: ['upper legs', 'lower legs'],
    shoulders: ['shoulders'],
    arms: ['upper arms', 'lower arms'],
    core: ['waist'],
    abs: ['waist'],
    cardio: ['cardio'],
    full_body: ['chest', 'back', 'shoulders', 'upper arms', 'lower arms', 'upper legs', 'lower legs', 'waist']
  };

  const goalConfig = {
    strength: { sets: 4, reps: 5 },
    muscle: { sets: 3, reps: 10 },
    endurance: { sets: 2, reps: 15 },

  };

  const levelModifier = {
    beginner: 0.8,
    intermediate: 1.0,
    advanced: 1.2,
  };

  const { sets, reps } = goalConfig[goal] || goalConfig.general;
  const modifier = levelModifier[fitnessLevel] || 1.0;


  // Normalize input
  const normalizedMuscleGroup = muscleGroup ? muscleGroup.toLowerCase().trim() : '';

  // Get target muscles for the selected muscle group
  const targetMuscles = muscleGroupMapping[normalizedMuscleGroup] || [normalizedMuscleGroup];


  // Map equipment to database values
  const dbEquipment = equipment.map(eq => {
    const mapped = equipmentMapping[eq.toLowerCase().trim()];
    return mapped || eq;
  });



  // Filter exercises
  const matchingExercises = allExercises.filter(exercise => {
    if (!exercise) return false;

    const exBodyPart = exercise.body_part ? exercise.body_part.toLowerCase().trim() : '';
    const exTarget = exercise.target ? exercise.target.toLowerCase().trim() : '';
    const exEquipment = exercise.equipment ? exercise.equipment.toLowerCase().trim() : '';

    // Check muscle group match
    const muscleMatch = targetMuscles.some(muscle => {
      const normalizedMuscle = muscle.toLowerCase().trim();
      return exBodyPart.includes(normalizedMuscle) ||
        exTarget.includes(normalizedMuscle) ||
        exBodyPart === normalizedMuscle ||
        exTarget === normalizedMuscle;
    });

    // Check equipment match - handle compound equipment strings
    const equipmentMatch = dbEquipment.some(eq => {
      const normalizedEq = eq.toLowerCase().trim();

      // Exact match
      if (exEquipment === normalizedEq) return true;

      // Handle compound equipment strings (e.g., "dumbbell, exercise ball")
      if (exEquipment.includes(',')) {
        const equipmentParts = exEquipment.split(',').map(part => part.trim());
        return equipmentParts.some(part => part === normalizedEq);
      }

      // Handle equipment with parentheses (e.g., "body weight (with resistance band)")
      if (exEquipment.includes('(')) {
        const mainEquipment = exEquipment.split('(')[0].trim();
        return mainEquipment === normalizedEq;
      }

      // Partial match for similar equipment
      return exEquipment.includes(normalizedEq);
    });



    return muscleMatch && equipmentMatch;
  });


  // Prioritize compound movements
  const prioritizedExercises = [...matchingExercises].sort((a, b) => {
    const compoundKeywords = ['press', 'row', 'squat', 'deadlift', 'pull', 'push'];
    const aName = (a.name || '').toLowerCase();
    const bName = (b.name || '').toLowerCase();

    const aIsCompound = compoundKeywords.some(keyword => aName.includes(keyword));
    const bIsCompound = compoundKeywords.some(keyword => bName.includes(keyword));

    if (aIsCompound && !bIsCompound) return -1;
    if (!aIsCompound && bIsCompound) return 1;
    return 0;
  });

  // Select 4-6 exercises based on fitness level, more for full body
  const getExerciseCount = (muscleGroup, fitnessLevel) => {
    if (muscleGroup === 'full_body') {
      // Full body needs more exercises to hit all muscle groups
      return fitnessLevel === 'beginner' ? 6 : fitnessLevel === 'advanced' ? 10 : 8;
    } else if (muscleGroup === 'cardio') {
      // Cardio typically has fewer, longer duration exercises
      return fitnessLevel === 'beginner' ? 2 : fitnessLevel === 'advanced' ? 4 : 3;
    } else {
      // Regular muscle group workouts
      return fitnessLevel === 'beginner' ? 4 : fitnessLevel === 'advanced' ? 6 : 5;
    }
  };

  const exerciseCount = Math.min(
    getExerciseCount(normalizedMuscleGroup, fitnessLevel),
    prioritizedExercises.length
  );

  // Ensure variety
  const selectedExercises = [];
  for (let i = 0; i < prioritizedExercises.length && selectedExercises.length < exerciseCount; i++) {
    const exercise = prioritizedExercises[i];

    // Check for similar exercises (avoid duplicates)
    const isSimilar = selectedExercises.some(selected => {
      const exerciseWords = (exercise.name || '').toLowerCase().split(' ');
      const selectedWords = (selected.name || '').toLowerCase().split(' ');

      const sharedWords = exerciseWords.filter(word =>
        selectedWords.includes(word) && word.length > 3
      );

      return sharedWords.length >= 2;
    });

    if (!isSimilar) {
      selectedExercises.push(exercise);
    }
  }

  // Generate workout with proper sets, reps, and weights
  const workout = selectedExercises.map((exercise, index) => {
    const exerciseName = (exercise.name || '').toLowerCase();

    // Adjust sets and reps based on exercise type, position, and workout type
    let exerciseSets = Math.round(sets * modifier);
    let exerciseReps = reps;

    // Special handling for cardio
    if (normalizedMuscleGroup === 'cardio') {
      exerciseSets = 1; // Cardio typically one continuous set
      exerciseReps = 30; // 30 seconds/reps as default
    } else {
      // First exercise gets more sets (usually compound)
      if (index === 0) exerciseSets = Math.max(exerciseSets, sets);

      // Adjust reps based on exercise type
      if (exerciseName.includes('curl') || exerciseName.includes('raise') || exerciseName.includes('fly')) {
        exerciseReps = Math.max(12, reps); // Isolation exercises
      } else if (exerciseName.includes('press') || exerciseName.includes('row')) {
        exerciseReps = Math.max(8, reps - 2); // Compound movements
      }
    }

    // Calculate weight based on equipment and exercise type
    let weight = null;
    const equipment = (exercise.equipment || '').toLowerCase();

    if (equipment.includes('dumbbell')) {
      if (exerciseName.includes('curl')) weight = Math.round(15 * modifier);
      else if (exerciseName.includes('press')) weight = Math.round(25 * modifier);
      else if (exerciseName.includes('fly')) weight = Math.round(15 * modifier);
      else weight = Math.round(20 * modifier);
    } else if (equipment.includes('barbell')) {
      if (exerciseName.includes('press')) weight = Math.round(95 * modifier);
      else if (exerciseName.includes('row')) weight = Math.round(85 * modifier);
      else weight = Math.round(65 * modifier);
    }



    return {
      id: exercise.id,
      name: exercise.name,
      sets: exerciseSets,
      reps: exerciseReps,
      weight,
      equipment: exercise.equipment,
      target: exercise.target,
      body_part: exercise.body_part,
      gif_url: exercise.gif_url,
    };
  });



  return workout;
}