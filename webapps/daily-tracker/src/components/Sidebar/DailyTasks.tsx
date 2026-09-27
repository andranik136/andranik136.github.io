import React from 'react';
import { Task, Priority, Category } from '../../types';
import { formatFullDate } from '../../utils/dateUtils';
import { 
  CheckCircle, 
  Circle, 
  Plus, 
  Trash2, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  CheckSquare,
  Pencil,
  Check,
  X,
  Calendar,
  CalendarDays
} from 'lucide-react';
import { renderCategoryIcon } from '../CalendarGrid';
import confetti from 'canvas-confetti';
import clsx from 'clsx';

interface DailyTasksProps {
  selectedDateKey: string;
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (taskId: string, updatedFields: Partial<Task>) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onMoveTaskDate?: (taskId: string, targetDateKey: string) => void;
  theme?: 'dark' | 'light';
}

const PRIORITIES: { key: Priority; label: string; colorClass: string }[] = [
  { key: 'p1', label: 'Urgent', colorClass: 'priority-p1' },
  { key: 'p2', label: 'High', colorClass: 'priority-p2' },
  { key: 'p3', label: 'Normal', colorClass: 'priority-p3' },
  { key: 'p4', label: 'Low', colorClass: 'priority-p4' },
];

const CATEGORIES: Category[] = ['Work', 'Personal', 'Fitness', 'Ideas', 'Urgent', 'Study'];

