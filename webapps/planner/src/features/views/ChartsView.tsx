import { useMemo } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ChartsView() {
    const { tasks, buckets } = usePlannerStore();

    const statusData = useMemo(() => {
        const counts = { 'Not Started': 0, 'In Progress': 0, 'Completed': 0 };
        tasks.forEach(t => {
            counts[t.status]++;
        });
        return [
            { name: 'Not Started', value: counts['Not Started'], color: '#9ca3af' }, // gray-400
            { name: 'In Progress', value: counts['In Progress'], color: '#3b82f6' }, // blue-500
            { name: 'Completed', value: counts['Completed'], color: '#22c55e' }, // green-500
        ].filter(d => d.value > 0);
    }, [tasks]);

    const bucketData = useMemo(() => {
        return buckets.map(bucket => {
            const bucketTasks = tasks.filter(t => t.bucketId === bucket.id);
            return {
                name: bucket.title,
                NotStarted: bucketTasks.filter(t => t.status === 'Not Started').length,
                InProgress: bucketTasks.filter(t => t.status === 'In Progress').length,
                Completed: bucketTasks.filter(t => t.status === 'Completed').length,
            }
        });
    }, [tasks, buckets]);

    return (
        <div className="absolute inset-0 overflow-auto p-6 bg-planner-surface/50">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <StatCard title="Total Tasks" value={tasks.length} />
                    <StatCard title="Not Started" value={tasks.filter(t => t.status === 'Not Started').length} color="text-gray-500" />
                    <StatCard title="In Progress" value={tasks.filter(t => t.status === 'In Progress').length} color="text-blue-500" />
                    <StatCard title="Completed" value={tasks.filter(t => t.status === 'Completed').length} color="text-green-500" />
                </div>

                <div className="grid grid-cols-2 gap-6">

                    {/* Status Donut Chart */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Overview</h3>
                        <div className="flex-1 min-h-0">
                            {statusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">No tasks to display</div>
                            )}
                        </div>
                    </div>

                    {/* Buckets Bar Chart */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tasks by Bucket</h3>
                        <div className="flex-1 min-h-0">
                            {bucketData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={bucketData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: 'transparent' }} />
                                        <Legend />
                                        <Bar dataKey="NotStarted" name="Not Started" stackId="a" fill="#9ca3af" radius={[0, 0, 4, 4]} />
                                        <Bar dataKey="InProgress" name="In Progress" stackId="a" fill="#3b82f6" />
                                        <Bar dataKey="Completed" name="Completed" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">No buckets to display</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, color = "text-gray-900" }: { title: string, value: number, color?: string }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h4 className="text-sm font-medium text-gray-500 mb-1">{title}</h4>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
    );
}
