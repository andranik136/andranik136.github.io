import { Filter, MoreHorizontal, Download, Upload } from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';
import { exportData, importData } from '../utils/exportImport';
import { useRef } from 'react';

export function Header() {
    const { activePlan, currentView, setCurrentView, initApp } = usePlannerStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                <button className="w-8 h-8 flex items-center justify-center text-planner-textMuted hover:text-planner-text rounded-full hover:bg-gray-50 transition-colors">
                    <MoreHorizontal size={20} />
                </button>
            </div>
        </header>
    );
}
