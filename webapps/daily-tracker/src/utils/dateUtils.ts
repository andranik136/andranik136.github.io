/**
 * Formats a Date object into YYYY-MM-DD format using local time zone.
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses a YYYY-MM-DD string into a local Date object.
 */
export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Returns formatted readable string like "Saturday, Sep 26, 2026"
 */
export function formatFullDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Returns month name and year like "September 2026"
 */
export function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
}

export interface CalendarDay {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  dateObj: Date;
}

/**
 * Generates a 42-day (6 weeks) calendar grid for a given year and month (0-indexed month).
 */
export function getCalendarGrid(year: number, month: number): CalendarDay[] {
  const todayKey = formatDateKey(new Date());
  const firstDayOfMonth = new Date(year, month, 1);
  
  // Get day of week (0 = Sunday, 1 = Monday, ... 6 = Saturday)
  let startOffset = firstDayOfMonth.getDay();

  const startDate = new Date(year, month, 1 - startOffset);
  const grid: CalendarDay[] = [];

  for (let i = 0; i < 42; i++) {
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    const dateKey = formatDateKey(current);
    const dayOfWeek = current.getDay();

    grid.push({
      dateKey,
      dayNumber: current.getDate(),
      isCurrentMonth: current.getMonth() === month,
      isToday: dateKey === todayKey,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      dateObj: current
    });
  }

  return grid;
}

/**
 * Checks if a dateKey falls in the future relative to today.
 */
export function isFutureDate(dateKey: string): boolean {
  const todayKey = formatDateKey(new Date());
  return dateKey > todayKey;
}

/**
 * Checks if a dateKey is today.
 */
export function isToday(dateKey: string): boolean {
  return dateKey === formatDateKey(new Date());
}
