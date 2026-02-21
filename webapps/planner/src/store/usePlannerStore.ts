import { create } from 'zustand';
import { db } from '../db/db';
import type { Plan, Bucket, Task, ChecklistItem, Note } from '../db/db';

type ID = string;
export type ViewMode = 'Board' | 'Grid' | 'Charts' | 'Schedule' | 'MyDay' | 'Hub';

interface PlannerState {
    activePlanId: ID | null;
    activePlan: Plan | null;
    buckets: Bucket[];
    tasks: Task[];
    checklistItems: ChecklistItem[];
    notes: Note[];

    selectedTaskId: ID | null;
    setSelectedTask: (taskId: ID | null) => void;

    currentView: ViewMode;
    setCurrentView: (view: ViewMode) => void;

    // App initialization
    initApp: () => Promise<void>;

    // Actions
    setActivePlan: (planId: ID) => Promise<void>;
    createPlan: (title: string, theme: string) => Promise<string>;
    updatePlan: (planId: ID, updates: Partial<Plan>) => Promise<void>;

    addBucket: (bucket: Omit<Bucket, 'id'>) => Promise<void>;
    updateBucket: (bucketId: ID, updates: Partial<Bucket>) => Promise<void>;
    deleteBucket: (bucketId: ID) => Promise<void>;
    updateBucketOrder: (orderedBucketIds: ID[]) => Promise<void>;

    addTask: (task: Omit<Task, 'id'>) => Promise<string>;
    updateTask: (taskId: ID, updates: Partial<Task>) => Promise<void>;
    deleteTask: (taskId: ID) => Promise<void>;
    moveTask: (taskId: ID, newBucketId: ID, newOrderIndex: number) => Promise<void>;
    reorderTasks: (bucketId: ID, orderedTaskIds: ID[]) => Promise<void>;

    // Checklist Actions
    addChecklistItem: (taskId: ID, title: string) => Promise<void>;
    updateChecklistItem: (itemId: ID, updates: Partial<ChecklistItem>) => Promise<void>;
    deleteChecklistItem: (itemId: ID) => Promise<void>;

    // Note Actions
    addNote: (taskId: ID, text: string) => Promise<void>;
    deleteNote: (noteId: ID) => Promise<void>;
}

const generateId = () => crypto.randomUUID();