export const DailyTasks: React.FC<DailyTasksProps> = ({
  selectedDateKey,
  tasks,
  onAddTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onMoveTaskDate,
  theme,
}) => {
  // Add form state
  const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [priority, setPriority] = React.useState<Priority>('p3');
  const [category, setCategory] = React.useState<Category>('Work');
  const [time, setTime] = React.useState('');

  // Edit task state
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editPriority, setEditPriority] = React.useState<Priority>('p3');
  const [editCategory, setEditCategory] = React.useState<Category>('Work');
  const [editTime, setEditTime] = React.useState('');
  const [editDate, setEditDate] = React.useState('');

  // Move date popup state
  const [reschedulingTaskId, setReschedulingTaskId] = React.useState<string | null>(null);

  const [filter, setFilter] = React.useState<'all' | 'active' | 'completed'>('all');
  const [expandedTaskIds, setExpandedTaskIds] = React.useState<string[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState<Record<string, string>>({});

  const isLight = theme === 'light';

  // Filter tasks for current date
  const dateTasks = tasks.filter((t) => t.date === selectedDateKey);

  const completedCount = dateTasks.filter((t) => t.completed).length;
  const totalCount = dateTasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTasks = dateTasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      date: selectedDateKey,
      completed: false,
      priority,
      category,
      time: time || undefined,
      durationMinutes: 30,
      subtasks: [],
    });

    setTitle('');
    setTime('');
    setIsAddFormOpen(false);
  };

  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditCategory(task.category);
    setEditTime(task.time || '');
    setEditDate(task.date);
    setReschedulingTaskId(null);
  };

  const handleSaveEdit = (taskId: string) => {
    if (!editTitle.trim()) return;
    onUpdateTask(taskId, {
      title: editTitle.trim(),
      priority: editPriority,
      category: editCategory,
      time: editTime || undefined,
      date: editDate || selectedDateKey,
    });
    setEditingTaskId(null);
  };

  const handleTaskCheck = (task: Task) => {
    onToggleTask(task.id);
    if (!task.completed) {
      confetti({
        particleCount: 40,
        spread: 65,
        origin: { y: 0.7 },
        colors: ['#2563eb', '#9333ea', '#3b82f6', '#a855f7']
      });
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSubtaskSubmit = (taskId: string) => {
    const subTitle = newSubtaskTitle[taskId];
    if (!subTitle || !subTitle.trim()) return;
    onAddSubtask(taskId, subTitle.trim());
    setNewSubtaskTitle((prev) => ({ ...prev, [taskId]: '' }));
  };

  return (
    <div className={clsx(
      "flex flex-col h-full rounded-xl border overflow-hidden shadow-xl transition-colors",
      isLight 
        ? "bg-white border-blue-200/90 shadow-blue-500/5" 
        : "bg-slate-900/90 border-purple-900/40"
    )}>
      {/* Header with Progress Bar */}
      <div className={clsx("p-4 border-b transition-colors", isLight ? "bg-blue-50/70 border-blue-200" : "bg-slate-950/60 border-purple-900/40")}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className={clsx("text-sm font-bold", isLight ? "text-slate-900" : "text-slate-100")}>
              Tasks
            </h2>
            <p className={clsx("text-[11px] font-medium", isLight ? "text-slate-500" : "text-slate-400")}>
              {formatFullDate(selectedDateKey)}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Filter Pill Switcher */}
            <div className={clsx("flex items-center space-x-1 p-1 rounded-xl border", isLight ? "bg-white border-blue-200 shadow-2xs" : "bg-slate-950 border-slate-800")}>
              {(['all', 'active', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={clsx(
                    "px-2 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all",
                    filter === f
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                      : isLight ? "text-slate-600 hover:text-blue-600 hover:bg-blue-50" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Add Task Trigger Circle Button */}
            {!isAddFormOpen && (
              <button
                type="button"
                onClick={() => setIsAddFormOpen(true)}
                className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white flex items-center justify-center shadow-md transition-all active:scale-90 flex-shrink-0"
                title="Add Task"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="space-y-1 mt-3">
            <div className={clsx("flex justify-between text-[11px] font-medium", isLight ? "text-slate-600" : "text-slate-400")}>
              <span>Task Progress</span>
              <span>{completedCount} of {totalCount} completed ({completionPercent}%)</span>
            </div>
            <div className={clsx("w-full rounded-full h-2 overflow-hidden border", isLight ? "bg-slate-200 border-blue-200" : "bg-slate-950 border-slate-800")}>
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Expandable Add Task Form */}
      {isAddFormOpen && (
        <form onSubmit={handleFormSubmit} className={clsx("p-3 border-b space-y-2.5 transition-all", isLight ? "bg-blue-50/30 border-blue-200" : "bg-slate-950/80 border-purple-900/40")}>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add new task..."
              autoFocus
              className={clsx(
                "flex-1 border focus:border-blue-500 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all",
                isLight ? "bg-white border-blue-200 text-slate-800 placeholder-slate-400" : "bg-slate-900 border-slate-700/70 text-slate-200 placeholder-slate-500"
              )}
            />
            <button
              type="submit"
              className="flex items-center space-x-1 px-3.5 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddFormOpen(false);
                setTitle('');
              }}
              className={clsx("p-2 rounded-xl transition-colors", isLight ? "text-slate-500 hover:text-slate-800 hover:bg-blue-100" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800")}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Options Bar: Priority, Category, Time */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Priority */}
            <div className="flex items-center space-x-1">
              {PRIORITIES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPriority(p.key)}
                  className={clsx(
                    "px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all",
                    priority === p.key 
                      ? p.colorClass 
                      : isLight ? "bg-white text-slate-500 border-blue-200" : "bg-slate-900/60 text-slate-400 border-slate-800"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Category */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={clsx(
                "border rounded-lg px-2 py-0.5 text-[11px] focus:outline-none cursor-pointer",
                isLight ? "bg-white border-blue-200 text-slate-700" : "bg-slate-900 border-slate-800 text-slate-300"
              )}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Time Block */}
            <div className={clsx(
              "flex items-center space-x-1 border rounded-lg px-2 py-0.5 text-[11px]",
              isLight ? "bg-white border-blue-200 text-slate-700" : "bg-slate-900 border-slate-800 text-slate-300"
            )}>
              <Clock className="w-3 h-3 text-blue-500" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-transparent text-[11px] focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 scrollbar-thin">
        {filteredTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <p className={clsx("text-xs font-semibold", isLight ? "text-slate-700" : "text-slate-300")}>
              {filter === 'completed'
                ? 'No completed tasks yet!'
                : 'No tasks scheduled for this day.'}
            </p>
            <p className={clsx("text-[11px]", isLight ? "text-slate-500" : "text-slate-500")}>
              Add a task above to plan out your day!
            </p>
            {!isAddFormOpen && (
              <button
                type="button"
                onClick={() => setIsAddFormOpen(true)}
                className={clsx(
                  "mt-2 flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border transition-all font-semibold text-xs",
                  isLight ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200" : "bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border-purple-500/30"
                )}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isEditing = editingTaskId === task.id;
            const isExpanded = expandedTaskIds.includes(task.id);
            const subtasks = task.subtasks || [];
            const completedSubtasks = subtasks.filter((s) => s.completed).length;

            if (isEditing) {
              return (
                <div
                  key={task.id}
                  className={clsx(
                    "rounded-xl border p-3 shadow-lg space-y-3",
                    isLight ? "bg-white border-blue-400" : "bg-slate-900 border-purple-500/60"
                  )}
                >
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={clsx(
                      "w-full border rounded-xl px-3 py-1.5 text-xs focus:outline-none",
                      isLight ? "bg-slate-50 border-blue-200 text-slate-900 focus:border-blue-500" : "bg-slate-950 border-slate-700 text-slate-100 focus:border-purple-500"
                    )}
                    autoFocus
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    {/* Edit Priority */}
                    <div className="flex items-center space-x-1">
                      {PRIORITIES.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setEditPriority(p.key)}
                          className={clsx(
                            "px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all",
                            editPriority === p.key ? p.colorClass : isLight ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-slate-950 text-slate-400 border-slate-800"
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    {/* Edit Category */}
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as Category)}
                      className={clsx("border rounded-lg px-2 py-0.5 text-[11px] focus:outline-none", isLight ? "bg-white border-blue-200 text-slate-700" : "bg-slate-950 border-slate-800 text-slate-300")}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    {/* Edit Time */}
                    <div className={clsx("flex items-center space-x-1 border rounded-lg px-2 py-0.5 text-[11px]", isLight ? "bg-white border-blue-200 text-slate-700" : "bg-slate-950 border-slate-800 text-slate-300")}>
                      <Clock className="w-3 h-3 text-blue-500" />
                      <input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="bg-transparent text-[11px] focus:outline-none cursor-pointer"
                      />
                    </div>

                    {/* Edit Date */}
                    <div className={clsx("flex items-center space-x-1 border rounded-lg px-2 py-0.5 text-[11px]", isLight ? "bg-white border-blue-200 text-slate-700" : "bg-slate-950 border-slate-800 text-slate-300")}>
                      <CalendarDays className="w-3 h-3 text-blue-600" />
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="bg-transparent text-[11px] focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Save & Cancel */}
                  <div className={clsx("flex items-center justify-end space-x-2 pt-1 border-t", isLight ? "border-blue-100" : "border-slate-800")}>
                    <button
                      onClick={() => setEditingTaskId(null)}
                      className={clsx("flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs transition-colors", isLight ? "text-slate-600 bg-slate-100 hover:bg-slate-200" : "text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800")}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={() => handleSaveEdit(task.id)}
                      className="flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transition-all active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={task.id}
                draggable={!isEditing}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', task.id);
                }}
                className={clsx(
                  "group relative rounded-xl border p-3 transition-all duration-200 cursor-grab active:cursor-grabbing",
                  task.completed
                    ? isLight ? "bg-slate-50/60 border-slate-200 opacity-60" : "bg-slate-950/40 border-slate-900/60 opacity-60"
                    : isLight ? "bg-white border-blue-200/80 hover:border-blue-400 hover:shadow-md" : "bg-slate-900/90 border-slate-800 hover:border-purple-500/40 hover:bg-slate-850"
                )}
              >
                <div className="flex items-start space-x-2.5">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleTaskCheck(task)}
                    className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none cursor-pointer"
                  >
                    {task.completed ? (
                      <CheckCircle className={clsx("w-5 h-5 stroke-[2.5]", isLight ? "text-blue-600 fill-blue-50" : "text-purple-400 fill-purple-500/20")} />
                    ) : (
                      <Circle className={clsx("w-5 h-5 stroke-[2]", isLight ? "text-slate-400 hover:text-blue-600" : "text-slate-500 hover:text-blue-400")} />
                    )}
                  </button>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span
                        className={clsx(
                          "text-xs font-semibold transition-all",
                          task.completed 
                            ? isLight ? "line-through text-slate-400" : "line-through text-slate-500" 
                            : isLight ? "text-slate-900" : "text-slate-100"
                        )}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
                      {/* Priority Badge */}
                      <span className={clsx("px-1.5 py-0.5 rounded font-bold capitalize", `priority-${task.priority}`)}>
                        {PRIORITIES.find((p) => p.key === task.priority)?.label || task.priority}
                      </span>

                      {/* Category Pill with Vector Icon */}
                      <span className={clsx("px-2 py-0.5 rounded-md font-semibold flex items-center space-x-1 text-[10px]", `category-${task.category}`)}>
                        {renderCategoryIcon(task.category, "w-3 h-3")}
                        <span>{task.category}</span>
                      </span>

                      {/* Scheduled Time */}
                      {task.time && (
                        <span className={clsx("flex items-center space-x-1 px-1.5 py-0.5 rounded border", isLight ? "text-slate-600 bg-blue-50 border-blue-200" : "text-slate-400 bg-slate-950 border-slate-800")}>
                          <Clock className="w-3 h-3 text-blue-500" />
                          <span>{task.time}</span>
                        </span>
                      )}

                      {/* Subtask Count */}
                      {subtasks.length > 0 && (
                        <button
                          onClick={() => toggleTaskExpansion(task.id)}
                          className={clsx(
                            "flex items-center space-x-1 px-1.5 py-0.5 rounded border",
                            isLight ? "text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200" : "text-purple-300 hover:text-white bg-purple-950/60 border-purple-800/40"
                          )}
                        >
                          <span>Subtasks ({completedSubtasks}/{subtasks.length})</span>
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setReschedulingTaskId((prev) => (prev === task.id ? null : task.id))}
                      className={clsx("p-1 rounded-lg transition-colors", isLight ? "text-slate-500 hover:text-blue-600 hover:bg-blue-50" : "text-slate-400 hover:text-indigo-400 hover:bg-slate-800")}
                      title="Move to another date"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => startEditingTask(task)}
                      className={clsx("p-1 rounded-lg transition-colors", isLight ? "text-slate-500 hover:text-blue-600 hover:bg-blue-50" : "text-slate-400 hover:text-purple-400 hover:bg-slate-800")}
                      title="Edit Task"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleTaskExpansion(task.id)}
                      className={clsx("p-1 rounded-lg transition-colors", isLight ? "text-slate-500 hover:text-blue-600 hover:bg-blue-50" : "text-slate-400 hover:text-blue-400 hover:bg-slate-800")}
                      title="Add Subtask"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className={clsx("p-1 rounded-lg transition-colors", isLight ? "text-slate-500 hover:text-red-600 hover:bg-red-50" : "text-slate-400 hover:text-red-400 hover:bg-slate-800")}
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Reschedule Quick Popover */}
                {reschedulingTaskId === task.id && (
                  <div className={clsx("mt-2.5 pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-xs p-2 rounded-xl", isLight ? "bg-blue-50/80 border-blue-200" : "bg-slate-950/90 border-purple-900/40")}>
                    <span className={clsx("text-[11px] font-semibold flex items-center space-x-1", isLight ? "text-slate-700" : "text-slate-400")}>
                      <Calendar className="w-3 h-3 text-blue-500" />
                      <span>Move to:</span>
                    </span>

                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      <button
                        onClick={() => {
                          const tom = new Date();
                          tom.setDate(tom.getDate() + 1);
                          const tomKey = tom.toISOString().split('T')[0];
                          onMoveTaskDate?.(task.id, tomKey);
                          setReschedulingTaskId(null);
                        }}
                        className={clsx("px-2 py-0.5 rounded border transition-colors", isLight ? "bg-white hover:bg-blue-100 border-blue-200 text-blue-700" : "bg-purple-950/80 hover:bg-purple-900 border-purple-800/50 text-purple-300 hover:text-white")}
                      >
                        Tomorrow
                      </button>
                      <button
                        onClick={() => {
                          const nextWk = new Date();
                          nextWk.setDate(nextWk.getDate() + 7);
                          const nextWkKey = nextWk.toISOString().split('T')[0];
                          onMoveTaskDate?.(task.id, nextWkKey);
                          setReschedulingTaskId(null);
                        }}
                        className={clsx("px-2 py-0.5 rounded border transition-colors", isLight ? "bg-white hover:bg-blue-100 border-blue-200 text-blue-700" : "bg-blue-950/80 hover:bg-blue-900 border-blue-800/50 text-blue-300 hover:text-white")}
                      >
                        Next Week
                      </button>

                      <input
                        type="date"
                        value={task.date}
                        onChange={(e) => {
                          if (e.target.value) {
                            onMoveTaskDate?.(task.id, e.target.value);
                            setReschedulingTaskId(null);
                          }
                        }}
                        className={clsx("border rounded px-1.5 py-0.5 text-[10px] focus:outline-none cursor-pointer", isLight ? "bg-white border-blue-200 text-slate-800" : "bg-slate-900 border-slate-700 text-slate-200")}
                      />
                    </div>
                  </div>
                )}

                {/* Subtasks Accordion */}
                {isExpanded && (
                  <div className={clsx("mt-3 pt-2 border-t space-y-1.5 pl-7", isLight ? "border-blue-100" : "border-slate-800/80")}>
                    {subtasks.map((st) => (
                      <div key={st.id} className="flex items-center space-x-2 text-xs">
                        <button
                          onClick={() => onToggleSubtask(task.id, st.id)}
                          className={clsx(isLight ? "text-slate-400 hover:text-blue-600" : "text-slate-500 hover:text-purple-400")}
                        >
                          {st.completed ? (
                            <CheckCircle className={clsx("w-3.5 h-3.5", isLight ? "text-blue-600" : "text-purple-400")} />
                          ) : (
                            <Circle className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className={clsx(isLight ? "text-slate-700" : "text-slate-300", st.completed && (isLight ? "line-through text-slate-400" : "line-through text-slate-500"))}>
                          {st.title}
                        </span>
                      </div>
                    ))}

                    {/* Add Subtask Input */}
                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="text"
                        value={newSubtaskTitle[task.id] || ''}
                        onChange={(e) => setNewSubtaskTitle((prev) => ({ ...prev, [task.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubtaskSubmit(task.id)}
                        placeholder="Add subtask..."
                        className={clsx(
                          "flex-1 border rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-blue-500",
                          isLight ? "bg-white border-blue-200 text-slate-800" : "bg-slate-950 border-slate-800 text-slate-300"
                        )}
                      />
                      <button
                        onClick={() => handleSubtaskSubmit(task.id)}
                        className="px-2 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-[11px] font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
