export type ScheduleInput = {
  date: Date;
  time?: string;
  endDate?: Date;
};

export type Schedule = {
  start: Date;
  end?: Date;
};

const dateParts = (date: Date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).formatToParts(date).reduce((result, part) => ({ ...result, [part.type]: part.value }), {} as Record<string, string>);

const atShanghaiTime = (date: Date, hour = 0, minute = 0) => {
  const parts = dateParts(date);
  return new Date(`${parts.year}-${parts.month}-${parts.day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+08:00`);
};

export const parseTime = (value?: string) => {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})(?:\s*[-–—]\s*(\d{1,2}):(\d{2}))?$/);
  if (!match) return null;
  const values = [Number(match[1]), Number(match[2]), ...(match[3] ? [Number(match[3]), Number(match[4])] : [])];
  if (values[0] > 23 || values[1] > 59 || (values.length === 4 && (values[2] > 23 || values[3] > 59))) return null;
  return { startHour: values[0], startMinute: values[1], endHour: values[2], endMinute: values[3] };
};

export const scheduleFor = ({ date, time, endDate }: ScheduleInput): Schedule => {
  const parsed = parseTime(time);
  if (!parsed) return { start: atShanghaiTime(date) };

  const start = atShanghaiTime(date, parsed.startHour, parsed.startMinute);
  if (parsed.endHour === undefined || parsed.endMinute === undefined) return { start };

  let end = atShanghaiTime(endDate ?? date, parsed.endHour, parsed.endMinute);
  if (!endDate && end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
};

export const isCurrentOrUpcoming = (schedule: Schedule, now = new Date()) =>
  schedule.start >= now || Boolean(schedule.end && schedule.end > now);
