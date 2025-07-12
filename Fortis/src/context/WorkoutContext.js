// src/context/WorkoutContext.js
import React, { createContext, useContext, useState } from 'react';
import { generateWorkout } from '../utils/mockData';

const WorkoutContext = createContext();

// Custom hook to consume the WorkoutContext
export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within WorkoutProvider');
  }
  return context;
};

export const WorkoutProvider = ({ children }) => {
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [isCustomWorkout, setIsCustomWorkout] = useState(false);

  // Initializes a new workout, either custom or generated
  const startNewWorkout = ({
    equipment = [],
    muscleGroup = '',
    fitnessLevel,
    goal,
    isCustom = false,
  }) => {
    setIsCustomWorkout(isCustom);
    setSelectedEquipment(equipment);
    setSelectedMuscleGroup(muscleGroup);
    setWorkoutStartTime(new Date());

    let exercises = [];

    if (!isCustom) {
      exercises = generateWorkout(equipment, muscleGroup, fitnessLevel, goal);
      setWorkoutExercises(exercises);
    }

    const workout = {
      isCustom,
      equipment,
      muscleGroup,
      date: new Date().toISOString(), // Add date for tracking and filtering
      exercises: exercises.map(ex => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        plannedSets: ex.sets,
        plannedReps: ex.reps,
        completedSets: [],
      })),
    };

    setCurrentWorkout(workout);
    return workout;
  };

  // Adds or updates a set for a specific exercise in the workout
  const addSet = (exerciseId, setData, index = null) => {
    if (!currentWorkout) return;

    const updatedWorkout = {
      ...currentWorkout,
      exercises: currentWorkout.exercises.map(ex => {
        if (ex.exerciseId === exerciseId) {
          const updatedSets = [...ex.completedSets];

          if (index !== null && index < updatedSets.length) {
            updatedSets[index] = { ...updatedSets[index], ...setData };
          } else {
            updatedSets.push(setData);
          }

          return { ...ex, completedSets: updatedSets };
        }
        return ex;
      }),
    };

    setCurrentWorkout(updatedWorkout);
  };

  // Adds a new exercise to the workout if it hasn't been added yet
  const addExerciseToWorkout = (exercise) => {
    if (!currentWorkout) return;

    const alreadyExists = currentWorkout.exercises.find(
      (ex) => ex.exerciseId === exercise.exerciseId
    );
    if (alreadyExists) return;

    const updatedWorkout = {
      ...currentWorkout,
      exercises: [
        ...currentWorkout.exercises,
        {
          ...exercise,
          plannedSets: 3,
          plannedReps: 10,
          completedSets: [],
        },
      ],
    };

    setCurrentWorkout(updatedWorkout);
  };

  /*
  // (Legacy version — not currently used)
  const addSet = (exerciseId, setData) => {
    if (!currentWorkout) return;

    const updatedWorkout = {
      ...currentWorkout,
      exercises: currentWorkout.exercises.map(ex => {
        if (ex.exerciseId === exerciseId) {
          return {
            ...ex,
            completedSets: [...ex.completedSets, setData],
          };
        }
        return ex;
      }),
    };

    setCurrentWorkout(updatedWorkout);
  };
  */

  // Completes the current workout and returns summary data
  const completeWorkout = () => {
    if (!currentWorkout || !workoutStartTime) return null;

    const duration = Math.floor((new Date() - workoutStartTime) / 1000); // in seconds

    const totalVolume = currentWorkout.exercises.reduce((total, exercise) => {
      return total + exercise.completedSets.reduce((exTotal, set) => {
        return exTotal + (set.weight * set.reps);
      }, 0);
    }, 0);

    const completedWorkout = {
      ...currentWorkout,
      date: new Date().toISOString(), // override with completion time
      duration,
      totalVolume,
    };

    // Clear state after completion
    setCurrentWorkout(null);
    setSelectedEquipment([]);
    setSelectedMuscleGroup('');
    setWorkoutExercises([]);
    setWorkoutStartTime(null);
    setIsCustomWorkout(false);

    return completedWorkout;
  };

  // Context value available to consumers
  const value = {
    currentWorkout,
    selectedEquipment,
    selectedMuscleGroup,
    workoutExercises,
    workoutStartTime,
    isCustomWorkout,
    startNewWorkout,
    addSet,
    addExerciseToWorkout,
    completeWorkout,
  };

  return (
    <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
  );
};
