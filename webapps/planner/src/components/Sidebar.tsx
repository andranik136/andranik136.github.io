import { useState, type KeyboardEvent } from 'react';
import { Calendar, LayoutTemplate, Sun, Plus, Edit2, Check, X } from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';
import clsx from 'clsx';

export function Sidebar() {
    const { currentView, setCurrentView, activePlan, updatePlan } = usePlannerStore();

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');

    const handleStartEdit = () => {
        if (activePlan) {
            setEditName(activePlan.title);
            setIsEditing(true);
        }
    };

    const handleSaveEdit = async () => {
        if (activePlan && editName.trim()) {
            await updatePlan(activePlan.id, editName.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') handleSaveEdit();
        if (e.key === 'Escape') setIsEditing(false);
    };

    // Dummy plans list for navigation showcase (in a real app, fetch from db)
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

                <div className="pt-6 pb-2 break-all">
                    <p className="px-3 text-xs font-semibold text-planner-textMuted uppercase tracking-wider">
                        Task Lists
                    </p>
                </div>

                {activePlan && (
                    <div className={clsx(
                        "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        "bg-blue-50 text-planner-primary"
                    )}>
                        {isEditing ? (
                            <div className="flex items-center w-full gap-1">
                                <input
                                    autoFocus
                                    className="flex-1 bg-white border border-blue-300 rounded px-1.5 py-0.5 text-sm text-gray-900 outline-none focus:border-blue-500 min-w-0"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onBlur={() => setIsEditing(false)}
                                />
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); handleSaveEdit(); }} className="p-1 hover:bg-blue-100 rounded text-blue-600 shrink-0"><Check size={14} /></button>
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); setIsEditing(false); }} className="p-1 hover:bg-blue-100 rounded text-gray-500 shrink-0"><X size={14} /></button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center flex-1 overflow-hidden" title={activePlan.title}>
                                    <span className="w-2 h-2 shrink-0 rounded-full bg-blue-500 mr-3"></span>
                                    <span className="truncate">{activePlan.title}</span>
                                </div>
                                <button
                                    onClick={handleStartEdit}
                                    className="p-1 ml-2 text-planner-primary opacity-60 hover:opacity-100 hover:bg-blue-100 rounded shrink-0 transition-all"
                                    title="Rename Task List"
                                >
                                    <Edit2 size={14} />
                                </button>
                            </>
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
