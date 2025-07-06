export function generateWorkout({ allExercises, equipment, muscleGroup, fitnessLevel, goal }) {
  console.log('Generating workout...');
  console.log('Received muscleGroup:', muscleGroup);
  console.log('Received equipment:', equipment);
  // Check if muscleGroup is undefined or null, and provide a default fallback value if necessary
  const normalizedMuscleGroup = muscleGroup ? muscleGroup.toLowerCase().trim() : '';
  console.log('Normalized Muscle Group:', normalizedMuscleGroup);
  const normalizedMuscleGroups = Array.isArray(muscleGroup) 
    ? muscleGroup.map(muscle => muscle.toLowerCase().replace(/\s+/g, '_').trim())
    : normalizedMuscleGroup ? [normalizedMuscleGroup] : [];

  console.log('Normalized Muscle Groups:', normalizedMuscleGroups);
  // Log selected equipment
  console.log('Selected Equipment:', equipment);

  // Filter exercises by muscle group and equipment
  const matchingExercises = allExercises.filter(ex => {
    const normalizedTarget = ex.target ? ex.target.toLowerCase().trim() : '';  // Normalize the target (muscle group)
    const normalizedEquipment = ex.equipment ? ex.equipment.toLowerCase().trim() : '';  // Normalize the equipment

    console.log('Checking Exercise:', ex.name);
    console.log('Exercise Target:', normalizedTarget);
    console.log('Exercise Equipment:', normalizedEquipment);

    // Check if the exercise's target matches the selected muscle group
   const muscleGroupMapping = {
      'chest': 'pectorals',
      'back': ['lats', 'upper back'],
      'legs': ['quads', 'hamstrings', 'glutes'],
      'shoulders': 'delts',
      'arms': ['biceps', 'triceps'],
      'core': 'abs',
      'abs': 'abs'
    };

  let isMuscleMatch = normalizedMuscleGroups.some(group => {
  const mapped = muscleGroupMapping[group];
  if (mapped) {
    const mappedList = Array.isArray(mapped) ? mapped : [mapped];
    return mappedList.includes(normalizedTarget);
  }
  return group === normalizedTarget; // fallback direct match
  });


    // Check if the exercise's equipment matches any selected equipment
    // Handle the space issue: "body weight" vs "bodyweight"
    const normalizedSelectedEquipment = equipment.map(eq => {
      const normalized = eq.toLowerCase().trim();
      // Convert "bodyweight" to "body weight" to match database
      return normalized === 'bodyweight' ? 'body weight' : normalized;
    });

    const isEquipmentMatch = normalizedSelectedEquipment.some(eq => 
      normalizedEquipment === eq || normalizedEquipment.includes(eq)
    );
    console.log('Is Muscle Match:', isMuscleMatch);
    console.log('Is Equipment Match:', isEquipmentMatch);

    console.log('---');
    console.log('Checking Exercise:', ex.name);
    console.log('Target:', normalizedTarget);
    console.log('Equipment:', normalizedEquipment);
    console.log('Normalized Muscle Groups:', normalizedMuscleGroups);
    console.log('Is Muscle Match:', isMuscleMatch);
    console.log('Is Equipment Match:', isEquipmentMatch);
    console.log('Included in results:', isMuscleMatch && isEquipmentMatch);

    return isMuscleMatch && isEquipmentMatch;
  });

  console.log('Matching Exercises:', matchingExercises);  // Log the matching exercises

  if (matchingExercises.length === 0) {
    console.log('No exercises found for the selected filters.');
    return [];
  }

  // Goal and level configuration
  const goalConfig = {
    strength: { sets: 4, reps: 5 },
    hypertrophy: { sets: 3, reps: 10 },
    endurance: { sets: 2, reps: 15 },
  };

  const levelModifier = {
    beginner: 0.8,
    intermediate: 1.0,
    advanced: 1.2,
  };

  const { sets, reps } = goalConfig[goal] || goalConfig.hypertrophy;
  const modifier = levelModifier[fitnessLevel] || 1;

  // Select up to 3 exercises based on the modifier (using random selection)
  const totalExercises = Math.max(3, Math.round(3 * modifier));  // Ensures at least 3 exercises are selected
  const selectedExercises = matchingExercises
    .sort(() => 0.5 - Math.random())  // Shuffle exercises
    .slice(0, totalExercises);  // Slice out only the selected exercises

  console.log('Selected Exercises for Workout:', selectedExercises);  // Log the selected exercises

  // Map over selected exercises and assign sets, reps, and weight
  return selectedExercises.map(ex => ({
    id: ex.id,
    name: ex.name,
    sets: Math.round(sets * modifier),  // Apply modifier to sets
    reps: reps,  // Keep reps as per goal
    weight: Math.round(50 * modifier),  // Example: Assign a random weight based on fitness level modifier
    equipment: ex.equipment,
    target: ex.target,
  }));
}
