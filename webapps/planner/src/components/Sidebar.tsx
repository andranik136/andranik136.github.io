import { Calendar, LayoutTemplate, Sun, Plus, Edit2, Check } from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useState } from 'react';
import clsx from 'clsx';

export function Sidebar() {
    const { currentView, setCurrentView, activePlan, updatePlan } = usePlannerStore();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState('');

    const handleEditStart = () => {
        setTitleInput(activePlan?.title || '');
        setIsEditingTitle(true);
    };

    const handleEditSave = async () => {
        if (activePlan && titleInput.trim()) {
            await updatePlan(activePlan.id, { title: titleInput.trim() });
        }
        setIsEditingTitle(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleEditSave();
        } else if (e.key === 'Escape') {
            setIsEditingTitle(false);
        }
    };
    // For now, we'll just have the global actions

    return (
        <aside className="w-64 flex-shrink-0 border-r border-planner-border bg-planner-surface flex flex-col h-full transition-all">
            <div className="p-4 flex items-center space-x-2">
                <LayoutTemplate className="w-6 h-6 text-planner-primary" />
                <span className="font-bold text-lg text-planner-text tracking-tight">Planner</span>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <SidebarItem icon={<Sun size={18} />} label="My Day" active={currentView === 'MyDay'} onClick={() => setCurrentView('MyDay')} />
                <SidebarItem icon={<Calendar size={18} />} label="Schedule" active={currentView === 'Schedule'} onClick={() => setCurrentView('Schedule')} />

                <div className="pt-6 pb-2">
                    <p className="px-3 text-xs font-semibold text-planner-textMuted uppercase tracking-wider">
                        Task Lists
                    </p>
                </div>

                {activePlan && (
                    <div className={clsx(
                        "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        "bg-blue-50 text-planner-primary group"
                    )}>
                        <div className="flex items-center space-x-3 flex-1 overflow-hidden">
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                            {isEditingTitle ? (
                                <input
                                    type="text"
                                    value={titleInput}
                                    onChange={(e) => setTitleInput(e.target.value)}
                                    onBlur={handleEditSave}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                    className="flex-1 min-w-0 bg-transparent border-b border-blue-300 focus:outline-none focus:border-blue-500 text-planner-primary px-1"
                                />
                            ) : (
                                <span className="truncate">{activePlan.title}</span>
                            )}
                        </div>
                        {!isEditingTitle && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleEditStart(); }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded text-blue-600 transition-opacity"
                                title="Rename Task List"
                            >
                                <Edit2 size={14} />
                            </button>
                        )}
                        {isEditingTitle && (
                            <button
                                onMouseDown={(e) => { e.preventDefault(); handleEditSave(); }}
                                className="p-1 hover:bg-blue-100 rounded text-blue-600"
                                title="Save"
                            >
                                <Check size={14} />
                            </button>
                        )}
                    </div>
                )}
            </nav>

            <div className="p-4 border-t border-planner-border">
                <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-planner-textMuted hover:text-planner-text hover:bg-gray-50 rounded-md transition-colors">
                    <Plus size={18} className="mr-2" />
                    New Task List
                </button>
            </div>
        </aside>
    );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                active ? "bg-gray-100 text-planner-text" : "text-planner-textMuted hover:bg-gray-50 hover:text-planner-text"
            )}>
            <span className="mr-3 opacity-70">{icon}</span>
            {label}
        </button>
    );
}
