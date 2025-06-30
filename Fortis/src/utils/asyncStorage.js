// src/utils/asyncStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_PROFILE: 'userProfile',
  WORKOUTS: 'workouts',
  EXERCISES: 'exercises',
  PERSONAL_RECORDS: 'personalRecords',
  APP_SETTINGS: 'appSettings',
};

export const storage = {
  // User Profile
  async getUserProfile() {
    try {
      const profile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  async setUserProfile(profile) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      return true;
    } catch (error) {
      console.error('Error saving user profile:', error);
      return false;
    }
  },

  // Workouts
  async getWorkouts() {
    try {
      const workouts = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUTS);
      return workouts ? JSON.parse(workouts) : [];
    } catch (error) {
      console.error('Error getting workouts:', error);
      return [];
    }
  },

  async saveWorkout(workout) {
    try {
      const workouts = await this.getWorkouts();
      workouts.push({
        ...workout,
        id: Date.now().toString(),
        date: new Date().toISOString(),
      });
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
      return true;
    } catch (error) {
      console.error('Error saving workout:', error);
      return false;
    }
  },

  // Personal Records
  async getPersonalRecords() {
    try {
      const records = await AsyncStorage.getItem(STORAGE_KEYS.PERSONAL_RECORDS);
      return records ? JSON.parse(records) : {};
    } catch (error) {
      console.error('Error getting personal records:', error);
      return {};
    }
  },

  async updatePersonalRecord(exerciseId, record) {
    try {
      const records = await this.getPersonalRecords();
      const currentRecord = records[exerciseId];
      
      // Update if new record is better
      if (!currentRecord || record.weight > currentRecord.weight) {
        records[exerciseId] = record;
        await AsyncStorage.setItem(STORAGE_KEYS.PERSONAL_RECORDS, JSON.stringify(records));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating personal record:', error);
      return false;
    }
  },

  // Clear all data
  async clearAllData() {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  },
};