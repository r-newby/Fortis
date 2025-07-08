export function generateWorkout({ allExercises, equipment, muscleGroup, fitnessLevel, goal }) {
  console.log('Generating workout...');
  console.log('Muscle Group:', muscleGroup);
  console.log('Equipment:', equipment);

  const normalizedMuscleGroup = muscleGroup && typeof muscleGroup === 'string' ? muscleGroup.toLowerCase().trim() : '';
  const normalizedMuscleGroups = Array.isArray(muscleGroup)
    ? muscleGroup.map(m => m.toLowerCase().replace(/\s+/g, '_').trim())
    : normalizedMuscleGroup ? [normalizedMuscleGroup] : [];

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

  const muscleGroupMapping = {
    chest: 'pectorals',
    back: ['lats', 'upper back'],
    legs: ['quads', 'hamstrings', 'glutes'],
    shoulders: 'delts',
    arms: ['biceps', 'triceps'],
    core: 'abs',
    abs: 'abs'
  };

  const normalize = str => str ? str.toLowerCase().trim() : '';
  const resolveBodyWeight = eq => (normalize(eq) === 'bodyweight' ? 'body weight' : normalize(eq));

  const workout = [];

  for (const eq of equipment) {
    const normalizedEq = resolveBodyWeight(eq);

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

    const selected = matching
      .sort(() => 0.5 - Math.random())
      .slice(0, 3) // get 3 per equipment
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

    workout.push(...selected);
  }

  return workout;
}
