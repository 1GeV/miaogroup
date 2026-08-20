import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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
    meetingUrl: z.string().url().optional(),
    description: z.string().optional(),
    draft: z.boolean().default(false)
  })
});

const seminars = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/seminars' }),
  schema: z.object({
    semester: z.string(),
    current: z.boolean().default(false),
    date: z.coerce.date(),
    speaker: z.string(),
    title: z.string(),
    paper: z.string().optional(),
    references: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
    recordingUrl: z.string().url().optional(),
    draft: z.boolean().default(false)
  })
});

export const collections = { events, seminars };
