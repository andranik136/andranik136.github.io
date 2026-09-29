import { Task, DailyNote } from '../types';
import { formatDateKey } from './dateUtils';

const STORAGE_KEYS = {
  TASKS: 'gorilla_tasks_list_v4',
  NOTES: 'gorilla_notes_dict_v4',
  THEME: 'gorilla_theme_pref_v4',
  LAST_EDIT: 'daily_tracker_last_local_edit_v4',
  NEWS_SIDEBAR_OPEN: 'daily_tracker_news_sidebar_open_v4',
};

/**
 * Returns empty initial task array.
 */
export function getSampleTasks(): Task[] {
  return [];
}

/**
 * Returns empty initial daily notes dictionary.
 */
export function getSampleNotes(): Record<string, DailyNote> {
  return {};
}

// Local Storage Wrappers
export function loadTasks(): Task[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!data) {
      saveTasks([]);
      return [];
    }
    return JSON.parse(data);
  } catch (err) {
    return [];
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
      saveNotes({});
      return {};
    }
    return JSON.parse(data);
  } catch (err) {
    return {};
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

export function loadNewsSidebarOpen(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.NEWS_SIDEBAR_OPEN);
    if (saved === null) return true;
    return saved === 'true';
  } catch {
    return true;
  }
}

export function saveNewsSidebarOpen(isOpen: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NEWS_SIDEBAR_OPEN, String(isOpen));
  } catch (err) {
    console.error('Failed to save news sidebar state:', err);
  }
}


export function resetAllData(): { tasks: Task[]; notes: Record<string, DailyNote> } {
  localStorage.removeItem(STORAGE_KEYS.TASKS);
  localStorage.removeItem(STORAGE_KEYS.NOTES);
  saveTasks([]);
  saveNotes({});
  return { tasks: [], notes: {} };
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

