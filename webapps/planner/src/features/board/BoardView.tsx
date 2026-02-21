import React, { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';

import type { Bucket, Task } from '../../db/db';
import { usePlannerStore } from '../../store/usePlannerStore';
import { BucketColumn } from './BucketColumn';
import { TaskCard } from './TaskCard';

export function BoardView() {
    const { buckets, tasks, activePlanId, addBucket, updateBucketOrder, updateTask, reorderTasks } = usePlannerStore();

    const [activeBucket, setActiveBucket] = useState<Bucket | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // minimum drag distance before activating
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const bucketIds = React.useMemo(() => buckets.map((b) => b.id), [buckets]);

    const handleAddBucket = () => {
        if (!activePlanId) return;
        const title = prompt('Enter new bucket name:');
        if (title && title.trim()) {
            addBucket({ planId: activePlanId, title: title.trim(), orderIndex: buckets.length });
        }
    };

    const onDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const activeData = active.data.current;

        if (activeData?.type === 'Bucket') {
            setActiveBucket(activeData.bucket);
            return;
        }

        if (activeData?.type === 'Task') {
            setActiveTask(activeData.task);
            return;
        }
    };

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === 'Task';
        const isOverTask = over.data.current?.type === 'Task';
        const isOverBucket = over.data.current?.type === 'Bucket';

        if (!isActiveTask) return;

        // 1. Moving a Task over another Task
        if (isActiveTask && isOverTask) {
            const activeTask = active.data.current!.task as Task;
            const overTask = over.data.current!.task as Task;

            if (activeTask.bucketId !== overTask.bucketId) {
                // Find tasks in both buckets
                // Removed unused activeTasks definition
                const overTasks = tasks.filter((t) => t.bucketId === overTask.bucketId).sort((a, b) => a.orderIndex - b.orderIndex);

                // Removed unused activeIndex definition
                const overIndex = overTasks.findIndex((t) => t.id === overId);

                // Immediately update task in store to new bucket so it renders there during drag
                updateTask(activeId as string, {
                    bucketId: overTask.bucketId,
                    orderIndex: overIndex,
                });
            }
        }

        // 2. Moving a Task over an empty Bucket
        if (isActiveTask && isOverBucket) {
            const activeTask = active.data.current!.task as Task;
            const overBucketId = overId as string;

            if (activeTask.bucketId !== overBucketId) {
                updateTask(activeId as string, {
                    bucketId: overBucketId,
                    // Put at the bottom
                    orderIndex: tasks.filter(t => t.bucketId === overBucketId).length
                });
            }
        }
    };

    const onDragEnd = (event: DragEndEvent) => {
        setActiveBucket(null);
        setActiveTask(null);

        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveBucket = active.data.current?.type === 'Bucket';
        if (isActiveBucket) {
            const activeIndex = buckets.findIndex((b) => b.id === activeId);
            const overIndex = buckets.findIndex((b) => b.id === overId);

            const newBuckets = arrayMove(buckets, activeIndex, overIndex);
            updateBucketOrder(newBuckets.map(b => b.id));
            return;
        }

        const isActiveTask = active.data.current?.type === 'Task';
        if (isActiveTask) {
            // activeTask removed as it is not used directly below
            const overData = over.data.current;

            const targetBucketId = overData?.type === 'Task' ? overData.task.bucketId : overId;

            const bucketTasks = tasks
                .filter(t => t.bucketId === targetBucketId)
                .sort((a, b) => a.orderIndex - b.orderIndex);

            const activeIndex = bucketTasks.findIndex(t => t.id === activeId);
            let overIndex = bucketTasks.findIndex(t => t.id === overId);
            if (overIndex === -1 && overData?.type === 'Bucket') {
                // dropped on empty bucket zone
                overIndex = bucketTasks.length;
            }

            const newBucketTasks = arrayMove(bucketTasks, activeIndex, overIndex);
            reorderTasks(targetBucketId as string, newBucketTasks.map(t => t.id));
        }
    };

    return (
        <div className="absolute inset-0 overflow-x-auto overflow-y-hidden">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <div className="flex h-full p-6 items-start gap-4 inline-flex min-w-full">
                    <SortableContext items={bucketIds} strategy={horizontalListSortingStrategy}>
                        {buckets.map((bucket) => (
                            <BucketColumn key={bucket.id} bucket={bucket} />
                        ))}
                    </SortableContext>

                    <button
                        onClick={handleAddBucket}
                        className="w-[320px] flex-shrink-0 flex items-center px-4 py-3 bg-planner-surface/50 hover:bg-planner-surface border border-dashed border-planner-border rounded-xl text-planner-textMuted hover:text-planner-text transition-colors shadow-sm"
                    >
                        <Plus size={20} className="mr-2" />
                        <span className="font-medium text-sm">Add new bucket</span>
                    </button>

                    <div className="w-4 flex-shrink-0"></div>
                </div>

                <DragOverlay>
                    {activeBucket && <BucketColumn bucket={activeBucket} isOverlay />}
                    {activeTask && <TaskCard task={activeTask} isOverlay />}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
