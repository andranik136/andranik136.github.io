import { Task, DailyNote } from '../types';
import { formatDateKey } from './dateUtils';

const STORAGE_KEYS = {
  TASKS: 'gorilla_tasks_list_v4',
  NOTES: 'gorilla_notes_dict_v4',
  THEME: 'gorilla_theme_pref_v4',
  LAST_EDIT: 'daily_tracker_last_local_edit_v4',
};

/**
 * Returns clean sample tasks centered around current date.
 */
export function getSampleTasks(): Task[] {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  const dateToday = formatDateKey(today);
  const dateYesterday = formatDateKey(new Date(y, m, d - 1));
  const dateTomorrow = formatDateKey(new Date(y, m, d + 1));
  const dateNextWeek = formatDateKey(new Date(y, m, d + 4));

  return [
    {
      id: 'task-1',
      title: 'Review Q4 Product Roadmap & Key Milestones',
      date: dateToday,
      completed: true,
      priority: 'p1',
      category: 'Work',
      time: '09:00',
      durationMinutes: 60,
      subtasks: [
        { id: 'st-1', title: 'Audit feature backlog', completed: true },
        { id: 'st-2', title: 'Draft Q4 milestone proposal', completed: true },
      ],
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'task-2',
      title: 'Refactor UI design system with blue-to-purple SVG icons',
      date: dateToday,
      completed: false,
      priority: 'p1',
      category: 'Ideas',
      time: '11:00',
      durationMinutes: 90,
      subtasks: [
        { id: 'st-3', title: 'Replace raw emojis with vector SVG icons', completed: true },
        { id: 'st-4', title: 'Verify responsive modal layouts', completed: false },
      ],
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'task-3',
      title: 'Evening Fitness & Strength Training',
      date: dateToday,
      completed: false,
      priority: 'p2',
      category: 'Fitness',
      time: '17:30',
      durationMinutes: 45,
      createdAt: Date.now() - 40000000,
    },
    {
      id: 'task-4',
      title: 'Team Sync & Daily Standup Meeting',
      date: dateYesterday,
      completed: true,
      priority: 'p2',
      category: 'Work',
      time: '10:00',
      durationMinutes: 30,
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: 'task-5',
      title: 'Organize workspace & archive weekly notes',
      date: dateYesterday,
      completed: true,
      priority: 'p3',
      category: 'Personal',
      time: '16:00',
      durationMinutes: 30,
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: 'task-6',
      title: 'Launch Daily Tracker production deployment',
      date: dateTomorrow,
      completed: false,
      priority: 'p1',
      category: 'Urgent',
      time: '09:30',
      durationMinutes: 120,
      createdAt: Date.now(),
    },
    {
      id: 'task-7',
      title: 'Deep dive into modern web animation standards',
      date: dateTomorrow,
      completed: false,
      priority: 'p3',
      category: 'Study',
      time: '14:00',
      durationMinutes: 60,
      createdAt: Date.now(),
    },
    {
      id: 'task-8',
      title: 'Weekend trail run & outdoor activity',
      date: dateNextWeek,
      completed: false,
      priority: 'p3',
      category: 'Fitness',
      time: '08:00',
      durationMinutes: 120,
      createdAt: Date.now(),
    }
  ];
}

/**
 * Returns initial sample daily notes with clean formatting.
 */
export function getSampleNotes(): Record<string, DailyNote> {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  const dateToday = formatDateKey(today);
  const dateYesterday = formatDateKey(new Date(y, m, d - 1));

  return {
    [dateToday]: {
      date: dateToday,
      content: `## Daily Focus & Reflections\n- **Primary Goal**: Build a clean, minimal productivity workspace.\n- **Key Takeaways**: Integrating SVG icons alongside daily notes and tasks creates a refined, professional experience.`,
      updatedAt: Date.now(),
    },
    [dateYesterday]: {
      date: dateYesterday,
      content: `## Evening Reflections\n- Completed all core work items ahead of schedule.\n- Great team feedback on the blue & purple visual hierarchy.\n- Remember to schedule recovery time before weekend sprint.`,
      updatedAt: Date.now() - 86400000,
    }
  };
}

// Local Storage Wrappers
export function loadTasks(): Task[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!data) {
      const sample = getSampleTasks();
      saveTasks(sample);
      return sample;
    }
    return JSON.parse(data);
  } catch (err) {
    return getSampleTasks();
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks:', err);
  }
}

export function loadNotes(): Record<string, DailyNote> {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (!data) {
      const sample = getSampleNotes();
      saveNotes(sample);
      return sample;
    }
    return JSON.parse(data);
  } catch (err) {
    return getSampleNotes();
  }
}

