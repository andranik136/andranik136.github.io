import React from 'react';
import { DailyNote } from '../../types';
import { formatFullDate } from '../../utils/dateUtils';
import { 
  CheckCircle2, 
  Bold, 
  Italic, 
  List, 
  CheckSquare, 
  Heading,
  Pencil,
  Save,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import clsx from 'clsx';

interface DailyNotesProps {
  selectedDateKey: string;
  note: DailyNote | undefined;
  onSaveNote: (dateKey: string, content: string) => void;
  theme?: 'dark' | 'light';
  isMinimized?: boolean;
  onToggleMinimize?: (minimized: boolean) => void;
}

export function renderMarkdown(text: string, isLight: boolean = false): React.ReactNode {
  if (!text || !text.trim()) {
    return (
      <div className={clsx("italic text-xs py-4 flex flex-col items-center justify-center text-center space-y-2", isLight ? "text-slate-400" : "text-slate-500")}>
        <p>No notes written for this date yet.</p>
        <span className={clsx("text-[11px] font-medium", isLight ? "text-blue-600" : "text-purple-400")}>Click the Edit button above to add notes.</span>
      </div>
    );
  }

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className={clsx("list-disc list-inside my-1.5 space-y-1", isLight ? "text-slate-700" : "text-slate-300")}>
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const parseInline = (lineText: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(lineText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(lineText.substring(lastIndex, match.index));
      }

      if (match[0].startsWith('**')) {
        parts.push(<strong key={match.index} className={clsx("font-bold", isLight ? "text-slate-900" : "text-slate-100")}>{match[2]}</strong>);
      } else if (match[0].startsWith('*')) {
        parts.push(<em key={match.index} className={clsx("italic", isLight ? "text-blue-700 font-medium" : "text-purple-300")}>{match[3]}</em>);
      } else if (match[0].startsWith('`')) {
        parts.push(
          <code key={match.index} className={clsx("px-1.5 py-0.5 rounded text-xs font-mono border", isLight ? "bg-blue-50 text-blue-800 border-blue-200" : "bg-slate-800 text-purple-300 border-slate-700")}>
            {match[4]}
          </code>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < lineText.length) {
      parts.push(lineText.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [lineText];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ')) {
      flushList();
      const isChecked = trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ');
      const checkText = trimmed.replace(/^- \[(x|X| )\] /, '');
      elements.push(
        <div key={`check-${index}`} className={clsx("flex items-center space-x-2 my-1 text-xs", isLight ? "text-slate-800" : "text-slate-200")}>
          <span className={clsx("w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-bold border", isChecked ? (isLight ? "bg-blue-600 border-blue-500 text-white" : "bg-purple-600 border-purple-500 text-white") : (isLight ? "border-slate-300 bg-white text-transparent" : "border-slate-600 bg-slate-900 text-transparent"))}>
            ✓
          </span>
          <span className={isChecked ? (isLight ? 'line-through text-slate-400' : 'line-through text-slate-500') : ''}>
            {parseInline(checkText)}
          </span>
        </div>
      );
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      const itemText = trimmed.substring(2);
      listItems.push(
        <li key={`li-${index}`} className={clsx("text-xs leading-relaxed", isLight ? "text-slate-700" : "text-slate-200")}>
          {parseInline(itemText)}
        </li>
      );
      return;
    } else {
      flushList();
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${index}`} className={clsx("text-xs font-bold mt-2 mb-1", isLight ? "text-slate-900" : "text-slate-100")}>
          {parseInline(trimmed.substring(4))}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${index}`} className={clsx("text-xs font-bold mt-3 mb-1.5 pb-0.5 border-b", isLight ? "text-blue-700 border-blue-200" : "text-purple-300 border-purple-900/40")}>
          {parseInline(trimmed.substring(3))}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${index}`} className={clsx("text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r mt-3 mb-1.5", isLight ? "from-blue-700 to-indigo-700" : "from-blue-400 to-purple-400")}>
          {parseInline(trimmed.substring(2))}
        </h1>
      );
    } else if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${index}`} className={clsx("border-l-2 pl-2.5 my-1.5 italic text-xs", isLight ? "border-blue-500 text-slate-600 bg-blue-50/40 py-1 rounded-r-md" : "border-purple-500 text-slate-400")}>
          {parseInline(trimmed.substring(2))}
        </blockquote>
      );
    } else if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={`hr-${index}`} className={clsx("my-2", isLight ? "border-blue-200" : "border-purple-900/40")} />);
    } else if (trimmed === '') {
      elements.push(<div key={`space-${index}`} className="h-1.5" />);
    } else {
      elements.push(
        <p key={`p-${index}`} className={clsx("text-xs leading-relaxed my-0.5", isLight ? "text-slate-800" : "text-slate-200")}>
          {parseInline(line)}
        </p>
      );
    }
  });

  flushList();

  return <div className="space-y-0.5">{elements}</div>;
}

