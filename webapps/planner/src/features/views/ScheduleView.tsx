import { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, type Event as CalendarEvent, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { usePlannerStore } from '../../store/usePlannerStore';

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
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<View>('month');

    const events = useMemo(() => {
        return tasks
            .filter(task => task.dueDate || task.startDate)
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
                    view={currentView}
                    date={currentDate}
                    onView={(view) => setCurrentView(view)}
                    onNavigate={(date) => setCurrentDate(date)}
                    onSelectEvent={handleSelectEvent}
                    style={{ height: '100%' }}
                    messages={{
                        previous: <span className="flex items-center justify-center"><ChevronLeft size={18} /></span> as any,
                        next: <span className="flex items-center justify-center"><ChevronRight size={18} /></span> as any,
                    }}
                    eventPropGetter={(event: any) => {
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
