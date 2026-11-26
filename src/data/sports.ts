// A4S Sports content. Sports listed are the ones the client named as possible through the year.
// Photos are generated placeholders (see src/assets/sports/README.md) until real team photos exist.
import basketball from '../assets/sports/basketball.jpg';
import flagFootball from '../assets/sports/flag-football.jpg';
import soccer from '../assets/sports/soccer.jpg';
import volleyball from '../assets/sports/volleyball.jpg';

export const sports = [
  { id: 'flag-football', name: 'Flag football', image: flagFootball },
  { id: 'basketball', name: 'Basketball', image: basketball },
  { id: 'volleyball', name: 'Volleyball', image: volleyball },
  { id: 'soccer', name: 'Soccer', image: soccer },
] as const;

export const programs = [
  {
    id: 'team',
    anchor: 'teams',
    title: 'Teams',
    icon: 'Users',
    summary: 'Sign your child up for a team.',
    cta: 'Register for a team',
  },
  {
    id: 'training',
    anchor: 'training',
    title: 'One-on-one training',
    icon: 'Target',
    summary: 'Register your child for one-on-one training to work on a specific skill.',
    cta: 'Register for training',
  },
  {
    id: 'mentoring',
    anchor: 'mentoring',
    title: 'Mentoring',
    icon: 'Handshake',
    summary: 'Learn about mentoring for young people.',
    cta: 'Ask about mentoring',
  },
] as const;

export interface Season {
  sport: string;
  label: string; // e.g. "Spring season" — only add once the client confirms it
  details?: string;
}

/**
 * Upcoming seasons or sessions. Keep this empty until the client confirms real dates:
 * the "Coming up" section on /sports/ only renders when this list has entries.
 */
export const seasons: Season[] = [];
