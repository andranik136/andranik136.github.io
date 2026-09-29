export type Priority = 'p1' | 'p2' | 'p3' | 'p4';

export type Category = 'Work' | 'Personal' | 'Fitness' | 'Ideas' | 'Urgent' | 'Study';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  priority: Priority;
  category: Category;
  time?: string; // e.g. "09:30" or "14:00"
  durationMinutes?: number; // e.g. 30, 60
  subtasks?: Subtask[];
  createdAt: number;
  updatedAt?: number;
}

export interface DailyNote {
  date: string; // YYYY-MM-DD
  content: string;
  updatedAt: number;
}

export interface Habit {
  id: string;
  title: string;
  icon: string; // emoji or lucide icon name
  color: string; // hex or tailwind color
  completedDates: string[]; // Array of YYYY-MM-DD strings
}

export type ViewMode = 'calendar' | 'timeline';

export interface FilterOptions {
  searchQuery: string;
  category: Category | 'All';
  priority: Priority | 'All';
  status: 'all' | 'pending' | 'completed';
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'unsaved' | 'offline' | 'error';

