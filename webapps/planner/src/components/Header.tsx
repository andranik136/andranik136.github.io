import { Filter, MoreHorizontal, Download, Upload, Trash2 } from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';
import { exportData, importData } from '../utils/exportImport';
import { useRef, useState, useEffect } from 'react';

export function Header() {
    const { activePlan, currentView, setCurrentView, initApp, deletePlan } = usePlannerStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            await importData(file);
            await initApp(); // refresh zustand state 
            alert('Data imported successfully!');
        } catch (error) {
            console.error('Import failed', error);
            alert('Failed to import data. Check console for details.');
        }
    };

    const handleDeletePlan = async () => {
        setIsMenuOpen(false);
        if (!activePlan) return;
        const confirmDelete = window.confirm(`Are you sure you want to delete the task list "${activePlan.title}"? This action cannot be undone.`);
        if (confirmDelete) {
            await deletePlan(activePlan.id);
        }
    };

    return (
        <header className="h-16 border-b border-planner-border bg-planner-surface flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center">
                <h1 className="text-xl font-semibold text-planner-text">
                    {activePlan?.title || 'Unknown Plan'}
                </h1>
                {/* Navigation tabs for views */}
                <div className="ml-8 hidden md:flex items-center space-x-1">
                    {(['Board', 'Grid', 'Charts', 'Schedule'] as const).map(view => (
                        <button
                            key={view}
                            onClick={() => setCurrentView(view)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${currentView === view ? 'bg-planner-bg text-planner-text' : 'text-planner-textMuted hover:text-planner-text hover:bg-gray-50'
                                }`}
                        >
                            {view}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 text-sm font-medium text-planner-textMuted hover:text-planner-text px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors">
                    <Filter size={16} />
                    <span>Filter</span>
                </button>
                <div className="w-px h-5 bg-gray-200"></div>
                <button
                    onClick={() => exportData()}
                    className="flex items-center space-x-1.5 text-sm font-medium text-planner-textMuted hover:text-planner-text px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
                    title="Export JSON Backup"
                >
                    <Download size={16} />
                </button>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-1.5 text-sm font-medium text-planner-textMuted hover:text-planner-text px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
                    title="Import JSON Backup"
                >
                    <Upload size={16} />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".json,application/json"
                    onChange={handleImport}
                />
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="w-8 h-8 flex items-center justify-center text-planner-textMuted hover:text-planner-text rounded-full hover:bg-gray-50 transition-colors"
                    >
                        <MoreHorizontal size={20} />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden">
                            <div className="py-1">
                                <button
                                    onClick={handleDeletePlan}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                                >
                                    <Trash2 size={16} />
                                    <span>Delete Task List</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
