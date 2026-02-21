import { db } from '../db/db';

export async function exportData() {
    const plans = await db.plans.toArray();
    const buckets = await db.buckets.toArray();
    const tasks = await db.tasks.toArray();
    const checklistItems = await db.checklistItems.toArray();
    const notes = await db.notes.toArray();

    const data = { plans, buckets, tasks, checklistItems, notes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function importData(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const result = e.target?.result as string;
                if (!result) throw new Error("File empty");

                const data = JSON.parse(result);
                if (!data.plans || !data.buckets || !data.tasks) {
                    throw new Error("Invalid backup format");
                }

                // This transaction replaces all existing data in Dexie with the imported DB.
                await db.transaction('rw', [db.plans, db.buckets, db.tasks, db.checklistItems, db.notes], async () => {
                    await db.plans.clear();
                    await db.buckets.clear();
                    await db.tasks.clear();
                    await db.checklistItems.clear();
                    await db.notes.clear();

                    if (data.plans.length > 0) await db.plans.bulkAdd(data.plans);
                    if (data.buckets.length > 0) await db.buckets.bulkAdd(data.buckets);
                    if (data.tasks.length > 0) await db.tasks.bulkAdd(data.tasks);
                    if (data.checklistItems && data.checklistItems.length > 0) await db.checklistItems.bulkAdd(data.checklistItems);
                    if (data.notes && data.notes.length > 0) await db.notes.bulkAdd(data.notes);
                });

                resolve();
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error("File read error"));
        reader.readAsText(file);
    });
}
