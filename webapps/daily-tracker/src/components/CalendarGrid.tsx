import React from 'react';
import { CalendarDay, getCalendarGrid } from '../utils/dateUtils';
import { Task, DailyNote } from '../types';
import { 
  Check, 
  Dumbbell, 
  Target,
  Briefcase,
  User,
  Lightbulb,
  Flame,
  GraduationCap
} from 'lucide-react';
import clsx from 'clsx';

interface CalendarGridProps {
  currentYear: number;
  currentMonth: number;
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
  tasks: Task[];
  notes: Record<string, DailyNote>;
  onQuickAddTask: (dateKey: string) => void;
  onMoveTaskDate?: (taskId: string, targetDateKey: string) => void;
  theme?: 'dark' | 'light';
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function renderCategoryIcon(category: string, className: string = "w-2.5 h-2.5") {
  switch (category) {
    case 'Work':
      return <Briefcase className={className} />;
    case 'Personal':
      return <User className={className} />;
    case 'Fitness':
      return <Dumbbell className={className} />;
    case 'Ideas':
      return <Lightbulb className={className} />;
    case 'Urgent':
      return <Flame className={className} />;
    case 'Study':
      return <GraduationCap className={className} />;
    default:
      return <Target className={className} />;
  }
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentYear,
  currentMonth,
  selectedDateKey,
  onSelectDate,
  tasks,
  notes,
  onQuickAddTask,
  onMoveTaskDate,
  theme,
}) => {
  const days: CalendarDay[] = getCalendarGrid(currentYear, currentMonth);
  const [dragOverDateKey, setDragOverDateKey] = React.useState<string | null>(null);

  const isLight = theme === 'light';

  // Group tasks by date string
  const tasksByDate = React.useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return map;
  }, [tasks]);

  return (
    <div className={clsx("flex-1 flex flex-col min-h-0 p-4 lg:p-6 overflow-hidden transition-colors", isLight ? "bg-slate-100/60" : "bg-slate-950/30")}>
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-px mb-1 text-center">
        {WEEKDAYS.map((day, idx) => (
          <div
            key={day}
            className={clsx(
              "text-[10px] font-bold uppercase tracking-widest py-1.5 transition-colors",
              isLight 
                ? (idx === 0 || idx === 6 ? "text-blue-600" : "text-slate-600")
                : (idx === 0 || idx === 6 ? "text-purple-400" : "text-slate-400")
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 7x6 Calendar Cells Grid - Zero Gap Padding */}
      <div className={clsx(
        "flex-1 grid grid-cols-7 grid-rows-6 gap-px border overflow-hidden rounded-xl min-h-0 shadow-sm",
        isLight ? "bg-slate-200/90 border-slate-200" : "bg-slate-800/80 border-white/[0.08]"
      )}>
        {days.map((day) => {
          const isSelected = day.dateKey === selectedDateKey;
          const dayTasks = tasksByDate[day.dateKey] || [];
          const completedTasksCount = dayTasks.filter((t) => t.completed).length;
          const totalTasksCount = dayTasks.length;

          // Priority indicator dots
          const hasP1 = dayTasks.some((t) => t.priority === 'p1' && !t.completed);

          const isDragOver = dragOverDateKey === day.dateKey;

          return (
            <div
              key={day.dateKey}
              onClick={() => onSelectDate(day.dateKey)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverDateKey !== day.dateKey) setDragOverDateKey(day.dateKey);
              }}
              onDragLeave={() => {
                if (dragOverDateKey === day.dateKey) setDragOverDateKey(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverDateKey(null);
                const taskId = e.dataTransfer.getData('text/plain');
                if (taskId && onMoveTaskDate) {
                  onMoveTaskDate(taskId, day.dateKey);
                }
              }}
              className={clsx(
                "group relative flex flex-col justify-between p-2 cursor-pointer select-none transition-colors overflow-hidden rounded-none",
                isDragOver
                  ? isLight ? "bg-blue-100 ring-2 ring-blue-500 z-20" : "bg-purple-950/80 ring-2 ring-purple-500 z-20"
                  : day.isCurrentMonth
                  ? isLight ? "bg-white hover:bg-blue-50/60" : "bg-slate-900/90 hover:bg-slate-900"
                  : isLight ? "bg-slate-200/80 hover:bg-slate-200" : "bg-slate-950/60 hover:bg-slate-950/80",
                isSelected && !isDragOver && "cell-selected ring-2 ring-blue-500 z-10",
                !isSelected && !isDragOver && day.isToday && (isLight ? "bg-blue-50/80 ring-1 ring-blue-400/50" : "bg-blue-950/40 ring-1 ring-blue-500/40")
              )}
            >
              {/* Header inside cell: Date number & Indicators */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={clsx(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold transition-transform group-hover:scale-105",
                      day.isToday
                        ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30"
                        : isSelected
                        ? "bg-blue-600 text-white"
                        : !day.isCurrentMonth
                        ? isLight ? "text-gray-400" : "text-slate-500"
                        : isLight ? "text-slate-700 group-hover:text-blue-600" : "text-slate-300 group-hover:text-white"
                    )}
                  >
                    {day.dayNumber}
                  </span>

                  {/* Urgent / P1 Alert Indicator */}
                  {hasP1 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500" title="Urgent Item" />
                  )}
                </div>
              </div>

              {/* Middle Section: Task previews list with scrollable overflow */}
              <div className="my-1 space-y-1 overflow-y-auto flex-1 flex flex-col justify-start scrollbar-thin pr-0.5 min-h-0">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.setData('text/plain', task.id);
                    }}
                    className={clsx(
                      "flex items-center space-x-1.5 text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium border transition-colors cursor-grab active:cursor-grabbing flex-shrink-0",
                      task.completed
                        ? isLight ? "bg-slate-100 text-slate-400 border-transparent line-through" : "bg-slate-950/60 text-slate-500 border-transparent line-through"
                        : `category-${task.category} border-transparent`
                    )}
                  >
                    <span className="flex-shrink-0 opacity-90" title={`Type: ${task.category}`}>
                      {renderCategoryIcon(task.category, "w-2.5 h-2.5")}
                    </span>
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
              </div>

              {/* Bottom Section: Task Category Badges */}
              <div className="pt-1 flex items-center justify-between">
                {/* Task Type SVG Icons */}
                <div className="flex items-center space-x-1 overflow-hidden">
                  {/* Task Category Icons for Active Tasks on this date */}
                  {Array.from(new Set(dayTasks.map((t) => t.category))).map((cat) => (
                    <span
                      key={cat}
                      className={clsx("p-0.5 rounded border flex items-center justify-center transition-transform hover:scale-110", `category-${cat}`)}
                      title={`Task Type: ${cat}`}
                    >
                      {renderCategoryIcon(cat, "w-2.5 h-2.5")}
                    </span>
                  ))}
                </div>

                {/* Task Count Badge */}
                {totalTasksCount > 0 && (
                  <div className={clsx("flex items-center space-x-1 text-[10px] font-medium ml-auto", isLight ? "text-slate-500" : "text-slate-400")}>
                    {completedTasksCount === totalTasksCount ? (
                      <span className={clsx("flex items-center space-x-0.5 font-semibold", isLight ? "text-blue-600" : "text-purple-400")}>
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        <span>All</span>
                      </span>
                    ) : (
                      <span>
                        {completedTasksCount}/{totalTasksCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
