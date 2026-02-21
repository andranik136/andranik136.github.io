import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle2, Circle, Clock, MoreHorizontal } from 'lucide-react';
import type { Task } from '../../db/db';
import { usePlannerStore } from '../../store/usePlannerStore';
import clsx from 'clsx';

interface TaskCardProps {
    task: Task;
    isOverlay?: boolean;
}

export function TaskCard({ task, isOverlay }: TaskCardProps) {
    const { updateTask, setSelectedTask } = usePlannerStore();

    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: 'Task',
            task,
        },
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    const toggleStatus = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = task.status === 'Completed' ? 'Not Started' : 'Completed';
        updateTask(task.id, { status: newStatus });
    };

    const isCompleted = task.status === 'Completed';

    const priorityColors = {
        Urgent: 'bg-red-100 text-red-700',
        Important: 'bg-orange-100 text-orange-700',
        Medium: 'bg-blue-100 text-blue-700',
        Low: 'bg-gray-100 text-gray-700',
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-white/40 p-3.5 rounded-xl border-2 border-dashed border-gray-400 opacity-50 min-h-[100px]"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => setSelectedTask(task.id)}
            className={clsx(
                "bg-white p-3.5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group relative",
                isCompleted && "opacity-60",
                isOverlay && "shadow-2xl rotate-2 opacity-90 scale-105"
            )}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex flex-wrap gap-1">
                    {task.labels && task.labels.map((label, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: label.color }}>
                            {label.text}
                        </span>
                    ))}
                </div>

                <button className="text-gray-400 hover:bg-gray-100 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 absolute top-2 right-2">
                    <MoreHorizontal size={16} />
                </button>
            </div>

            <div className="flex items-start gap-3">
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={toggleStatus}
                    className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-green-500 transition-colors focus:outline-none"
                >
                    {isCompleted ? <CheckCircle2 size={18} className="text-green-500" /> : <Circle size={18} />}
                </button>
                <div className="flex-1 min-w-0">
                    <p className={clsx("text-sm font-medium text-gray-900 leading-snug break-words", isCompleted && "line-through text-gray-500")}>
                        {task.title}
                    </p>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", priorityColors[task.priority])}>
                        {task.priority}
                    </span>
                    {task.dueDate && (
                        <span className="flex items-center text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            <Clock size={12} className="mr-1" />
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    )}
                </div>

                <div className="w-6 h-6 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-gray-400">ME</span>
                </div>
            </div>
        </div>
    );
}
