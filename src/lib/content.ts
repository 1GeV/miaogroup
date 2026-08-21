export type OnlineMeeting = {
  label: string;
  url?: string;
  copy?: string;
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

export const renderMeetingCopy = (value: string) => escapeHtml(value).replace(/\d(?:[\d-]*\d)?(?:\s+\d(?:[\d-]*\d)?)*/g, (match) => {
  const copyValue = match.trim();
  return `<span class="meeting-copy-number" data-copy="${escapeHtml(copyValue)}" tabindex="0" role="button" aria-label="Copy ${escapeHtml(copyValue)}">${match}</span>`;
});
