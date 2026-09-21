import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { scheduleFor } from '../lib/schedule';
import { serializeCalendar, subscriptionWindow } from '../lib/ical';

export const prerender = true;

export const GET: APIRoute = async ({ site, url }) => {
  const [eventEntries, seminarEntries] = await Promise.all([
    getCollection('events', ({ data }) => !data.draft),
    getCollection('seminars', ({ data }) => !data.draft)
  ]);
  const events = [
    ...eventEntries.map(({ id, data }) => ({ id, ...data })),
    ...seminarEntries.map(({ id, data }) => ({
      ...data,
      id: `seminar-${id}`,
      type: 'seminar' as const,
      description: data.description || data.paper
    }))
  ].sort((a, b) => scheduleFor(a).start.valueOf() - scheduleFor(b).start.valueOf());
  const { start: rangeStart, end: rangeEnd } = subscriptionWindow();
  const subscriptionEvents = events.filter((event) => {
    const start = scheduleFor(event).start;
    return start >= rangeStart && start < rangeEnd;
  });
  const calendarUrl = new URL(`${import.meta.env.BASE_URL}calendar/`, site ?? url.origin).href;
  return new Response(serializeCalendar(subscriptionEvents, calendarUrl), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' }
  });
};
