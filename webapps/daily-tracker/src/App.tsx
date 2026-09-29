import React from 'react';
import clsx from 'clsx';
import { Task, DailyNote, UserProfile, SyncStatus } from './types';
import { formatDateKey, parseDateKey } from './utils/dateUtils';
import { 
  loadTasks, 
  saveTasks, 
  loadNotes, 
  saveNotes, 
  loadTheme,
  saveTheme,
  resetAllData,
  getLastLocalEdit,
  saveLastLocalEdit,
  mergeTrackerData,
  loadNewsSidebarOpen,
  saveNewsSidebarOpen
} from './utils/storage';
import { 
  auth, 
  onAuthStateChanged, 
  saveUserDataToCloud, 
  fetchUserDataFromCloud,
  db,
  User
} from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Header } from './components/Header';
import { CalendarGrid } from './components/CalendarGrid';
import { DailyNotes } from './components/Sidebar/DailyNotes';
import { DailyTasks } from './components/Sidebar/DailyTasks';
import { NewsSidebar } from './components/Sidebar/NewsSidebar';
import { SearchModal } from './components/Modals/SearchModal';
import { AnalyticsModal } from './components/Modals/AnalyticsModal';
import { AuthModal } from './components/Modals/AuthModal';

export function App() {
  const todayDateKey = formatDateKey(new Date());

  // App State
  const [selectedDateKey, setSelectedDateKey] = React.useState<string>(todayDateKey);
  const [currentYear, setCurrentYear] = React.useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = React.useState<number>(new Date().getMonth());

  const [theme, setTheme] = React.useState<'dark' | 'light'>(() => loadTheme());
  const [isNewsSidebarOpen, setIsNewsSidebarOpen] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return false;
    }
    return loadNewsSidebarOpen();
  });

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsNewsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [tasks, setTasks] = React.useState<Task[]>(() => loadTasks());
  const [notes, setNotes] = React.useState<Record<string, DailyNote>>(() => loadNotes());

  // User Auth & Cloud Sync States
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus>('idle');
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);

  // Modal States
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = React.useState(false);

  // PWA Install Prompt State
  const [deferredInstallPrompt, setDeferredInstallPrompt] = React.useState<any>(null);
  const [canInstallPWA, setCanInstallPWA] = React.useState(false);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      setCanInstallPWA(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = React.useCallback(async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setCanInstallPWA(false);
      }
      setDeferredInstallPrompt(null);
    } else {
      alert(
        'To install Daily Tracker on your device:\n\n' +
        '• Desktop Chrome / Edge: Click the Install icon in the address bar.\n' +
        '• Mobile Android: Tap "Install App" or Chrome menu ➔ "Install app".\n' +
        '• Mobile iOS / Safari: Tap Share (📤) ➔ "Add to Home Screen".'
      );
    }
  }, [deferredInstallPrompt]);

  // Notes minimize state: when no notes present, minimize notes box and pull up Tasks area
  const [isNotesMinimized, setIsNotesMinimized] = React.useState(() => {
    const initialNote = loadNotes()[formatDateKey(new Date())];
    return !Boolean(initialNote?.content && initialNote.content.trim().length > 0);
  });

  // Sync minimize state when selected date changes or notes update
  React.useEffect(() => {
    const note = notes[selectedDateKey];
    const hasContent = Boolean(note?.content && note.content.trim().length > 0);
    setIsNotesMinimized(!hasContent);
  }, [selectedDateKey, notes]);

  // Instant local storage saves (zero latency)
  React.useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  React.useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  // Ref for current user & theme to prevent timer resets on re-renders
  const syncStateRef = React.useRef({ user, theme });
  React.useEffect(() => {
    syncStateRef.current = { user, theme };
  }, [user, theme]);

  // Helper to mark unsaved local changes and update edit timestamp
  const markLocalChange = React.useCallback(() => {
    const now = Date.now();
    saveLastLocalEdit(now);
    if (syncStateRef.current.user) {
      setSyncStatus('unsaved');
    }
  }, []);

  // Core Cloud Sync Function (triggered on demand or by 5-minute timer)
  const performCloudSync = React.useCallback(async () => {
    const currentUser = syncStateRef.current.user;
    if (!currentUser?.uid) return;

    setSyncStatus('syncing');
    try {
      const currentTasks = loadTasks();
      const currentNotes = loadNotes();
      const currentTheme = loadTheme();
      const now = Date.now();

      await saveUserDataToCloud(currentUser.uid, {
        tasks: currentTasks,
        notes: currentNotes,
        theme: currentTheme,
        updatedAt: now,
      });
      saveLastLocalEdit(now);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Cloud sync error:', err);
      setSyncStatus('error');
    }
  }, []);

  // 5-Minute Periodic Cloud Sync Timer (Runs strictly once every 5 minutes when signed in)
  const userId = user?.uid;
  React.useEffect(() => {
    if (!userId) return;

    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const intervalId = setInterval(() => {
      performCloudSync();
    }, FIVE_MINUTES_MS);

    return () => clearInterval(intervalId);
  }, [userId, performCloudSync]);

  // Auth State Listener & Initial Cloud Fetch (Runs once on Auth state change)
  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const profile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        setUser(profile);
        setSyncStatus('syncing');

        try {
          // Fetch cloud data once on sign-in
          const cloudData = await fetchUserDataFromCloud(firebaseUser.uid);
          const currentTasks = loadTasks();
          const currentNotes = loadNotes();
          const currentTheme = loadTheme();
          const lastLocalEdit = getLastLocalEdit();

          if (cloudData) {
            const merged = mergeTrackerData(
              currentTasks,
              currentNotes,
              currentTheme,
              lastLocalEdit,
              cloudData
            );

            setTasks(merged.tasks);
            saveTasks(merged.tasks);
            setNotes(merged.notes);
            saveNotes(merged.notes);
            setTheme(merged.theme);
            saveTheme(merged.theme);

            // If local had unsaved edits newer than cloud, push merged data to cloud immediately
            if (lastLocalEdit > (cloudData.updatedAt || 0)) {
              const now = Date.now();
              await saveUserDataToCloud(firebaseUser.uid, {
                tasks: merged.tasks,
                notes: merged.notes,
                theme: merged.theme,
                updatedAt: now,
              });
              saveLastLocalEdit(now);
            }
          } else {
            // Initial user migration: save current local data to cloud once
            const now = Date.now();
            await saveUserDataToCloud(firebaseUser.uid, {
              tasks: currentTasks,
              notes: currentNotes,
              theme: currentTheme,
              updatedAt: now,
            });
            saveLastLocalEdit(now);
          }
          setSyncStatus('synced');
        } catch (err) {
          console.error('Error loading cloud data on auth change:', err);
          setSyncStatus('error');
        }
      } else {
        setUser(null);
        setSyncStatus('idle');
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      saveTheme(next);
      return next;
    });
    markLocalChange();
  };

  // Keep month/year in sync when selecting dates outside current month
  const handleSelectDate = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    const d = parseDateKey(dateKey);
    if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) {
      setCurrentYear(d.getFullYear());
      setCurrentMonth(d.getMonth());
    }
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateKey(formatDateKey(today));
  };

  // Task Actions
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'createdAt'>) => {
    const now = Date.now();
    const newTask: Task = {
      ...newTaskData,
      id: `task-${now}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [newTask, ...prev]);
    markLocalChange();
  };

  const handleUpdateTask = (taskId: string, updatedFields: Partial<Task>) => {
    const now = Date.now();
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updatedFields, updatedAt: now } : t))
    );
    markLocalChange();
  };

  const handleToggleTask = (taskId: string) => {
    const now = Date.now();
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed, updatedAt: now } : t))
    );
    markLocalChange();
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    markLocalChange();
  };

  const handleMoveTaskDate = (taskId: string, targetDateKey: string) => {
    const now = Date.now();
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, date: targetDateKey, updatedAt: now } : t))
    );
    markLocalChange();
  };

  const handleAddSubtask = (taskId: string, title: string) => {
    const now = Date.now();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = t.subtasks || [];
        const newSubtask = {
          id: `st-${now}`,
          title,
          completed: false,
        };
        return { ...t, subtasks: [...subtasks, newSubtask], updatedAt: now };
      })
    );
    markLocalChange();
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const now = Date.now();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = (t.subtasks || []).map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...t, subtasks, updatedAt: now };
      })
    );
    markLocalChange();
  };

  // Daily Notes Actions
  const handleSaveNote = (dateKey: string, content: string) => {
    const now = Date.now();
    setNotes((prev) => ({
      ...prev,
      [dateKey]: {
        date: dateKey,
        content,
        updatedAt: now,
      },
    }));
    markLocalChange();
  };

  // Backup Import & Export
  const handleExportData = () => {
    const backupData = {
      tasks,
      notes,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-tracker-backup-${formatDateKey(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.tasks) setTasks(parsed.tasks);
        if (parsed.notes) setNotes(parsed.notes);
        markLocalChange();
        alert('Data backup successfully imported!');
      } catch (err) {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };


  // Keyboard Shortcuts (Cmd+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isLight = theme === 'light';

  return (
    <div className={clsx(
      "flex flex-col min-h-screen lg:h-screen overflow-y-auto lg:overflow-hidden transition-colors duration-200",
      isLight 
        ? "theme-light bg-slate-50 text-slate-900" 
        : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100"
    )}>
      {/* Header */}
      <Header
        currentYear={currentYear}
        currentMonth={currentMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        tasks={tasks}
        onExportData={handleExportData}
        onImportData={handleImportData}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        user={user}
        syncStatus={syncStatus}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onManualSync={performCloudSync}
        onInstallPWA={handleInstallPWA}
        canInstallPWA={canInstallPWA}
      />

      {/* Main App Layout */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* Leftmost Column: NPR News Sidebar & Collapsed Rail */}
        <NewsSidebar
          isOpen={isNewsSidebarOpen}
          onOpen={() => {
            setIsNewsSidebarOpen(true);
            saveNewsSidebarOpen(true);
          }}
          onClose={() => {
            setIsNewsSidebarOpen(false);
            saveNewsSidebarOpen(false);
          }}
          theme={theme}
        />

        {/* Center Column: Monthly Calendar Grid (Main View) */}
        <div className={clsx("flex-1 flex flex-col min-h-[460px] lg:min-h-0 overflow-hidden border-b lg:border-b-0 lg:border-r", isLight ? "border-blue-200/60" : "border-slate-800/80")}>
          <CalendarGrid
            currentYear={currentYear}
            currentMonth={currentMonth}
            selectedDateKey={selectedDateKey}
            onSelectDate={handleSelectDate}
            tasks={tasks}
            notes={notes}
            onQuickAddTask={(dateKey) => {
              handleSelectDate(dateKey);
            }}
            onMoveTaskDate={handleMoveTaskDate}
            theme={theme}
          />
        </div>

        {/* Right Column: Sidebar (Daily Notes & Tasks split panel) */}
        <aside className={clsx(
          "w-full lg:w-[420px] xl:w-[480px] flex flex-col h-full p-4 lg:p-6 gap-4 min-h-0 overflow-y-auto lg:overflow-hidden flex-shrink-0 transition-colors",
          isLight ? "bg-blue-50/40" : "bg-slate-950/20"
        )}>
          {/* Top Half: Daily Notes for Selected Date (Minimizes when no notes present) */}
          <div className={clsx(
            "transition-all duration-300 flex flex-col min-h-0",
            isNotesMinimized ? "flex-none h-auto" : "flex-1 min-h-[260px]"
          )}>
            <DailyNotes
              selectedDateKey={selectedDateKey}
              note={notes[selectedDateKey]}
              onSaveNote={handleSaveNote}
              theme={theme}
              isMinimized={isNotesMinimized}
              onToggleMinimize={setIsNotesMinimized}
            />
          </div>

          {/* Bottom Half: Tasks Agenda for Selected Date */}
          <div className="flex-1 min-h-[300px] flex flex-col min-h-0">
            <DailyTasks
              selectedDateKey={selectedDateKey}
              tasks={tasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onAddSubtask={handleAddSubtask}
              onToggleSubtask={handleToggleSubtask}
              onMoveTaskDate={handleMoveTaskDate}
              theme={theme}
            />
          </div>
        </aside>
      </main>

      {/* Global Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        tasks={tasks}
        notes={notes}
        onSelectDate={handleSelectDate}
        theme={theme}
      />

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        tasks={tasks}
        notes={notes}
        theme={theme}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        syncStatus={syncStatus}
        theme={theme}
        taskCount={tasks.length}
        noteCount={Object.keys(notes).length}
      />
    </div>
  );
}
export default App;
