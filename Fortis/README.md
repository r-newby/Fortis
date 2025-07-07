# Fortis
![Fortis Logo](Fortis/assets/splash.png)
Fortis is a mobile fitness tracking app built with React Native and Supabase. It allows users to create, log, and manage custom and auto-generated workouts based on fitness level, goals, and available equipment.

## Features

* Supabase authentication and profile management
* Onboarding flow to capture fitness level and goal
* Custom workout logging with sets, reps, and weights
* Auto-generated workouts based on:

  * Muscle groups
  * Selected equipment
  * Fitness level and goal
* Local workout storage using AsyncStorage
* Workout history display
* Personal record tracking
* Clean UI using Material 3 design system

## Tech Stack

* React Native with Expo
* Supabase (Auth and Database)
* AsyncStorage
* PostgreSQL (via Supabase)

## Project Structure

```
src/
├── components/          # Reusable UI components
├── context/             # Global state (AppContext, WorkoutContext)
├── screens/             # Auth, onboarding, dashboard, and workout flows
├── utils/               # AsyncStorage logic, theme, and helpers
├── supabase/            # Supabase client setup
```

## Supabase Schema

### profiles

| Column         | Type        |
| -------------- | ----------- |
| id             | uuid        |
| username       | text        |
| fitness\_level | text        |
| goal           | text        |
| created\_at    | timestamptz |

### workouts

| Column        | Type        |
| ------------- | ----------- |
| id            | uuid        |
| user\_id      | uuid        |
| date          | date        |
| intensity     | int         |
| muscle\_group | text        |
| totalVolume   | int         |
| created\_at   | timestamptz |

### workout\_exercises

| Column       | Type        |
| ------------ | ----------- |
| id           | uuid        |
| workout\_id  | uuid        |
| exercise\_id | text        |
| sets         | int         |
| reps         | int         |
| weight       | int         |
| created\_at  | timestamptz |

### exercises

| Column     | Type |
| ---------- | ---- |
| id         | text |
| name       | text |
| target     | text |
| equipment  | text |
| body\_part | text |
| gif\_url   | text |


## Example User Flow

1. User signs up or logs in via Supabase Auth
2. Onboarding flow asks for fitness level and goal
3. User selects custom or generated workout path
4. User logs workout data (sets, reps, weights)
5. Workout and exercise logs are saved to Supabase and AsyncStorage
6. Dashboard shows recent workouts and progress stats

## Environment

* Node.js >= 18
* Expo SDK 53+
* Supabase CLI (for optional local development/testing)

```
# Install Supabase CLI (optional)
npm install -g supabase
```

## Running Locally

```bash
npx expo start
```
## Testing
We use Jest to test core logic in the app. Current tests focus on the generateWorkout function, which builds workouts based on user-selected equipment, muscle groups, fitness level, and goal.

### To Run Tests
bashnpm test

### Current Coverage

Filters exercises by equipment and muscle group
Handles string and array formats for muscleGroup
Applies goal-based logic (e.g., hypertrophy = 3 sets of 10 reps)
Verifies output structure (sets, reps, weight)
Returns an empty array when no matches are found

### Sample Output
 PASS  __tests__/generateWorkout.test.js
  generateWorkout
    ✓ returns matching exercises for selected equipment and muscle groups (16 ms)
    ✓ returns empty array if no matches are found (5 ms)
    ✓ returns exercise with correct sets and reps for hypertrophy goal (4 ms)
    ✓ handles array input for muscle groups (2 ms)
    ✓ handles string input for muscle groups (1 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        0.389 s, estimated 1 s
Ran all test suites.

### Planned Improvements
Add tests for beginner and advanced fitness levels
Cover more input edge cases (null values, invalid types)
Test input normalization for equipment and muscle groups
Begin integration testing and component-level tests in Week 5

