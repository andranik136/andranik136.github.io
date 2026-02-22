import { useMemo, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import type { Bucket } from '../../db/db';
import { usePlannerStore } from '../../store/usePlannerStore';
import { TaskCard } from './TaskCard';
import clsx from 'clsx';

interface BucketColumnProps {
    bucket: Bucket;
    isOverlay?: boolean;
}

export function BucketColumn({ bucket, isOverlay }: BucketColumnProps) {
    const { tasks, activePlanId, addTask, deleteBucket, updateBucket } = usePlannerStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const PLAN_COLORS = [
        '#ef4444', '#f97316', '#f59e0b', '#eab308',
        '#84cc16', '#22c55e', '#10b981', '#14b8a6',
        '#06b6d4', '#0ea5e9', '#3b82f6', '#8b5cf6'
    ];

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
                className="flex items-center justify-between p-4 pb-2 cursor-grab active:cursor-grabbing group relative"
            >
                <h3 className="font-semibold text-sm text-planner-text tracking-wide flex items-center space-x-2">
                    {bucket.color && (
                        <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: bucket.color }}
                        />
                    )}
                    <span>{bucket.title}</span>
                </h3>
                <div className="relative">
                    <button
                        className="p-1 text-planner-textMuted opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsMenuOpen(!isMenuOpen);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <MoreHorizontal size={16} />
                    </button>
                    {isMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40 cursor-default"
                                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}
                                onPointerDown={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}
                            />
                            <div
                                className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-100 p-2 z-50 cursor-default"
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('Are you sure you want to delete this bucket and all its tasks?')) {
                                            deleteBucket(bucket.id);
                                        }
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <Trash2 size={16} className="mr-2" />
                                    Delete Bucket
                                </button>

                                <div className="mt-2 pt-2 border-t border-gray-100">
                                    <p className="px-3 pb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Bucket Color</p>
                                    <div className="grid grid-cols-4 gap-2 px-2">
                                        {PLAN_COLORS.map(color => (
                                            <button
                                                key={color}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateBucket(bucket.id, { color });
                                                    setIsMenuOpen(false);
                                                }}
                                                className={clsx(
                                                    "w-8 h-8 rounded-full shadow-sm hover:scale-110 transition-transform focus:outline-none border-2",
                                                    bucket.color === color ? "border-gray-900" : "border-transparent"
                                                )}
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateBucket(bucket.id, { color: undefined });
                                                setIsMenuOpen(false);
                                            }}
                                            className={clsx(
                                                "w-8 h-8 rounded-full shadow-sm hover:scale-110 transition-transform focus:outline-none border-2 flex items-center justify-center bg-gray-100",
                                                !bucket.color ? "border-gray-900" : "border-gray-300"
                                            )}
                                            title="Clear Color"
                                        >
                                            <span className="w-4 h-0.5 bg-gray-400 rotate-45 rounded-full" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
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
