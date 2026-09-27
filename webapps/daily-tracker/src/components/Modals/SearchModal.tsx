import React from 'react';
import { Task, DailyNote } from '../../types';
import { Search, FileText, CheckCircle, X } from 'lucide-react';
import { formatFullDate } from '../../utils/dateUtils';

import clsx from 'clsx';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  notes: Record<string, DailyNote>;
  onSelectDate: (dateKey: string) => void;
  theme?: 'dark' | 'light';
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  tasks,
  notes,
  onSelectDate,
  theme,
}) => {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [query, setQuery] = React.useState('');

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

  const handleSelectResult = (dateKey: string) => {
    onSelectDate(dateKey);
    onClose();
  };

  const filteredTasks = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return tasks.filter(
      (t) => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    );
  }, [query, tasks]);

  const filteredNotes = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return Object.values(notes).filter((n) => n.content.toLowerCase().includes(q));
  }, [query, notes]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className={clsx(
        "p-0 rounded-xl border w-full max-w-xl shadow-2xl overflow-hidden transition-colors",
        isLight 
          ? "bg-white border-blue-200 text-slate-900 backdrop:bg-slate-900/40" 
          : "bg-slate-900 border-purple-900/50 text-slate-100 backdrop:bg-slate-950/80"
      )}
    >
      {/* Search Input Bar */}
      <div className={clsx("p-4 border-b flex items-center space-x-3", isLight ? "bg-blue-50/60 border-blue-200" : "bg-slate-950/60 border-purple-900/40")}>
        <Search className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks, categories, or daily notes..."
          className={clsx("flex-1 bg-transparent text-sm focus:outline-none", isLight ? "text-slate-900 placeholder-slate-400" : "text-slate-100 placeholder-slate-500")}
          autoFocus
        />
        <button
          onClick={onClose}
          className={clsx("p-1.5 rounded-xl transition-colors", isLight ? "hover:bg-blue-100 text-slate-500 hover:text-slate-800" : "hover:bg-slate-800 text-slate-400 hover:text-white")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Results List */}
      <div className="p-4 max-h-96 overflow-y-auto space-y-4 scrollbar-thin">
        {!query.trim() ? (
          <div className={clsx("text-center py-8 text-xs", isLight ? "text-slate-400" : "text-slate-500")}>
            Type keywords above to search across scheduled tasks and daily notes.
          </div>
        ) : filteredTasks.length === 0 && filteredNotes.length === 0 ? (
          <div className={clsx("text-center py-8 text-xs", isLight ? "text-slate-400" : "text-slate-500")}>
            No matching tasks or notes found for "{query}".
          </div>
        ) : (
          <>
            {/* Matching Tasks */}
            {filteredTasks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 px-1">
                  Tasks ({filteredTasks.length})
                </h3>
                <div className="space-y-1.5">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleSelectResult(task.date)}
                      className={clsx(
                        "p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all",
                        isLight 
                          ? "bg-slate-50 hover:bg-blue-50/80 border-blue-100 hover:border-blue-300" 
                          : "bg-slate-800/60 hover:bg-purple-950/40 border-slate-700/60 hover:border-purple-500/40"
                      )}
                    >
                      <div className="flex items-center space-x-2.5">
                        <CheckCircle
                          className={`w-4 h-4 ${
                            task.completed ? 'text-blue-600' : isLight ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        />
                        <span className={clsx("text-xs font-semibold", isLight ? "text-slate-800" : "text-slate-200")}>
                          {task.title}
                        </span>
                      </div>
                      <span className={clsx("text-[10px] font-medium", isLight ? "text-slate-500" : "text-slate-400")}>
                        {formatFullDate(task.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Notes */}
            {filteredNotes.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className={clsx("text-xs font-bold uppercase tracking-wider px-1", isLight ? "text-blue-700" : "text-purple-400")}>
                  Daily Notes ({filteredNotes.length})
                </h3>
                <div className="space-y-1.5">
                  {filteredNotes.map((note) => (
                    <div
                      key={note.date}
                      onClick={() => handleSelectResult(note.date)}
                      className={clsx(
                        "p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all",
                        isLight 
                          ? "bg-slate-50 hover:bg-blue-50/80 border-blue-100 hover:border-blue-300" 
                          : "bg-slate-800/60 hover:bg-blue-950/40 border-slate-700/60 hover:border-blue-500/40"
                      )}
                    >
                      <div className="flex items-center space-x-2.5">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className={clsx("text-xs truncate max-w-sm", isLight ? "text-slate-700" : "text-slate-300")}>
                          {note.content.replace(/[#*`]/g, '').slice(0, 50)}...
                        </span>
                      </div>
                      <span className={clsx("text-[10px] font-medium", isLight ? "text-slate-500" : "text-slate-400")}>
                        {formatFullDate(note.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </dialog>
  );
};
