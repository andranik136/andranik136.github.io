import Dexie, { type Table } from 'dexie';

export interface Plan {
    id: string;
    title: string;
    theme: string; // color or image URL
    createdAt: number;
}

export interface Bucket {
    id: string;
    planId: string;
    title: string;
    orderIndex: number; // for manual sorting
}

export interface Task {
    id: string;
    planId: string;
    bucketId: string;
    title: string;
    description: string;
    status: 'Not Started' | 'In Progress' | 'Completed';
    priority: 'Urgent' | 'Important' | 'Medium' | 'Low';
    startDate?: number; // timestamp
    dueDate?: number;   // timestamp
    labels: { color: string; text: string }[];
    attachments?: { name: string; dataUrl: string; type: string }[];
    orderIndex: number; // for manual sorting within a bucket
}

export interface ChecklistItem {
    id: string;
    taskId: string;
    title: string;
    isCompleted: boolean;
}

export interface Note {
    id: string;
    taskId: string;
    text: string;
    timestamp: number;
}

export class PlannerDB extends Dexie {
    plans!: Table<Plan>;
    buckets!: Table<Bucket>;
    tasks!: Table<Task>;
    checklistItems!: Table<ChecklistItem>;
    notes!: Table<Note>;

    constructor() {
        super('PlannerDB');
        this.version(1).stores({
            plans: 'id, createdAt',
            buckets: 'id, planId, orderIndex',
            tasks: 'id, planId, bucketId, status, priority, dueDate, orderIndex',
            checklistItems: 'id, taskId',
            notes: 'id, taskId, timestamp'
        });
    }
}

export const db = new PlannerDB();
