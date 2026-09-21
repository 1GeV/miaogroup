import { normalizeOnlineMeetings, normalizeSpeaker } from './content';
import type { OnlineMeeting } from './content';
import { parseTime, scheduleFor } from './schedule';

export type CalendarEvent = {
  id: string;
  title: string;
  type: 'group-meeting' | 'seminar' | 'lecture' | 'defense' | 'other';
  date: Date | string;
  endDate?: Date | string;
  time?: string;
  location?: string;
  description?: string;
  speaker?: unknown;
  series?: string;
  semester?: string;
  paper?: string;
  contact?: string;
  onlineMeeting?: unknown;
  onlineMeetings?: OnlineMeeting[];
  references?: { label: string; url?: string }[];
  recordingUrl?: string;
};

const labels = {
  'group-meeting': 'Group meeting', seminar: 'Seminar', lecture: 'Lecture',
  defense: 'Thesis defense', other: 'Other'
};

// Street address: https://spa.sysu.edu.cn/en/teacher/2622 (school footer).
// Keep the authored room/building text, and expand only the calendar location.
export const calendarLocation = (location?: string) => {
  if (!location || !/\bHanlin\b/i.test(location) || /\bDaxue\s+Road\b/i.test(location)) return location;
  return `${location}, Sun Yat-sen University (Zhuhai Campus), No. 2 Daxue Road, Tangjiawan, Xiangzhou District, Zhuhai, Guangdong, China`;
};

export const calendarEventUrl = (event: CalendarEvent, calendarUrl: string) => {
  const url = new URL(calendarUrl);
  url.searchParams.set('event', event.id);
  return url.href;
};

export const calendarDescription = (event: CalendarEvent, calendarUrl: string) => {
  const sections: string[] = [];
  const meetings = event.onlineMeetings ?? normalizeOnlineMeetings(event.onlineMeeting);
  for (const meeting of meetings) {
    // Legacy strings are normalized to both label and copy; show their text once.
    sections.push([
      `Online meeting: ${meeting.label}`,
      meeting.url,
      meeting.copy !== meeting.label ? meeting.copy : undefined
    ].filter(Boolean).join('\n'));
  }
  const speaker = normalizeSpeaker(event.speaker);
  const details = [
    speaker && `Speaker: ${speaker.name}${speaker.url ? ` (${speaker.url})` : ''}`,
    event.series && `Series: ${event.series}`,
    event.semester && `Term: ${event.semester}`
  ].filter(Boolean).join('\n');
  if (details) sections.push(details);
  if (event.description) sections.push(event.description);
  if (event.paper && event.paper !== event.description) sections.push(`Reading: ${event.paper}`);
  const references = [...(event.references ?? [])];
  if (event.recordingUrl && !references.some(ref => ref.url === event.recordingUrl)) {
    references.push({ label: 'Recording', url: event.recordingUrl });
  }
  const referenceLines = [...new Set(references.map(ref => ref.url ? `${ref.label}: ${ref.url}` : ref.label))];
  if (referenceLines.length) sections.push(`References:\n${referenceLines.join('\n')}`);
  if (event.contact) sections.push(`Contact: ${event.contact}`);
  sections.push(`Event details: ${calendarEventUrl(event, calendarUrl)}`);
  return sections.join('\n\n');
};

const icalEscape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/([;,])/g, '\\$1');
const icalUtcDateTime = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const icalDate = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)!.value).join('');
};

const serializeEvent = (event: CalendarEvent, calendarUrl: string, timestamp: string) => {
  const parsed = parseTime(event.time);
  const schedule = scheduleFor({
    date: new Date(event.date), time: event.time,
    endDate: event.endDate ? new Date(event.endDate) : undefined
  });
  const lines = ['BEGIN:VEVENT', `UID:${encodeURIComponent(event.id)}@miaogroup`, `DTSTAMP:${timestamp}`];
  if (!parsed) {
    const configuredEnd = event.endDate ? scheduleFor({ date: new Date(event.endDate) }).start : schedule.start;
    const end = configuredEnd >= schedule.start ? configuredEnd : schedule.start;
    lines.push(`DTSTART;VALUE=DATE:${icalDate(schedule.start)}`);
    lines.push(`DTEND;VALUE=DATE:${icalDate(new Date(end.valueOf() + 86400000))}`);
  } else {
    const localTime = (date: Date, hour: number, minute: number) => `${icalDate(date)}T${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}00`;
    lines.push(`DTSTART;TZID=Asia/Shanghai:${localTime(schedule.start, parsed.startHour, parsed.startMinute)}`);
    if (schedule.end && parsed.endHour !== undefined && parsed.endMinute !== undefined) {
      lines.push(`DTEND;TZID=Asia/Shanghai:${localTime(schedule.end, parsed.endHour, parsed.endMinute)}`);
    }
  }
  lines.push(`SUMMARY:${icalEscape(event.title)}`);
  lines.push(`DESCRIPTION:${icalEscape(calendarDescription(event, calendarUrl))}`);
  const location = calendarLocation(event.location);
  if (location) lines.push(`LOCATION:${icalEscape(location)}`);
  lines.push(`URL:${calendarEventUrl(event, calendarUrl)}`);
  lines.push(`CATEGORIES:${labels[event.type]}`);
  lines.push('END:VEVENT');
  return lines.map(foldIcalLine).join('\r\n');
};

// Shared by the subscription feed and the filtered, manual download.
export const serializeCalendar = (events: CalendarEvent[], calendarUrl: string, now = new Date()) => {
  const timestamp = icalUtcDateTime(now);
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Miao Group//Academic Calendar//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Miao Group Academic Calendar',
    'X-WR-TIMEZONE:Asia/Shanghai', 'BEGIN:VTIMEZONE', 'TZID:Asia/Shanghai',
    'X-LIC-LOCATION:Asia/Shanghai', 'BEGIN:STANDARD', 'TZOFFSETFROM:+0800',
    'TZOFFSETTO:+0800', 'TZNAME:CST', 'DTSTART:19700101T000000',
    'END:STANDARD', 'END:VTIMEZONE',
    ...events.map(event => serializeEvent(event, calendarUrl, timestamp)),
    'END:VCALENDAR', ''
  ].join('\r\n');
};

// RFC 5545 limits each physical line to 75 octets, including continuation spaces.
export const foldIcalLine = (line: string) => {
  const encoder = new TextEncoder();
  const chunks: string[] = [];
  let current = '';
  let bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > 75) {
      chunks.push(current);
      current = ' ';
      bytes = 1;
    }
    current += character;
    bytes += size;
  }
  chunks.push(current);
  return chunks.join('\r\n');
};

export const subscriptionWindow = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const part = (type: string) => Number(parts.find((value) => value.type === type)?.value);
  const year = part('year');
  const month = part('month');
  const day = part('day');
  const start = new Date(Date.UTC(year, month - 1, day, -8));
  const lastDay = new Date(Date.UTC(year + 1, month, 0)).getUTCDate();
  const end = new Date(Date.UTC(year + 1, month - 1, Math.min(day, lastDay), -8));
  return { start, end };
};
