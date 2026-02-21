import { Calendar, LayoutTemplate, Sun, Plus, Edit2, Check } from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useState } from 'react';
import clsx from 'clsx';

export function Sidebar() {
    const { currentView, setCurrentView, activePlanId, allPlans, updatePlan, createPlan, setActivePlan } = usePlannerStore();
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const [titleInput, setTitleInput] = useState('');

    const handleEditStart = (plan: any) => {
        setTitleInput(plan.title || '');
        setEditingPlanId(plan.id);
    };

    const handleEditSave = async (planId: string) => {
        if (titleInput.trim()) {
            await updatePlan(planId, { title: titleInput.trim() });
        }
        setEditingPlanId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, planId: string) => {
        if (e.key === 'Enter') {
            handleEditSave(planId);
        } else if (e.key === 'Escape') {
            setEditingPlanId(null);
        }
    };

    const handleCreateNewPlan = async () => {
        const newPlanId = await createPlan('New Plan', '#2563eb');
        await setActivePlan(newPlanId);
        setTitleInput('New Plan');
        setEditingPlanId(newPlanId);
    };

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

                <div className="space-y-1">
                    {allPlans.map((plan) => {
                        const isActive = activePlanId === plan.id;
                        const isEditing = editingPlanId === plan.id;

                        return (
                            <div
                                key={plan.id}
                                onClick={() => setActivePlan(plan.id)}
                                className={clsx(
                                    "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer group",
                                    isActive ? "bg-blue-50 text-planner-primary" : "text-planner-textMuted hover:bg-gray-50 hover:text-planner-text"
                                )}
                            >
                                <div className="flex items-center space-x-3 flex-1 overflow-hidden">
                                    <span className={clsx(
                                        "w-2 h-2 rounded-full flex-shrink-0",
                                        isActive ? "bg-blue-500" : "bg-gray-400 group-hover:bg-gray-500"
                                    )}></span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={titleInput}
                                            onChange={(e) => setTitleInput(e.target.value)}
                                            onBlur={() => handleEditSave(plan.id)}
                                            onKeyDown={(e) => handleKeyDown(e, plan.id)}
                                            autoFocus
                                            className="flex-1 min-w-0 bg-transparent border-b border-blue-300 focus:outline-none focus:border-blue-500 text-planner-primary px-1"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span className="truncate">{plan.title}</span>
                                    )}
                                </div>
                                {!isEditing && isActive && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEditStart(plan); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded text-blue-600 transition-opacity"
                                        title="Rename Task List"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                )}
                                {isEditing && (
                                    <button
                                        onMouseDown={(e) => { e.preventDefault(); handleEditSave(plan.id); e.stopPropagation(); }}
                                        className="p-1 hover:bg-blue-100 rounded text-blue-600"
                                        title="Save"
                                    >
                                        <Check size={14} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </nav>

            <div className="p-4 border-t border-planner-border">
                <button
                    onClick={handleCreateNewPlan}
                    className="flex items-center w-full px-3 py-2 text-sm font-medium text-planner-textMuted hover:text-planner-text hover:bg-gray-50 rounded-md transition-colors"
                >
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
