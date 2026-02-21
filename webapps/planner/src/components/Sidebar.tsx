import { Home, Calendar, LayoutTemplate, Sun, Plus } from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';
import clsx from 'clsx';

export function Sidebar() {
    const { currentView, setCurrentView } = usePlannerStore(); // We just call it or not need it at all. Let's remove it completely.

    // Dummy plans list for navigation showcase (in a real app, fetch from db)
    // For now, we'll just have the global actions

    return (
        <aside className="w-64 flex-shrink-0 border-r border-planner-border bg-planner-surface flex flex-col h-full transition-all">
            <div className="p-4 flex items-center space-x-2">
                <LayoutTemplate className="w-6 h-6 text-planner-primary" />
                <span className="font-bold text-lg text-planner-text tracking-tight">Planner Next</span>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <SidebarItem icon={<Sun size={18} />} label="My Day" active={currentView === 'MyDay'} onClick={() => setCurrentView('MyDay')} />
                <SidebarItem icon={<Home size={18} />} label="Hub" active={currentView === 'Hub'} onClick={() => setCurrentView('Hub')} />
                <SidebarItem icon={<Calendar size={18} />} label="Schedule" active={currentView === 'Schedule'} onClick={() => setCurrentView('Schedule')} />

                <div className="pt-6 pb-2">
                    <p className="px-3 text-xs font-semibold text-planner-textMuted uppercase tracking-wider">
                        My Plans
                    </p>
                </div>

                {/* We only have one dynamic plan loading right now, but this is where the list goes */}
                <button className={clsx(
                    "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    "bg-blue-50 text-planner-primary"
                )}>
                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-3"></span>
                    My First Project
                </button>
            </nav>

            <div className="p-4 border-t border-planner-border">
                <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-planner-textMuted hover:text-planner-text hover:bg-gray-50 rounded-md transition-colors">
                    <Plus size={18} className="mr-2" />
                    New Plan
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
