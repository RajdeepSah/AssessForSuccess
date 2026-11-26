// Behavioral Health Care services, in the client's own terms (client conversation + whiteboard).

export const bhcServices = [
  {
    slug: 'assessments',
    title: 'Assessments',
    href: '/behavioral-health/assessments/',
    icon: 'ClipboardCheck',
    summary:
      'Mental health and substance use assessments, including court-ordered assessments for DUI, drug possession, and criminal damage cases.',
  },
  {
    slug: 'treatment',
    title: 'Treatment',
    href: '/behavioral-health/treatment/',
    icon: 'MessagesSquare',
    summary:
      'Individual and group therapy for substance use disorders, with levels of care explained in plain language.',
  },
  {
    slug: 'education',
    title: 'Education',
    href: '/behavioral-health/education/',
    icon: 'BookOpen',
    summary: 'Alcohol and drug education, and anger education.',
  },
] as const;