export const usePlannerStore = create<PlannerState>((set, get) => ({
    activePlanId: null,
    activePlan: null,
    buckets: [],
    tasks: [],
    checklistItems: [],
    notes: [],

    selectedTaskId: null,
    setSelectedTask: (taskId) => set({ selectedTaskId: taskId }),

    currentView: 'Board',
    setCurrentView: (view) => set({ currentView: view }),

    initApp: async () => {
        const plans = await db.plans.toArray();
        if (plans.length > 0) {
            // Load the most recently created or first plan
            const latestPlan = plans.sort((a, b) => b.createdAt - a.createdAt)[0];
            await get().setActivePlan(latestPlan.id);
        } else {
            // Create a default plan if none exists
            const newPlanId = await get().createPlan('My First Project', '#2563eb');
            await get().setActivePlan(newPlanId);
        }
    },

    setActivePlan: async (planId: ID) => {
        const plan = await db.plans.get(planId);
        if (!plan) return;

        // Load associated data
        const buckets = await db.buckets.where('planId').equals(planId).sortBy('orderIndex');
        const tasks = await db.tasks.where('planId').equals(planId).toArray();

        // Load all checklist items and notes for tasks in this plan
        const taskIds = tasks.map(t => t.id);
        const checklistItems = await db.checklistItems.where('taskId').anyOf(taskIds).toArray();
        const notes = await db.notes.where('taskId').anyOf(taskIds).toArray();

        set({
            activePlanId: planId,
            activePlan: plan,
            buckets,
            tasks,
            checklistItems,
            notes,
        });
    },

    createPlan: async (title: string, theme: string) => {
        const newPlan: Plan = {
            id: generateId(),
            title,
            theme,
            createdAt: Date.now(),
        };
        await db.plans.add(newPlan);

        // Create Default Buckets
        const defaultBuckets: Bucket[] = [
            { id: generateId(), planId: newPlan.id, title: 'To Do', orderIndex: 0 },
            { id: generateId(), planId: newPlan.id, title: 'In Progress', orderIndex: 1 },
            { id: generateId(), planId: newPlan.id, title: 'Done', orderIndex: 2 },
        ];
        await db.buckets.bulkAdd(defaultBuckets);

        return newPlan.id;
    },

    updatePlan: async (planId: ID, updates: Partial<Plan>) => {
        await db.plans.update(planId, updates);
        const { activePlan } = get();
        if (activePlan?.id === planId) {
            set({ activePlan: { ...activePlan, ...updates } });
        }
    },

    addBucket: async (bucket: Omit<Bucket, 'id'>) => {
        const newBucket = { ...bucket, id: generateId() };
        await db.buckets.add(newBucket);
        set((state) => ({ buckets: [...state.buckets, newBucket] }));
    },

    updateBucket: async (bucketId: ID, updates: Partial<Bucket>) => {
        await db.buckets.update(bucketId, updates);
        set((state) => ({
            buckets: state.buckets.map(b => b.id === bucketId ? { ...b, ...updates } : b)
        }));
    },

    deleteBucket: async (bucketId: ID) => {
        await db.buckets.delete(bucketId);
        // Also delete tasks in this bucket
        await db.tasks.where('bucketId').equals(bucketId).delete();
        set((state) => ({
            buckets: state.buckets.filter(b => b.id !== bucketId),
            tasks: state.tasks.filter(t => t.bucketId !== bucketId)
        }));
    },

    updateBucketOrder: async (orderedBucketIds: ID[]) => {
        // Optimistic UI update
        const { buckets } = get();
        const newBuckets = [...buckets].sort((a, b) =>
            orderedBucketIds.indexOf(a.id) - orderedBucketIds.indexOf(b.id)
        );

        // Update orderIndex
        const updatedBuckets = newBuckets.map((b, i) => ({ ...b, orderIndex: i }));
        set({ buckets: updatedBuckets });

        // Persist to DB
        await Promise.all(
            updatedBuckets.map(b => db.buckets.update(b.id, { orderIndex: b.orderIndex }))
        );
    },

    addTask: async (task: Omit<Task, 'id'>) => {
        const newTask = { ...task, id: generateId() };
        await db.tasks.add(newTask);
        set((state) => ({ tasks: [...state.tasks, newTask] }));
        return newTask.id;
    },

    updateTask: async (taskId: ID, updates: Partial<Task>) => {
        await db.tasks.update(taskId, updates);
        set((state) => ({
            tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
        }));
    },

    deleteTask: async (taskId: ID) => {
        await db.tasks.delete(taskId);
        await db.checklistItems.where('taskId').equals(taskId).delete();
        await db.notes.where('taskId').equals(taskId).delete();
        set((state) => ({
            tasks: state.tasks.filter(t => t.id !== taskId),
            checklistItems: state.checklistItems.filter(c => c.taskId !== taskId),
            notes: state.notes.filter(n => n.taskId !== taskId)
        }));
    },

    moveTask: async (taskId: ID, newBucketId: ID, newOrderIndex: number) => {
        // Implement standard move between buckets
        // This involves changing bucketId and recalculating orderIndexes
        // For simplicity, we just update the target task here, but robust reordering is needed
        await get().updateTask(taskId, { bucketId: newBucketId, orderIndex: newOrderIndex });
    },

    reorderTasks: async (bucketId: ID, orderedTaskIds: ID[]) => {
        // Reorder tasks within a specific bucket
        const { tasks } = get();
        const tasksInBucket = tasks.filter(t => t.bucketId === bucketId);

        // Assign new orderIndex based on the ordered IDs array
        const updatedTasks = tasksInBucket.map(t => {
            const idx = orderedTaskIds.indexOf(t.id);
            return { ...t, orderIndex: idx >= 0 ? idx : t.orderIndex };
        });

        // Update state
        set((state) => ({
            tasks: state.tasks.map(t => {
                const ut = updatedTasks.find(x => x.id === t.id);
                return ut ? ut : t;
            })
        }));

        // Persist to DB
        await Promise.all(
            updatedTasks.map(t => db.tasks.update(t.id, { orderIndex: t.orderIndex }))
        );
    },

    addChecklistItem: async (taskId: ID, title: string) => {
        const newItem: ChecklistItem = { id: generateId(), taskId, title, isCompleted: false };
        await db.checklistItems.add(newItem);
        set(state => ({ checklistItems: [...state.checklistItems, newItem] }));
    },

    updateChecklistItem: async (itemId: ID, updates: Partial<ChecklistItem>) => {
        await db.checklistItems.update(itemId, updates);
        set(state => ({
            checklistItems: state.checklistItems.map(c => c.id === itemId ? { ...c, ...updates } : c)
        }));
    },

    deleteChecklistItem: async (itemId: ID) => {
        await db.checklistItems.delete(itemId);
        set(state => ({
            checklistItems: state.checklistItems.filter(c => c.id !== itemId)
        }));
    },

    addNote: async (taskId: ID, text: string) => {
        const newNote: Note = { id: generateId(), taskId, text, timestamp: Date.now() };
        await db.notes.add(newNote);
        set(state => ({ notes: [...state.notes, newNote] }));
    },

    deleteNote: async (noteId: ID) => {
        await db.notes.delete(noteId);
        set(state => ({
            notes: state.notes.filter(n => n.id !== noteId)
        }));
    }
}));