export const DailyNotes: React.FC<DailyNotesProps> = ({
  selectedDateKey,
  note,
  onSaveNote,
  theme,
  isMinimized = false,
  onToggleMinimize,
}) => {
  const [content, setContent] = React.useState(note?.content || '');
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(true);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const isLight = theme === 'light';
  const hasNoteContent = Boolean(content && content.trim().length > 0);

  // Sync internal state when date changes
  React.useEffect(() => {
    setContent(note?.content || '');
    setIsEditing(false);
    setIsSaved(true);
  }, [selectedDateKey, note]);

  const handleChangeContent = (val: string) => {
    setContent(val);
    setIsSaved(false);
  };

  const handleSaveNote = () => {
    onSaveNote(selectedDateKey, content);
    setIsSaved(true);
    setIsEditing(false);
    if (!content.trim()) {
      onToggleMinimize?.(true);
    }
  };

  const handleInsertSnippet = (snippet: string) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const textBefore = content.substring(0, start);
    const textAfter = content.substring(end);

    const newContent = textBefore + snippet + textAfter;
    setContent(newContent);
    setIsSaved(false);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 50);
  };

  // Word count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  if (isMinimized) {
    return (
      <div
        onClick={() => {
          setIsEditing(true);
          onToggleMinimize?.(false);
        }}
        className={clsx(
          "flex items-center justify-between p-3.5 rounded-xl border shadow-lg transition-all duration-200 cursor-pointer group hover:scale-[1.005]",
          isLight 
            ? "bg-white border-blue-200/90 hover:border-blue-300 shadow-blue-500/5" 
            : "bg-slate-900/90 border-purple-900/40 hover:border-purple-500/40"
        )}
      >
        <div className="flex items-center space-x-3">
          <div className={clsx(
            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors",
            isLight ? "bg-blue-50 text-blue-600 border-blue-200 group-hover:bg-blue-100" : "bg-purple-950/60 text-purple-400 border-purple-800/40 group-hover:border-purple-500/50"
          )}>
            📝
          </div>
          <div>
            <h3 className={clsx("text-xs font-bold flex items-center space-x-2", isLight ? "text-slate-900" : "text-slate-100")}>
              <span>Notes</span>
              {hasNoteContent && (
                <span className={clsx("px-1.5 py-0.2 text-[10px] rounded-full border font-normal", isLight ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-950 text-purple-300 border-purple-800/50")}>
                  {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </span>
              )}
            </h3>
            <p className={clsx("text-[10px] font-medium", isLight ? "text-slate-500" : "text-slate-400")}>
              {hasNoteContent ? 'Click to view notes' : 'No notes written for this date'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
              onToggleMinimize?.(false);
            }}
            className={clsx(
              "flex items-center space-x-1 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium active:scale-95",
              isLight 
                ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 shadow-2xs" 
                : "bg-slate-800/80 hover:bg-slate-700 text-purple-300 hover:text-white border-purple-900/40"
            )}
          >
            <Pencil className="w-3 h-3" />
            <span>{hasNoteContent ? 'Edit Note' : '+ Add Note'}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMinimize?.(false);
            }}
            className={clsx(
              "p-1.5 rounded-lg border transition-all text-xs font-medium",
              isLight ? "text-slate-500 hover:bg-blue-50 border-blue-200" : "text-slate-400 hover:bg-slate-800 border-purple-900/40"
            )}
            title="Expand Notes"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(
      "flex flex-col h-full rounded-xl border overflow-hidden shadow-xl transition-colors",
      isLight 
        ? "bg-white border-blue-200/90 shadow-blue-500/5" 
        : "bg-slate-900/90 border-purple-900/40"
    )}>
      {/* Sidebar Section Header */}
      <div className={clsx(
        "p-4 border-b flex items-center justify-between transition-colors",
        isLight ? "bg-blue-50/70 border-blue-200" : "bg-slate-950/60 border-purple-900/40"
      )}>
        <div>
          <h2 className={clsx("text-sm font-bold", isLight ? "text-slate-900" : "text-slate-100")}>
            Notes
          </h2>
          <p className={clsx("text-[11px] font-medium", isLight ? "text-slate-500" : "text-slate-400")}>
            {formatFullDate(selectedDateKey)}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <button
              onClick={handleSaveNote}
              className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
              title="Save Note"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className={clsx(
                  "flex items-center space-x-1 px-2.5 py-1 rounded-xl border transition-all text-xs font-medium",
                  isLight 
                    ? "bg-white hover:bg-blue-100 text-blue-700 border-blue-200 shadow-2xs" 
                    : "bg-slate-800/80 hover:bg-slate-700 text-purple-300 hover:text-white border-purple-900/40"
                )}
                title="Edit Note"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit</span>
              </button>

              <span className={clsx("flex items-center space-x-1 font-medium text-[11px]", isLight ? "text-blue-600" : "text-purple-400")}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved</span>
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onToggleMinimize?.(true)}
            className={clsx(
              "p-1.5 rounded-xl border transition-all text-xs font-medium",
              isLight ? "text-slate-500 hover:bg-blue-100 border-blue-200" : "text-slate-400 hover:bg-slate-800 border-purple-900/40"
            )}
            title="Minimize Notes"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Markdown Formatting Toolbar (Only in Edit mode) */}
      {isEditing && (
        <div className={clsx("px-3 py-1.5 border-b flex items-center space-x-1", isLight ? "bg-blue-50/40 border-blue-200" : "bg-slate-950/60 border-purple-900/30")}>
          <button
            onClick={() => handleInsertSnippet('## ')}
            className={clsx("p-1.5 rounded-md transition-colors", isLight ? "text-slate-600 hover:text-blue-600 hover:bg-blue-100" : "text-slate-400 hover:text-white hover:bg-slate-800")}
            title="Heading"
          >
            <Heading className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleInsertSnippet('**bold**')}
            className={clsx("p-1.5 rounded-md transition-colors", isLight ? "text-slate-600 hover:text-blue-600 hover:bg-blue-100" : "text-slate-400 hover:text-white hover:bg-slate-800")}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleInsertSnippet('*italic*')}
            className={clsx("p-1.5 rounded-md transition-colors", isLight ? "text-slate-600 hover:text-blue-600 hover:bg-blue-100" : "text-slate-400 hover:text-white hover:bg-slate-800")}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleInsertSnippet('- ')}
            className={clsx("p-1.5 rounded-md transition-colors", isLight ? "text-slate-600 hover:text-blue-600 hover:bg-blue-100" : "text-slate-400 hover:text-white hover:bg-slate-800")}
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleInsertSnippet('- [ ] ')}
            className={clsx("p-1.5 rounded-md transition-colors", isLight ? "text-slate-600 hover:text-blue-600 hover:bg-blue-100" : "text-slate-400 hover:text-white hover:bg-slate-800")}
            title="Task Checkbox"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>

          <div className={clsx("ml-auto text-[10px] font-mono", isLight ? "text-slate-500" : "text-slate-400")}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </div>
        </div>
      )}

      {/* Editor or Rendered View */}
      <div className="flex-1 p-4 relative flex flex-col min-h-0 overflow-y-auto scrollbar-thin">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleChangeContent(e.target.value)}
            placeholder={`Write notes, thoughts, or meeting agendas for ${formatFullDate(selectedDateKey)}...`}
            className={clsx(
              "w-full flex-1 bg-transparent text-xs focus:outline-none resize-none leading-relaxed font-sans scrollbar-thin",
              isLight ? "text-slate-800 placeholder-slate-400" : "text-slate-200 placeholder-slate-500"
            )}
            autoFocus
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="flex-1 cursor-pointer group"
            title="Click to edit notes"
          >
            {renderMarkdown(content, isLight)}
          </div>
        )}
      </div>
    </div>
  );
};
