export function generateWorkout({ allExercises, equipment, muscleGroup, fitnessLevel, goal }) {

  // Normalize muscle group input to lowercase and remove extra spaces
  const normalizedMuscleGroup = muscleGroup ? muscleGroup.toLowerCase().trim() : '';

  // Handle case where muscleGroup is an an array
  const normalizedMuscleGroups = Array.isArray(muscleGroup)
    ? muscleGroup.map(m => m.toLowerCase().replace(/\s+/g, '_').trim())
    : normalizedMuscleGroup ? [normalizedMuscleGroup] : [];

  // Set default set/rep config based on goal
  const goalConfig = {
    strength: { sets: 4, reps: 5 },
    hypertrophy: { sets: 3, reps: 10 },
    endurance: { sets: 2, reps: 15 },
  };

  // Apply intensity modifier based on fitness level
  const levelModifier = {
    beginner: 0.8,
    intermediate: 1.0,
    advanced: 1.2,
  };

  // Fallback to hypertrophy if goal is missing
  const { sets, reps } = goalConfig[goal] || goalConfig.hypertrophy;

  // Fallback to intermediate if level is missing
  const modifier = levelModifier[fitnessLevel] || 1;

  // Map broad muscle groups to specific ExerciseDB targets
  const muscleGroupMapping = {
    chest: 'pectorals',
    back: ['lats', 'upper back'],
    legs: ['quads', 'hamstrings', 'glutes'],
    shoulders: 'delts',
    arms: ['biceps', 'triceps'],
    core: 'abs',
    abs: 'abs',
  };

  // Quick helpers to normalize strings
  const normalize = str => str.toLowerCase().trim();

  // Some exercises use "body weight" instead of "bodyweight"
  const resolveBodyWeight = eq => (normalize(eq) === 'bodyweight' ? 'body weight' : normalize(eq));

  const workout = [];

  for (const eq of equipment) {
    const normalizedEq = resolveBodyWeight(eq);

    // Filter exercises that match the selected muscle group(s) and equipment
    const matching = allExercises.filter(ex => {
      const exTarget = normalize(ex.target);
      const exEquip = normalize(ex.equipment);

      const isMuscleMatch = normalizedMuscleGroups.some(group => {
        const mapped = muscleGroupMapping[group];
        const mappedList = Array.isArray(mapped) ? mapped : [mapped];
        return mappedList.includes(exTarget) || group === exTarget;
      });

      const isEquipmentMatch = exEquip === normalizedEq || exEquip.includes(normalizedEq);

      return isMuscleMatch && isEquipmentMatch;
    });

    // Randomly pick 3 matching exercises per equipment
    const selected = matching
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(ex => {
        const isBodyWeight = normalize(ex.equipment).includes('body weight');

        return {
          id: ex.id,
          name: ex.name,
          sets: Math.round(sets * modifier),
          reps,
          weight: isBodyWeight ? null : Math.round(50 * modifier),
          equipment: ex.equipment,
          target: ex.target,
        };
      });

    // Add selected exercises to final workout array
    workout.push(...selected);
  }

  return workout;
}
