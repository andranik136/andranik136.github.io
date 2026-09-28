import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Search, 
  BarChart2, 
  Download, 
  Upload,
  CheckCircle2,
  Sun,
  Moon,
  Menu,
  X,
  Newspaper,
  Cloud,
  Loader2,
  Check,
  User as UserIcon,
  Smartphone
} from 'lucide-react';
import { formatMonthYear } from '../utils/dateUtils';
import { Task, UserProfile, SyncStatus } from '../types';
import clsx from 'clsx';

interface HeaderProps {
  currentYear: number;
  currentMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onOpenSearch: () => void;
  onOpenAnalytics: () => void;
  tasks: Task[];
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  user: UserProfile | null;
  syncStatus: SyncStatus;
  onOpenAuthModal: () => void;
  onManualSync?: () => void;
  onInstallPWA?: () => void;
  canInstallPWA?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentYear,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  onOpenSearch,
  onOpenAnalytics,
  tasks,
  onExportData,
  onImportData,
  theme,
  onToggleTheme,
  user,
  syncStatus,
  onOpenAuthModal,
  onManualSync,
  onInstallPWA,
  canInstallPWA,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Close popout menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute monthly completion stats
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthTasks = tasks.filter(t => t.date.startsWith(currentMonthKey));
  const completedCount = monthTasks.filter(t => t.completed).length;
  const totalCount = monthTasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isLight = theme === 'light';

  return (
    <header className={clsx(
      "sticky top-0 z-30 w-full backdrop-blur-xl border-b px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4 transition-colors duration-200",
      isLight 
        ? "bg-white/90 border-blue-200 text-slate-900 shadow-sm" 
        : "bg-slate-950/80 border-white/[0.08] text-white"
    )}>
      {/* Brand & Logo */}
      <div className="flex items-center space-x-2.5">
        <div className={clsx(
          "w-8 h-8 rounded-xl flex items-center justify-center border transition-transform hover:scale-105 shadow-xs",
          isLight ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-blue-950/60 border-blue-800/40 text-blue-400"
        )}>
          <CheckCircle2 className="w-4.5 h-4.5 text-blue-500 stroke-[2.2]" />
        </div>
        <h1 className={clsx("text-lg font-bold tracking-tight", isLight ? "text-slate-900" : "text-white")}>
          Daily Tracker
        </h1>
      </div>

      {/* Month Switcher Controls */}
      <div className={clsx(
        "flex items-center space-x-1 sm:space-x-1.5 p-1 rounded-xl border transition-colors",
        isLight ? "bg-blue-50/80 border-blue-200 shadow-xs" : "bg-slate-900/90 border-white/[0.08] shadow-inner"
      )}>
        <button
          onClick={onPrevMonth}
          className={clsx(
            "p-1.5 rounded-lg transition-all duration-150 active:scale-95",
            isLight ? "text-slate-600 hover:text-blue-600 hover:bg-blue-100" : "text-slate-400 hover:text-white hover:bg-slate-800"
          )}
          title="Previous Month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className={clsx("text-xs font-semibold min-w-[130px] text-center tracking-wide px-1", isLight ? "text-slate-800" : "text-slate-200")}>
          {formatMonthYear(currentYear, currentMonth)}
        </span>

        <button
          onClick={onNextMonth}
          className={clsx(
            "p-1.5 rounded-lg transition-all duration-150 active:scale-95",
            isLight ? "text-slate-600 hover:text-blue-600 hover:bg-blue-100" : "text-slate-400 hover:text-white hover:bg-slate-800"
          )}
          title="Next Month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className={clsx("h-3.5 w-px mx-1", isLight ? "bg-blue-200" : "bg-slate-800")} />

        <button
          onClick={onToday}
          className={clsx(
            "flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all duration-150 active:scale-95",
            isLight 
              ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm" 
              : "bg-blue-600/15 text-blue-400 border-blue-500/25 hover:bg-blue-600 hover:text-white"
          )}
          title="Jump to Today"
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Today</span>
        </button>
      </div>

      {/* Right Side Actions & Menu Popout */}
      <div className="flex items-center space-x-2">

        {/* Dedicated Save & Sync Button */}
        {user && (
          <button
            onClick={onManualSync}
            disabled={syncStatus === 'syncing'}
            className={clsx(
              "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all duration-150 text-xs font-semibold active:scale-95 shadow-2xs",
              syncStatus === 'syncing'
                ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                : syncStatus === 'synced'
                ? isLight ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100" : "bg-emerald-950/50 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/60"
                : isLight ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200" : "bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border-purple-800/40"
            )}
            title="Save and Sync data to Cloud"
          >
            {syncStatus === 'syncing' ? (
              <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
            ) : syncStatus === 'synced' ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-blue-500" />
            )}
            <span>
              {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'synced' ? 'Synced' : 'Save & Sync'}
            </span>
          </button>
        )}

