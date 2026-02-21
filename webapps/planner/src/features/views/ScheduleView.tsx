import { useMemo } from 'react';
import { Calendar, dateFnsLocalizer, type Event as CalendarEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { usePlannerStore } from '../../store/usePlannerStore';
// We'll render here if we want or let App.tsx handle it since it's global

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

export function ScheduleView() {
    const { tasks, setSelectedTask } = usePlannerStore();

    const events = useMemo(() => {
        return tasks
            .filter(task => task.dueDate || task.startDate) // Only map tasks that have a date
            .map(task => {
                const start = task.startDate ? new Date(task.startDate) : new Date(task.dueDate!);
                const end = task.dueDate ? new Date(task.dueDate) : new Date(task.startDate!);

                return {
                    id: task.id,
                    title: task.title,
                    start,
                    end,
                    resource: task,
                };
            });
    }, [tasks]);

    const handleSelectEvent = (event: CalendarEvent) => {
        // We added resource mapping which contains the task
        const task = (event as any).resource;
        if (task) {
            setSelectedTask(task.id as string);
        }
    };

    return (
        <div className="absolute inset-0 overflow-auto p-6 bg-planner-surface/50 flex flex-col">
            <div className="bg-white border text-gray-800 border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1 p-4 custom-calendar-wrapper">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    views={['month', 'week', 'agenda']}
                    defaultView="month"
                    onSelectEvent={handleSelectEvent}
                    style={{ height: '100%' }}
                    eventPropGetter={(event) => {
                        const isCompleted = event.resource.status === 'Completed';
                        return {
                            className: isCompleted ? 'opacity-60 bg-gray-500 line-through' : 'bg-blue-600',
                        };
                    }}
                />
            </div>
        </div>
    );
}
