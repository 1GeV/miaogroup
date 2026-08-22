import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const onlineMeetingEntry = z.union([
  z.string(),
  z.object({
    label: z.string().optional(),
    url: z.string().url().optional(),
    copy: z.string().optional(),
    copyText: z.string().optional()
  })
]);

const onlineMeeting = z.union([
  onlineMeetingEntry,
  z.array(onlineMeetingEntry)
]).optional();

const events = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    type: z.enum(['group-meeting', 'lecture', 'seminar', 'defense', 'other']),
    date: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    time: z.string().optional(),
    location: z.string().optional(),
    speaker: z.string().optional(),
    onlineMeeting,
    references: z.array(z.object({ label: z.string(), url: z.string().url().optional() })).default([]),
    description: z.string().optional(),
    public: z.boolean().default(false),
    draft: z.boolean().default(false)
  })
});

const seminars = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/seminars' }),
  schema: z.object({
    series: z.string().default('Strings, Fields and Holography Seminar'),
    semester: z.string(),
    date: z.coerce.date(),
    time: z.string().optional(),
    location: z.string().optional(),
    speaker: z.string(),
    title: z.string(),
    paper: z.string().optional(),
    description: z.string().optional(),
    references: z.array(z.object({ label: z.string(), url: z.string().url().optional() })).default([]),
    onlineMeeting,
    recordingUrl: z.string().url().optional(),
    draft: z.boolean().default(false)
  })
});

const seminarTerms = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/seminar-terms' }),
  schema: z.object({
    series: z.string(),
    semester: z.string(),
    archiveAfter: z.coerce.date()
  })
});

const seminarSeries = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/seminar-series' }),
  schema: z.object({
    series: z.string(),
    description: z.string().optional(),
    contact: z.string().optional(),
    links: z.array(z.object({ label: z.string(), url: z.string().url().optional() })).default([]),
    draft: z.boolean().default(false)
  })
});

export const collections = { events, seminars, seminarTerms, seminarSeries };
