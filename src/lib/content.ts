export type OnlineMeeting = {
  label: string;
  url?: string;
  copy?: string;
};

export type Speaker = {
  name: string;
  url?: string;
};

type MeetingInput = string | {
  label?: string;
  url?: string;
  copy?: string;
  copyText?: string;
};

export const normalizeOnlineMeetings = (value: unknown): OnlineMeeting[] => {
  const entries = (Array.isArray(value) ? value : value ? [value] : []) as MeetingInput[];
  return entries.map((entry) => {
    if (typeof entry === 'string') return { label: entry, copy: entry };
    return {
      label: entry.label || 'Online meeting',
      url: entry.url,
      copy: entry.copy || entry.copyText
    };
  }).filter((meeting) => meeting.label || meeting.url || meeting.copy);
};

export const normalizeSpeaker = (value: unknown): Speaker | undefined => {
  if (typeof value === 'string') return { name: value };
  if (!value || typeof value !== 'object') return undefined;
  const speaker = value as { name?: unknown; url?: unknown };
  if (typeof speaker.name !== 'string' || !speaker.name) return undefined;
  return {
    name: speaker.name,
    ...(typeof speaker.url === 'string' && speaker.url ? { url: speaker.url } : {})
  };
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[character] || character));

export const renderContact = (value: string) => value
  .split(/(https?:\/\/[^\s]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi)
  .map((part) => {
    if (/^https?:\/\//i.test(part)) return `<a href="${escapeHtml(part)}" target="_blank" rel="noreferrer">${escapeHtml(part)} ↗</a>`;
    if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(part)) return `<a href="mailto:${escapeHtml(part)}">${escapeHtml(part)}</a>`;
    return escapeHtml(part);
  })
  .join('');

export const renderMath = (value: string) => escapeHtml(value)
  .replace(/\$([^$\n]+)\$/g, '\\($1\\)');

export const renderSpeaker = (value: unknown) => {
  const speaker = normalizeSpeaker(value);
  if (!speaker) return '';
  const name = renderMath(speaker.name);
  return speaker.url
    ? `<a class="speaker-link" href="${escapeHtml(speaker.url)}" target="_blank" rel="noreferrer">${name} ↗</a>`
    : name;
};

export const renderMeetingCopy = (value: string) => escapeHtml(value).replace(/\d(?:[\d-]*\d)?(?:\s+\d(?:[\d-]*\d)?)*/g, (match) => {
  const copyValue = match.trim();
  return `<span class="meeting-copy-number" data-copy="${escapeHtml(copyValue)}" tabindex="0" role="button" aria-label="Copy ${escapeHtml(copyValue)}">${match}</span>`;
});

export const renderOnlineMeetings = (value: unknown) => normalizeOnlineMeetings(value).map((meeting) => {
  const label = escapeHtml(meeting.label);
  if (!meeting.url && meeting.copy && meeting.copy === meeting.label) return renderMeetingCopy(meeting.copy);
  const labelMarkup = meeting.url
    ? `<a class="meeting-link" href="${escapeHtml(meeting.url)}" target="_blank" rel="noreferrer">${label} ↗</a>`
    : `<span class="meeting-label">${label}</span>`;
  const copyMarkup = meeting.copy && meeting.copy !== meeting.label ? ` · ${renderMeetingCopy(meeting.copy)}` : '';
  return `${labelMarkup}${copyMarkup}`;
}).join(' · ');
