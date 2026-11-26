export interface NavLink {
  href: string;
  label: string;
  children?: NavLink[];
}

export const bhcLinks: NavLink[] = [
  { href: '/behavioral-health/assessments/', label: 'Assessments' },
  { href: '/behavioral-health/treatment/', label: 'Treatment' },
  { href: '/behavioral-health/education/', label: 'Education' },
];

export const mainNav: NavLink[] = [
  { href: '/behavioral-health/', label: 'Behavioral Health Care', children: bhcLinks },
  { href: '/sports/', label: 'A4S Sports' },
  { href: '/referrals/', label: 'Courts & Referrals' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
];
