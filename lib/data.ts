export type ContentType = 'News' | 'The Radar' | 'Features' | 'Opinion' | 'Opportunity';
export type Origin = 'Editorial' | 'Community' | 'Organisation' | 'Confidential' | 'External' | 'Advertiser';
export type CommercialStatus = 'Editorial' | 'Sponsored' | 'Promoted' | 'Advertisement';

export type Story = {
  id: string;
  title: string;
  excerpt: string;
  category: ContentType;
  author: string;
  date: string;
  readTime: string;
  origin: Origin;
  commercialStatus: CommercialStatus;
  image?: string;
  featured?: boolean;
};

export type Opportunity = {
  id: string;
  title: string;
  organisation: string;
  type: 'Funding' | 'Fellowship' | 'Competition' | 'Scholarship' | 'Call';
  deadline: string;
  description: string;
  status: CommercialStatus;
};

export type RadarItem = {
  id: string;
  title: string;
  summary: string;
  kind: 'Update' | 'Event' | 'Announcement' | 'Campus Life';
  date: string;
  source: Origin;
  status: CommercialStatus;
};

export const stories: Story[] = [
  {
    id: '1',
    title: 'FUNAAB students respond to the latest changes around campus',
    excerpt: 'A closer look at what students need to know and what comes next.',
    category: 'News',
    author: 'Campus Radar Desk',
    date: 'Oct 3, 2026',
    readTime: '4 min read',
    origin: 'Editorial',
    commercialStatus: 'Editorial',
    featured: true,
  },
  {
    id: '2',
    title: 'Five things happening around FUNAAB this week',
    excerpt: 'The quick campus brief: events, updates and useful information.',
    category: 'The Radar',
    author: 'Radar Desk',
    date: 'Oct 3, 2026',
    readTime: '2 min read',
    origin: 'Community',
    commercialStatus: 'Editorial',
  },
  {
    id: '3',
    title: 'Inside the students building new communities on campus',
    excerpt: 'Profiles and conversations with students shaping campus life.',
    category: 'Features',
    author: 'Campus Radar',
    date: 'Oct 2, 2026',
    readTime: '7 min read',
    origin: 'Editorial',
    commercialStatus: 'Editorial',
  },
  {
    id: '4',
    title: 'What students should expect from the new academic session',
    excerpt: 'An opinion piece examining the questions students are asking.',
    category: 'Opinion',
    author: 'Contributor',
    date: 'Oct 1, 2026',
    readTime: '5 min read',
    origin: 'Community',
    commercialStatus: 'Editorial',
  },
  {
    id: '5',
    title: 'Student innovators open applications for a new campus programme',
    excerpt: 'A new opportunity for students working on practical ideas and projects.',
    category: 'News',
    author: 'Campus Radar Desk',
    date: 'Sep 30, 2026',
    readTime: '3 min read',
    origin: 'Organisation',
    commercialStatus: 'Editorial',
  },
];

export const radarItems: RadarItem[] = [
  { id: 'r1', title: 'Campus Creatives Meetup is set for Wednesday', summary: 'A student creative community is bringing designers, writers and visual storytellers together.', kind: 'Event', date: 'Oct 3', source: 'Organisation', status: 'Editorial' },
  { id: 'r2', title: 'Student Tech Community announces its next session', summary: 'The next community session will focus on practical technology and career conversations.', kind: 'Event', date: 'Oct 3', source: 'Organisation', status: 'Editorial' },
  { id: 'r3', title: 'Open Mic & Spoken Word Night returns this month', summary: 'Students can expect an evening of spoken word, music and performance.', kind: 'Campus Life', date: 'Oct 2', source: 'Community', status: 'Editorial' },
  { id: 'r4', title: 'New student opportunity deadline approaches', summary: 'Students interested in the current funding call have until October 18 to apply.', kind: 'Announcement', date: 'Oct 2', source: 'External', status: 'Editorial' },
];

export const opportunities: Opportunity[] = [
  { id: 'o1', title: 'Student innovation funding call', organisation: 'Campus Innovation Hub', deadline: 'Oct 18, 2026', type: 'Funding', description: 'Funding support for student-led ideas and practical projects.', status: 'Editorial' },
  { id: 'o2', title: 'Campus leadership fellowship', organisation: 'Student Leadership Network', deadline: 'Oct 24, 2026', type: 'Fellowship', description: 'A leadership development programme for students interested in community impact.', status: 'Editorial' },
  { id: 'o3', title: 'Creative writing competition', organisation: 'Campus Arts Collective', deadline: 'Nov 2, 2026', type: 'Competition', description: 'A writing competition open to students across campus.', status: 'Promoted' },
];
