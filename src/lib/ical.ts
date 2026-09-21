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
