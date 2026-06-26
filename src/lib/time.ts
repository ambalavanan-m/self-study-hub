import { addMinutes, format, parse, isWithinInterval, isBefore, isAfter } from 'date-fns';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
export type Day = typeof DAYS[number];

export const THEORY_SLOTS = [
    'A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1',
    'A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2'
] as const;

export const LAB_SLOTS = ['Morning', 'Evening'] as const;

export const THEORY_DURATION = 50; // minutes
export const LAB_DURATION = 100; // minutes
export const BREAK_DURATION = 10; // minutes

export function calculateEndTime(startTime: string, type: 'theory' | 'lab'): string {
    if (!startTime) return '';

    const date = parse(startTime, 'HH:mm', new Date());
    const duration = type === 'theory' ? THEORY_DURATION : LAB_DURATION;
    const endDate = addMinutes(date, duration);

    return format(endDate, 'HH:mm');
}

export function validateTimeRange(startTime: string, endTime: string): boolean {
    if (!startTime || !endTime) return false;

    const start = parse(startTime, 'HH:mm', new Date());
    const end = parse(endTime, 'HH:mm', new Date());

    // College hours: 08:00 to 19:30
    const minTime = parse('08:00', 'HH:mm', new Date());
    const maxTime = parse('19:30', 'HH:mm', new Date());

    return (
        start >= minTime &&
        end <= maxTime &&
        start < end
    );
}

export function getCurrentTime(): string {
    return format(new Date(), 'HH:mm');
}

export function isCurrentlyActive(startTime: string, endTime: string): boolean {
    if (!startTime || !endTime) return false;

    const now = new Date();
    const start = parse(startTime, 'HH:mm', new Date());
    const end = parse(endTime, 'HH:mm', new Date());

    return isWithinInterval(now, { start, end });
}

export function getNextClass(classes: Array<{ start_time: string; end_time: string }>): number {
    const now = new Date();

    for (let i = 0; i < classes.length; i++) {
        const startTime = parse(classes[i].start_time, 'HH:mm', new Date());
        if (isAfter(startTime, now)) {
            return i;
        }
    }

    return -1;
}

export function formatTimeTo12Hr(timeStr: string): string {
    if (!timeStr || timeStr === '-' || timeStr === 'Lunch') return timeStr;
    const [hoursStr, minutesStr] = timeStr.split(':');
    const hours = parseInt(hoursStr, 10);
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hr = hours % 12 === 0 ? 12 : hours % 12;
    const hrStr = hr < 10 ? `0${hr}` : hr;
    return `${hrStr}:${minutesStr} ${ampm}`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
    if (!startTime || !endTime) return '';
    return `${formatTimeTo12Hr(startTime)} - ${formatTimeTo12Hr(endTime)}`;
}

export function getMinutesUntil(targetTime: string): number {
    const now = new Date();
    const target = parse(targetTime, 'HH:mm', new Date());

    if (isBefore(target, now)) return 0;

    return Math.floor((target.getTime() - now.getTime()) / 1000 / 60);
}

