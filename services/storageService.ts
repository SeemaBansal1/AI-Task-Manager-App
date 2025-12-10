import { Task, UserStats } from '../types';

const TASKS_KEY = 'your_buddy_tasks';
const STATS_KEY = 'your_buddy_stats';

const DEFAULT_STATS: UserStats = {
  streak: 0,
  lastLoginDate: '',
  tasksCompletedTotal: 0
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

export const getTasks = (): Task[] => {
  const data = localStorage.getItem(TASKS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveStats = (stats: UserStats) => {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

export const getStats = (): UserStats => {
  const data = localStorage.getItem(STATS_KEY);
  return data ? JSON.parse(data) : DEFAULT_STATS;
};

// Call this on app load to reset streak if user missed a day
export const checkStreakOnLoad = (): UserStats => {
  const stats = getStats();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0];

  // If we have a completion date
  if (stats.lastCompletionDate) {
      // If last completion was before yesterday, the streak is broken
      if (stats.lastCompletionDate < yesterdayString) {
          stats.streak = 0;
          saveStats(stats);
      }
  } else if (stats.lastLoginDate && stats.lastLoginDate < yesterdayString && stats.streak > 0) {
      // Fallback for migration or older logic: if no completion date but login date is old
      stats.streak = 0;
      saveStats(stats);
  }
  
  // Update login date just for record
  if (stats.lastLoginDate !== today) {
    stats.lastLoginDate = today;
    saveStats(stats);
  }
  
  return stats;
};

// Call this when a task is marked as DONE
export const registerTaskCompletion = (): UserStats => {
  const stats = getStats();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0];

  if (stats.lastCompletionDate === today) {
    // Already counted for today, just increment total
    stats.tasksCompletedTotal += 1;
  } else if (stats.lastCompletionDate === yesterdayString) {
    // Consecutive day!
    stats.streak += 1;
    stats.lastCompletionDate = today;
    stats.tasksCompletedTotal += 1;
  } else {
    // Streak broken or new streak, but now we started today
    stats.streak = 1;
    stats.lastCompletionDate = today;
    stats.tasksCompletedTotal += 1;
  }

  saveStats(stats);
  return stats;
};

// Legacy support if needed, but we rely on checkStreakOnLoad now
export const updateStreak = (): UserStats => {
  return checkStreakOnLoad();
};