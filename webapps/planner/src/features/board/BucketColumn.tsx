import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MoreHorizontal, Plus } from 'lucide-react';
import type { Bucket } from '../../db/db';
import { usePlannerStore } from '../../store/usePlannerStore';
import { TaskCard } from './TaskCard';
import clsx from 'clsx';

interface BucketColumnProps {
    bucket: Bucket;
    isOverlay?: boolean;
}

export function BucketColumn({ bucket, isOverlay }: BucketColumnProps) {
    const { tasks, activePlanId, addTask } = usePlannerStore();

    // Sort tasks
    const bucketTasks = tasks
        .filter(t => t.bucketId === bucket.id)
        .sort((a, b) => a.orderIndex - b.orderIndex);

    const taskIds = useMemo(() => bucketTasks.map((t) => t.id), [bucketTasks]);

    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: bucket.id,
        data: {
            type: 'Bucket',
            bucket,
        },
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    const handleAddTask = () => {
        if (!activePlanId) return;
        const title = prompt('Enter task name:');
        if (title && title.trim()) {
            addTask({
                planId: activePlanId,
                bucketId: bucket.id,
                title: title.trim(),
                description: '',
                status: 'Not Started',
                priority: 'Medium',
                labels: [],
                orderIndex: bucketTasks.length,
            });
        }
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="flex-shrink-0 w-[320px] bg-gray-200/50 rounded-2xl border-2 border-dashed border-gray-400 opacity-50"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={clsx(
                "flex flex-col flex-shrink-0 w-[320px] max-h-full bg-gray-100/80 rounded-2xl transition-shadow",
                isOverlay && "shadow-2xl rotate-2 opacity-90 scale-105"
            )}
        >
            {/* Bucket Header / Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="flex items-center justify-between p-4 pb-2 cursor-grab active:cursor-grabbing group"
            >
                <h3 className="font-semibold text-sm text-planner-text tracking-wide">{bucket.title}</h3>
                <button className="p-1 text-planner-textMuted opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all">
                    <MoreHorizontal size={16} />
                </button>
            </div>

            <div className="px-3 pb-2 pt-1">
                <button
                    onClick={handleAddTask}
                    className="w-full flex items-center text-sm font-medium text-planner-textMuted bg-transparent hover:bg-gray-200 rounded-lg px-3 py-2 transition-colors duration-200"
                >
                    <Plus size={16} className="mr-2" />
                    Add task
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-3 custom-scrollbar min-h-[100px]">
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {bucketTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}
