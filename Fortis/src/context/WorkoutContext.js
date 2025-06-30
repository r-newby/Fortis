// src/context/WorkoutContext.js
import React, { createContext, useContext, useState } from 'react';
import { generateWorkout } from '../utils/mockData';

const WorkoutContext = createContext();

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

  const startNewWorkout = (equipment, muscleGroup, fitnessLevel, goal) => {
    const exercises = generateWorkout(equipment, muscleGroup, fitnessLevel, goal);
    
    setSelectedEquipment(equipment);
    setSelectedMuscleGroup(muscleGroup);
    setWorkoutExercises(exercises);
    setWorkoutStartTime(new Date());
    
    // Initialize current workout structure
    const workout = {
      equipment,
      muscleGroup,
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

  const completeWorkout = () => {
    if (!currentWorkout || !workoutStartTime) return null;

    const duration = Math.floor((new Date() - workoutStartTime) / 1000);
    const totalVolume = currentWorkout.exercises.reduce((total, exercise) => {
      return total + exercise.completedSets.reduce((exTotal, set) => {
        return exTotal + (set.weight * set.reps);
      }, 0);
    }, 0);

    const completedWorkout = {
      ...currentWorkout,
      date: new Date().toISOString(),
      duration,
      totalVolume,
    };

    // Reset workout state
    setCurrentWorkout(null);
    setSelectedEquipment([]);
    setSelectedMuscleGroup('');
    setWorkoutExercises([]);
    setWorkoutStartTime(null);

    return completedWorkout;
  };

  const value = {
    currentWorkout,
    selectedEquipment,
    selectedMuscleGroup,
    workoutExercises,
    workoutStartTime,
    startNewWorkout,
    addSet,
    completeWorkout,
  };

  return (
    <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
  );
};