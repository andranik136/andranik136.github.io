import { usePlannerStore } from '../../store/usePlannerStore';

import clsx from 'clsx';
import { format } from 'date-fns';

export function GridView() {
    const { tasks, buckets, setSelectedTask } = usePlannerStore();

    const getBucketName = (bucketId: string) => {
        return buckets.find(b => b.id === bucketId)?.title || 'Unknown';
    };

    const priorityColors = {
        Urgent: 'bg-red-100 text-red-700',
        Important: 'bg-orange-100 text-orange-700',
        Medium: 'bg-blue-100 text-blue-700',
        Low: 'bg-gray-100 text-gray-700',
    };

    return (
        <div className="absolute inset-0 overflow-auto p-6 bg-planner-surface/50">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                            <th className="p-4 font-semibold w-1/3">Task Title</th>
                            <th className="p-4 font-semibold">Bucket</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold">Priority</th>
                            <th className="p-4 font-semibold">Due Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tasks.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500 italic">No tasks found. Create some in the Board view!</td>
                            </tr>
                        ) : (
                            tasks.sort((a, b) => a.orderIndex - b.orderIndex).map(task => (
                                <tr
                                    key={task.id}
                                    onClick={() => setSelectedTask(task.id)}
                                    className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                                >
                                    <td className="p-4">
                                        <p className={clsx("text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors", task.status === 'Completed' && "line-through text-gray-500")}>
                                            {task.title}
                                        </p>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        {getBucketName(task.bucketId)}
                                    </td>
                                    <td className="p-4">
                                        <span className={clsx(
                                            "px-2.5 py-1 text-xs font-medium rounded-full",
                                            task.status === 'Completed' ? "bg-green-100 text-green-700" :
                                                task.status === 'In Progress' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                                        )}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", priorityColors[task.priority])}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        {task.dueDate ? format(task.dueDate, 'MMM d, yyyy') : '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
