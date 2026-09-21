import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { parseTime, scheduleFor } from '../lib/schedule';
import { foldIcalLine, subscriptionWindow } from '../lib/ical';

export const prerender = true;

type CalendarEvent = {
  id: string;
  title: string;
  type: 'group-meeting' | 'seminar' | 'lecture' | 'defense' | 'other';
  date: Date;
  endDate?: Date;
  time?: string;
  location?: string;
  description?: string;
};

const labels = {
  'group-meeting': 'Group meeting',
  seminar: 'Seminar',
  lecture: 'Lecture',
  defense: 'Thesis defense',
  other: 'Other'
};

const shanghaiParts = (date: Date, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  ...options
}).formatToParts(date).reduce((parts, part) => ({ ...parts, [part.type]: part.value }), {} as Record<string, string>);

const icalDate = (date: Date) => {
  const parts = shanghaiParts(date, { year: 'numeric', month: '2-digit', day: '2-digit' });
  return `${parts.year}${parts.month}${parts.day}`;
};

const icalUtcDateTime = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
const icalEscape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([;,])/g, '\\$1');

const serializeEvent = (event: CalendarEvent, timestamp: string) => {
  const parsedTime = parseTime(event.time);
  const schedule = scheduleFor(event);
  const lines = [
    'BEGIN:VEVENT',
    `UID:${encodeURIComponent(event.id)}@miaogroup`,
    `DTSTAMP:${timestamp}`
  ];

  if (!parsedTime) {
    const configuredEnd = event.endDate ? scheduleFor({ date: event.endDate }).start : schedule.start;
    const end = configuredEnd >= schedule.start ? configuredEnd : schedule.start;
    lines.push(`DTSTART;VALUE=DATE:${icalDate(schedule.start)}`);
    lines.push(`DTEND;VALUE=DATE:${icalDate(addDays(end, 1))}`);
  } else {
    lines.push(`DTSTART;TZID=Asia/Shanghai:${icalDate(schedule.start)}T${String(parsedTime.startHour).padStart(2, '0')}${String(parsedTime.startMinute).padStart(2, '0')}00`);
    if (schedule.end && parsedTime.endHour !== undefined && parsedTime.endMinute !== undefined) {
      lines.push(`DTEND;TZID=Asia/Shanghai:${icalDate(schedule.end)}T${String(parsedTime.endHour).padStart(2, '0')}${String(parsedTime.endMinute).padStart(2, '0')}00`);
    }
  }

  lines.push(`SUMMARY:${icalEscape(event.title)}`);
  if (event.description) lines.push(`DESCRIPTION:${icalEscape(event.description)}`);
  if (event.location) lines.push(`LOCATION:${icalEscape(event.location)}`);
  lines.push(`CATEGORIES:${icalEscape(labels[event.type])}`);
  lines.push('END:VEVENT');
  return lines.map(foldIcalLine).join('\r\n');
};

export const GET: APIRoute = async () => {
  const [eventEntries, seminarEntries] = await Promise.all([
    getCollection('events', ({ data }) => !data.draft),
    getCollection('seminars', ({ data }) => !data.draft)
  ]);
  const events: CalendarEvent[] = [
    ...eventEntries.map(({ id, data }) => ({
      id,
      title: data.title,
      type: data.type,
      date: data.date,
      endDate: data.endDate,
      time: data.time,
      location: data.location,
      description: data.description
    })),
    ...seminarEntries.map(({ id, data }) => ({
      id: `seminar-${id}`,
      title: data.title,
      type: 'seminar' as const,
      date: data.date,
      time: data.time,
      location: data.location,
      description: data.description || data.paper
    }))
  ].sort((a, b) => scheduleFor(a).start.valueOf() - scheduleFor(b).start.valueOf());
  const { start: rangeStart, end: rangeEnd } = subscriptionWindow();
  const subscriptionEvents = events.filter((event) => {
    const start = scheduleFor(event).start;
    return start >= rangeStart && start < rangeEnd;
  });
  const timestamp = icalUtcDateTime(new Date());
  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Miao Group//Academic Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Miao Group Academic Calendar',
    'X-WR-TIMEZONE:Asia/Shanghai',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Shanghai',
    'X-LIC-LOCATION:Asia/Shanghai',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0800',
    'TZOFFSETTO:+0800',
    'TZNAME:CST',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
    ...subscriptionEvents.map((event) => serializeEvent(event, timestamp)),
    'END:VCALENDAR'
  ].join('\r\n');

  return new Response(`${calendar}\r\n`, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' }
  });
};
