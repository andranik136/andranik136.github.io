import React from 'react';
import { Task, DailyNote } from '../../types';
import { renderCategoryIcon } from '../CalendarGrid';
import { BarChart2, CheckCircle2, Award, BookOpen, X, TrendingUp, PieChart } from 'lucide-react';
import clsx from 'clsx';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  notes: Record<string, DailyNote>;
  theme?: 'dark' | 'light';
}

const CATEGORY_COLORS: Record<string, string> = {
  Work: '#3b82f6',
  Personal: '#a855f7',
  Fitness: '#10b981',
  Ideas: '#60a5fa',
  Urgent: '#ef4444',
  Study: '#c084fc',
};

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  tasks,
  notes,
  theme,
}) => {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const isLight = theme === 'light';

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isOpen]);

  // Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalNotes = Object.keys(notes).length;

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  tasks.forEach((t) => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  // Priority breakdown
  const priorityCounts: Record<string, { count: number; label: string; colorClass: string }> = {
    p1: { count: 0, label: 'Urgent', colorClass: 'bg-red-500' },
    p2: { count: 0, label: 'High', colorClass: 'bg-purple-500' },
    p3: { count: 0, label: 'Normal', colorClass: 'bg-blue-500' },
    p4: { count: 0, label: 'Low', colorClass: 'bg-slate-400' },
  };
  tasks.forEach((t) => {
    if (priorityCounts[t.priority]) {
      priorityCounts[t.priority].count += 1;
    }
  });

  // Last 7 Days Activity Data calculation
  const activityDays = React.useMemo(() => {
    const days: { label: string; dateKey: string; completed: number; total: number }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayTasks = tasks.filter((t) => t.date === dateKey);
      const completed = dayTasks.filter((t) => t.completed).length;

      days.push({
        label: dayName,
        dateKey,
        completed,
        total: dayTasks.length,
      });
    }
    return days;
  }, [tasks]);

  const maxTaskCount = Math.max(...activityDays.map((d) => d.total), 1);

  // SVG Donut Chart Calculation
  const categorySegments = React.useMemo(() => {
    const C = 2 * Math.PI * 36; // Circumference for radius R=36
    let accumulatedPct = 0;

    return Object.entries(categoryCounts).map(([cat, count]) => {
      const pct = totalTasks > 0 ? count / totalTasks : 0;
      const strokeDasharray = `${pct * C} ${C}`;
      const strokeDashoffset = -accumulatedPct * C;
      accumulatedPct += pct;

      return {
        cat,
        count,
        pct: Math.round(pct * 100),
        color: CATEGORY_COLORS[cat] || '#8b5cf6',
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [categoryCounts, totalTasks]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className={clsx(
        "p-0 rounded-xl border w-full max-w-2xl shadow-2xl overflow-hidden transition-colors",
        isLight 
          ? "bg-white border-blue-200 text-slate-900 backdrop:bg-slate-900/40" 
          : "bg-slate-900 border-purple-900/50 text-slate-100 backdrop:bg-slate-950/80"
      )}
    >
      {/* Header */}
      <div className={clsx("p-5 border-b flex items-center justify-between", isLight ? "bg-blue-50/60 border-blue-200" : "bg-slate-950/60 border-purple-900/40")}>
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className={clsx("text-base font-bold", isLight ? "text-slate-900" : "text-slate-100")}>Productivity Insights</h2>
            <p className={clsx("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Overview & activity analytics for tasks and notes</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={clsx("p-1.5 rounded-xl transition-colors", isLight ? "hover:bg-blue-100 text-slate-500 hover:text-slate-800" : "hover:bg-slate-800 text-slate-400 hover:text-white")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Analytics Content */}
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-thin">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={clsx("p-3.5 rounded-xl border space-y-1", isLight ? "bg-blue-50/40 border-blue-200" : "bg-slate-800/60 border-purple-900/30")}>
            <div className={clsx("flex items-center justify-between text-[11px] font-medium", isLight ? "text-slate-600" : "text-slate-400")}>
              <span>Completion</span>
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {completionPercent}%
            </div>
            <div className={clsx("text-[10px]", isLight ? "text-slate-500" : "text-slate-400")}>{completedTasks}/{totalTasks} finished</div>
          </div>

          <div className={clsx("p-3.5 rounded-xl border space-y-1", isLight ? "bg-blue-50/40 border-blue-200" : "bg-slate-800/60 border-purple-900/30")}>
            <div className={clsx("flex items-center justify-between text-[11px] font-medium", isLight ? "text-slate-600" : "text-slate-400")}>
              <span>Notes Saved</span>
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-black text-blue-600">{totalNotes}</div>
            <div className={clsx("text-[10px]", isLight ? "text-slate-500" : "text-slate-400")}>Days documented</div>
          </div>

          <div className={clsx("p-3.5 rounded-xl border space-y-1", isLight ? "bg-indigo-50/40 border-indigo-200" : "bg-slate-800/60 border-purple-900/30")}>
            <div className={clsx("flex items-center justify-between text-[11px] font-medium", isLight ? "text-slate-600" : "text-slate-400")}>
              <span>Performance</span>
              <Award className="w-4 h-4 text-indigo-600" />
            </div>
            <div className={clsx("text-sm font-extrabold mt-1", isLight ? "text-indigo-700" : "text-purple-300")}>Alpha Tier</div>
            <div className={clsx("text-[10px]", isLight ? "text-slate-500" : "text-slate-400")}>High momentum</div>
          </div>
        </div>

        {/* Chart 1: 7-Day Task Activity Bar Chart */}
        <div className={clsx("p-5 rounded-xl border space-y-4", isLight ? "bg-slate-50/70 border-blue-200" : "bg-slate-950/60 border-purple-900/30")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className={clsx("text-xs font-bold uppercase tracking-wider", isLight ? "text-slate-800" : "text-slate-200")}>
                7-Day Task Output Activity
              </h3>
            </div>
            <span className={clsx("text-[11px] font-mono", isLight ? "text-slate-500" : "text-slate-400")}>Last 7 Days</span>
          </div>

          {/* SVG / Flex Bar Chart */}
          <div className={clsx("h-40 flex items-end justify-between pt-6 pb-2 px-2 border-b gap-2", isLight ? "border-blue-200" : "border-slate-800/80")}>
            {activityDays.map((d) => {
              const heightPct = Math.round((d.total / maxTaskCount) * 100);
              const completedHeightPct = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;

              return (
                <div key={d.dateKey} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on Hover */}
                  <div className={clsx("absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity border text-[10px] px-2 py-0.5 rounded-md pointer-events-none z-10 whitespace-nowrap shadow-md", isLight ? "bg-white border-blue-300 text-slate-800" : "bg-slate-900 border-purple-500/50 text-slate-200")}>
                    {d.completed}/{d.total} tasks
                  </div>

                  {/* Total Bar Container */}
                  <div
                    className={clsx("w-full max-w-[28px] rounded-t-lg border overflow-hidden relative flex flex-col justify-end transition-all duration-300", isLight ? "bg-slate-200 border-blue-200 group-hover:border-blue-400" : "bg-slate-900 border-slate-800/80 group-hover:border-purple-500/60")}
                    style={{ height: `${Math.max(heightPct, 8)}%` }}
                  >
                    {/* Completed Portion Fill */}
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-indigo-600 rounded-t-md transition-all duration-500"
                      style={{ height: `${completedHeightPct}%` }}
                    />
                  </div>

                  {/* Day Label */}
                  <span className={clsx("text-[10px] font-semibold mt-2 transition-colors", isLight ? "text-slate-600 group-hover:text-blue-600" : "text-slate-400 group-hover:text-purple-300")}>
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className={clsx("flex items-center justify-between text-[11px]", isLight ? "text-slate-600" : "text-slate-400")}>
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-blue-600 to-indigo-600" />
                <span>Completed</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className={clsx("w-2.5 h-2.5 rounded-sm border", isLight ? "bg-slate-200 border-blue-300" : "bg-slate-900 border-slate-700")} />
                <span>Total Scheduled</span>
              </span>
            </div>
            <span>Completed velocity</span>
          </div>
        </div>

        {/* Chart 2 & 3: Category Donut Chart & Priority Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Donut Chart */}
          <div className={clsx("p-5 rounded-xl border space-y-3 flex flex-col justify-between", isLight ? "bg-slate-50/70 border-blue-200" : "bg-slate-950/60 border-purple-900/30")}>
            <div className="flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              <h3 className={clsx("text-xs font-bold uppercase tracking-wider", isLight ? "text-slate-800" : "text-slate-200")}>
                Task Category Breakdown
              </h3>
            </div>

            <div className="flex items-center space-x-4 py-2">
              {/* SVG Donut */}
              <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="36"
                    fill="transparent"
                    stroke={isLight ? "#e2e8f0" : "#1e293b"}
                    strokeWidth="14"
                  />
                  {/* Category Donut Segments */}
                  {categorySegments.map((seg) => (
                    <circle
                      key={seg.cat}
                      cx="50"
                      cy="50"
                      r="36"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="14"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      className="transition-all duration-500 hover:opacity-80"
                    />
                  ))}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className={clsx("text-base font-black", isLight ? "text-slate-900" : "text-slate-100")}>{totalTasks}</span>
                  <span className={clsx("text-[9px] uppercase tracking-wider font-semibold", isLight ? "text-slate-500" : "text-slate-400")}>Tasks</span>
                </div>
              </div>

              {/* Category Legend List */}
              <div className="flex-1 space-y-1.5 overflow-hidden text-[11px]">
                {categorySegments.map((seg) => (
                  <div key={seg.cat} className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="p-0.5 rounded flex items-center justify-center" style={{ color: seg.color }}>
                        {renderCategoryIcon(seg.cat, "w-3 h-3")}
                      </span>
                      <span className={clsx("font-medium truncate", isLight ? "text-slate-800" : "text-slate-300")}>{seg.cat}</span>
                    </div>
                    <span className={clsx("font-mono ml-2", isLight ? "text-slate-500" : "text-slate-400")}>{seg.count} ({seg.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Priority Distribution Bar Chart */}
          <div className={clsx("p-5 rounded-xl border space-y-3 flex flex-col justify-between", isLight ? "bg-slate-50/70 border-blue-200" : "bg-slate-950/60 border-purple-900/30")}>
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <h3 className={clsx("text-xs font-bold uppercase tracking-wider", isLight ? "text-slate-800" : "text-slate-200")}>
                Priority Distribution
              </h3>
            </div>

            <div className="space-y-2.5 py-1">
              {Object.entries(priorityCounts).map(([key, data]) => {
                const pct = totalTasks > 0 ? Math.round((data.count / totalTasks) * 100) : 0;

                return (
                  <div key={key} className="space-y-1">
                    <div className={clsx("flex justify-between text-xs font-semibold", isLight ? "text-slate-700" : "text-slate-300")}>
                      <span>{data.label}</span>
                      <span>{data.count} tasks ({pct}%)</span>
                    </div>
                    <div className={clsx("w-full rounded-full h-2 overflow-hidden border", isLight ? "bg-slate-200 border-blue-100" : "bg-slate-900 border-slate-800")}>
                      <div
                        className={clsx("h-full rounded-full transition-all duration-500", data.colorClass)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
};
