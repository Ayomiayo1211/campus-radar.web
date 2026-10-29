
import { z } from 'zod';

export const storyImageSchema = z.object({
  url: z.string().url(),
  mediaId: z.string().optional(),
  altText: z.string().max(300).optional(),
  caption: z.string().max(500).optional(),
  photographer: z.string().max(180).optional(),
  displayOrder: z.number().int().min(0).optional().default(0),
});

export const storySchema = z.object({
  title: z.string().min(3).max(180),
  excerpt: z.string().min(10).max(500),
  body: z.string().min(20),
  contentType: z.enum([
    'NEWS',
    'THE_RADAR',
    'FEATURE',
    'OPINION',
  ]),
  origin: z.enum([
    'EDITORIAL',
    'COMMUNITY',
    'ORGANISATION',
    'CONFIDENTIAL',
    'EXTERNAL',
    'ADVERTISER',
  ]),
  commercialStatus: z
    .enum([
      'EDITORIAL',
      'SPONSORED',
      'PROMOTED',
      'ADVERTISEMENT',
    ])
    .default('EDITORIAL'),
  authorName: z.string().min(2).max(120),
  authorId: z.string().optional(),
  featured: z.boolean().optional().default(false),
  coverImage: z.string().url().optional(),
  galleryImages: z.array(storyImageSchema).max(30).optional().default([]),
  tags: z
    .array(z.string().min(1).max(40))
    .max(10)
    .optional()
    .default([]),
  status: z
    .enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'])
    .optional()
    .default('DRAFT'),
});

export const radarSchema = z.object({
  title: z.string().min(3).max(180),
  summary: z.string().min(10).max(500),
  coverImage: z.string().url().optional(),
  kind: z.enum([
    'UPDATE',
    'EVENT',
    'ANNOUNCEMENT',
    'CAMPUS_LIFE',
  ]),
  origin: z.enum([
    'EDITORIAL',
    'COMMUNITY',
    'ORGANISATION',
    'EXTERNAL',
  ]),
  commercialStatus: z
    .enum([
      'EDITORIAL',
      'SPONSORED',
      'PROMOTED',
      'ADVERTISEMENT',
    ])
    .default('EDITORIAL'),
  eventDate: z.coerce.date().optional(),
  location: z.string().max(180).optional(),
  link: z.string().url().optional(),
  status: z
    .enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'])
    .optional()
    .default('DRAFT'),
});

export const opportunitySchema = z.object({
  title: z.string().min(3).max(180),
  organisation: z.string().min(2).max(180),
  type: z.enum([
    'FUNDING',
    'FELLOWSHIP',
    'COMPETITION',
    'SCHOLARSHIP',
    'CALL',
  ]),
  description: z.string().min(10).max(1000),
  deadline: z.coerce.date().optional(),
  applicationUrl: z.string().url().optional(),
  origin: z.enum([
    'EDITORIAL',
    'COMMUNITY',
    'ORGANISATION',
    'EXTERNAL',
  ]),
  commercialStatus: z
    .enum([
      'EDITORIAL',
      'SPONSORED',
      'PROMOTED',
      'ADVERTISEMENT',
    ])
    .default('EDITORIAL'),
  status: z
    .enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'])
    .optional()
    .default('DRAFT'),
});

export const submissionSchema = z.object({
  type: z.enum([
    'NEWS_TIP',
    'RADAR',
    'OPINION',
    'EVENT',
    'OPPORTUNITY',
    'GENERAL',
  ]),
  name: z.string().max(120).optional(),
  contact: z.string().max(180).optional(),
  title: z.string().max(180).optional(),
  body: z.string().min(10).max(10000),
});