export function saveNotes(notes: Record<string, DailyNote>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  } catch (err) {
    console.error('Failed to save notes:', err);
  }
}

export function loadTheme(): 'dark' | 'light' {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved as 'dark' | 'light') || 'dark';
  } catch {
    return 'dark';
  }
}

export function saveTheme(theme: 'dark' | 'light'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (err) {
    console.error('Failed to save theme:', err);
  }
}

export function getLastLocalEdit(): number {
  try {
    const ts = localStorage.getItem(STORAGE_KEYS.LAST_EDIT);
    return ts ? Number(ts) : 0;
  } catch {
    return 0;
  }
}

export function saveLastLocalEdit(timestamp: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_EDIT, String(timestamp));
  } catch (err) {
    console.error('Failed to save last edit timestamp:', err);
  }
}

export function resetAllData(): { tasks: Task[]; notes: Record<string, DailyNote> } {
  localStorage.removeItem(STORAGE_KEYS.TASKS);
  localStorage.removeItem(STORAGE_KEYS.NOTES);
  const tasks = getSampleTasks();
  const notes = getSampleNotes();
  saveTasks(tasks);
  saveNotes(notes);
  return { tasks, notes };
}

/**
 * Merges local and cloud tracker data using timestamps to ensure newest data is preserved per item.
 */
export function mergeTrackerData(
  localTasks: Task[],
  localNotes: Record<string, DailyNote>,
  localTheme: 'dark' | 'light',
  lastLocalEditTs: number,
  cloudData: { tasks?: Task[]; notes?: Record<string, DailyNote>; theme?: 'dark' | 'light'; updatedAt?: number }
) {
  const cloudTasks = cloudData.tasks || [];
  const cloudNotes = cloudData.notes || {};
  const cloudTheme = cloudData.theme || localTheme;
  const cloudUpdatedAt = cloudData.updatedAt || 0;

  // 1. Merge Notes by per-note updatedAt timestamp
  const mergedNotes: Record<string, DailyNote> = {};
  const allNoteKeys = new Set([...Object.keys(localNotes), ...Object.keys(cloudNotes)]);

  for (const dateKey of allNoteKeys) {
    const localNote = localNotes[dateKey];
    const cloudNote = cloudNotes[dateKey];

    if (localNote && !cloudNote) {
      mergedNotes[dateKey] = localNote;
    } else if (!localNote && cloudNote) {
      const cloudTs = cloudNote.updatedAt || cloudUpdatedAt;
      if (lastLocalEditTs > cloudUpdatedAt) {
        if (cloudTs > lastLocalEditTs) {
          mergedNotes[dateKey] = cloudNote;
        }
      } else {
        mergedNotes[dateKey] = cloudNote;
      }
    } else if (localNote && cloudNote) {
      const localTs = localNote.updatedAt || lastLocalEditTs;
      const cloudTs = cloudNote.updatedAt || cloudUpdatedAt;
      mergedNotes[dateKey] = localTs >= cloudTs ? localNote : cloudNote;
    }
  }

  // 2. Merge Tasks by Task ID & timestamps
  const localTaskMap = new Map(localTasks.map((t) => [t.id, t]));
  const cloudTaskMap = new Map(cloudTasks.map((t) => [t.id, t]));
  const allTaskIds = new Set([...localTaskMap.keys(), ...cloudTaskMap.keys()]);
  const mergedTasks: Task[] = [];

  for (const id of allTaskIds) {
    const localTask = localTaskMap.get(id);
    const cloudTask = cloudTaskMap.get(id);

    if (localTask && !cloudTask) {
      mergedTasks.push(localTask);
    } else if (!localTask && cloudTask) {
      const cloudTs = cloudTask.updatedAt || cloudTask.createdAt || cloudUpdatedAt;
      if (lastLocalEditTs > cloudUpdatedAt) {
        if (cloudTs > lastLocalEditTs) {
          mergedTasks.push(cloudTask);
        }
      } else {
        mergedTasks.push(cloudTask);
      }
    } else if (localTask && cloudTask) {
      const localTs = localTask.updatedAt || localTask.createdAt || lastLocalEditTs;
      const cloudTs = cloudTask.updatedAt || cloudTask.createdAt || cloudUpdatedAt;
      mergedTasks.push(localTs >= cloudTs ? localTask : cloudTask);
    }
  }

  // Theme preference
  const mergedTheme = lastLocalEditTs > cloudUpdatedAt ? localTheme : cloudTheme;

  return {
    tasks: mergedTasks,
    notes: mergedNotes,
    theme: mergedTheme,
  };
}