        {/* Account & Cloud Sync Trigger */}
        <button
          onClick={onOpenAuthModal}
          className={clsx(
            "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all duration-150 text-xs font-medium active:scale-95",
            user
              ? isLight ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200" : "bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800"
              : isLight ? "bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border-blue-200" : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-white/[0.08]"
          )}
          title={user ? `Signed in as ${user.email}` : "Sign In & Sync Data"}
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-4 h-4 rounded-full" />
          ) : user ? (
            <Cloud className="w-4 h-4 text-emerald-500" />
          ) : (
            <Cloud className="w-4 h-4 text-blue-500" />
          )}
          <span className="hidden sm:inline text-xs font-semibold">
            {user ? (user.displayName || user.email?.split('@')[0] || 'Account') : 'Sign In'}
          </span>
        </button>

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className={clsx(
            "p-2 rounded-xl border transition-all duration-150 active:scale-95 flex items-center justify-center",
            isLight 
              ? "bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border-blue-200" 
              : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-white/[0.08] hover:border-blue-500/30"
          )}
          title="Search Tasks & Notes (Cmd + K)"
        >
          <Search className="w-4 h-4 text-blue-500" />
        </button>

        {/* Menu Button Trigger & Popout Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(prev => !prev)}
            className={clsx(
              "p-2 rounded-xl border transition-all duration-150 active:scale-95 flex items-center justify-center space-x-1.5",
              isMenuOpen 
                ? (isLight ? "bg-blue-100 border-blue-300 text-blue-700" : "bg-slate-800 border-blue-500/50 text-white") 
                : (isLight ? "bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border-blue-200" : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-white/[0.08]")
            )}
            title="Menu Options"
          >
            {isMenuOpen ? <X className="w-4 h-4 text-blue-500" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Dropdown Popout */}
          {isMenuOpen && (
            <div className={clsx(
              "absolute right-0 top-full mt-2 w-64 rounded-xl border shadow-2xl z-50 p-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150",
              isLight 
                ? "bg-white/95 border-blue-200/90 shadow-blue-500/10" 
                : "bg-slate-900/95 border-slate-800 shadow-black/60"
            )}>
              {/* Account & Sync Menu Item */}
              <button
                onClick={() => {
                  onOpenAuthModal();
                  setIsMenuOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors text-left",
                  isLight ? "text-slate-700 hover:bg-blue-50 hover:text-blue-600" : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Cloud className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span>Account & Cloud Sync</span>
                </div>
                <span className={clsx(
                  "text-[10px] px-2 py-0.5 rounded-md border font-semibold flex items-center space-x-1",
                  user 
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                    : isLight ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-slate-800 text-slate-400 border-slate-700"
                )}>
                  {user ? "Synced" : "Local Guest"}
                </span>
              </button>

              {/* Install App (PWA) */}
              <button
                onClick={() => {
                  onInstallPWA?.();
                  setIsMenuOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors text-left",
                  isLight ? "text-slate-700 hover:bg-blue-50 hover:text-blue-600" : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Install App (PWA)</span>
                </div>
                <span className={clsx("text-[10px] px-2 py-0.5 rounded-md border font-semibold", isLight ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-emerald-950 text-emerald-300 border-emerald-800")}>
                  {canInstallPWA ? "Install" : "PWA"}
                </span>
              </button>

              {/* Productivity Insights */}
              <button
                onClick={() => {
                  onOpenAnalytics();
                  setIsMenuOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors text-left",
                  isLight ? "text-slate-700 hover:bg-blue-50 hover:text-blue-600" : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                )}
              >
                <BarChart2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>Productivity Insights</span>
              </button>

              {/* Light / Dark Theme Mode */}
              <button
                onClick={() => {
                  onToggleTheme();
                  setIsMenuOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors text-left",
                  isLight ? "text-slate-700 hover:bg-blue-50 hover:text-blue-600" : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                )}
              >
                <div className="flex items-center space-x-3">
                  {isLight ? <Moon className="w-4 h-4 text-blue-600 flex-shrink-0" /> : <Sun className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                  <span>Theme Mode</span>
                </div>
                <span className={clsx("text-[10px] px-2 py-0.5 rounded-md border font-semibold", isLight ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-slate-800 text-amber-300 border-slate-700")}>
                  {isLight ? "Light" : "Dark"}
                </span>
              </button>

              <div className={clsx("my-1 border-t", isLight ? "border-blue-100" : "border-slate-800")} />

              {/* Export Backup */}
              <button
                onClick={() => {
                  onExportData();
                  setIsMenuOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors text-left",
                  isLight ? "text-slate-700 hover:bg-blue-50 hover:text-blue-600" : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                )}
              >
                <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Export Backup (JSON)</span>
              </button>

              {/* Import Backup */}
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setIsMenuOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors text-left",
                  isLight ? "text-slate-700 hover:bg-blue-50 hover:text-blue-600" : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                )}
              >
                <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Import Backup (JSON)</span>
              </button>
            </div>
          )}
        </div>

        {/* Hidden File Input for Data Import */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImportData}
          accept=".json"
          className="hidden"
        />
      </div>
    </header>
  );
};
