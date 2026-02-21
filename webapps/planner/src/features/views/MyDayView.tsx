import { useMemo } from 'react';
import { isToday, isPast } from 'date-fns';
import { usePlannerStore } from '../../store/usePlannerStore';
import { TaskCard } from '../board/TaskCard';

export function MyDayView() {
    const { tasks } = usePlannerStore();

    const relevantTasks = useMemo(() => {
        const dueToday = tasks.filter(t => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== 'Completed');
        const overdue = tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== 'Completed');
        const urgent = tasks.filter(t => t.priority === 'Urgent' && t.status !== 'Completed' && !dueToday.includes(t) && !overdue.includes(t));

        return {
            dueToday,
            overdue,
            urgent
        };
    }, [tasks]);

    return (
        <div className="absolute inset-0 overflow-auto p-6 bg-planner-surface/50">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">My Day</h2>
                    <p className="text-gray-500 mt-1">Focus on what's important today.</p>
                </div>

                <div className="space-y-8">

                    {relevantTasks.overdue.length > 0 && (
                        <section>
                            <h3 className="text-sm font-semibold text-red-600 uppercase tracking-widest mb-4 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span> Overdue
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {relevantTasks.overdue.map(task => (
                                    <TaskCard key={task.id} task={task} />
                                ))}
                            </div>
                        </section>
                    )}

                    <section>
                        <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-4 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> Due Today
                        </h3>
                        {relevantTasks.dueToday.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {relevantTasks.dueToday.map(task => (
                                    <TaskCard key={task.id} task={task} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-8 text-center text-gray-500 italic">
                                No tasks due today. Enjoy your day!
                            </div>
                        )}
                    </section>

                    {relevantTasks.urgent.length > 0 && (
                        <section>
                            <h3 className="text-sm font-semibold text-orange-500 uppercase tracking-widest mb-4 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span> High Priority
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {relevantTasks.urgent.map(task => (
                                    <TaskCard key={task.id} task={task} />
                                ))}
                            </div>
                        </section>
                    )}

                </div>
            </div>
        </div>
    );
}
