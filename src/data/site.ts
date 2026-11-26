// Business facts used across the site and in structured data.
// Source: the contact details published on the previous a4stopeka.com site (read Nov 25, 2026).
// Change them here only — every page, the footer and the JSON-LD read from this file.

export const site = {
  name: 'Assess for Success',
  url: 'https://a4stopeka.com',
  phone: {
    display: '(785) 338-8900',
    href: 'tel:+17853388900',
    schema: '+1-785-338-8900',
  },
  fax: {
    display: '(785) 338-8907',
    schema: '+1-785-338-8907',
  },
  email: 'emailus@a4stopeka.com',
  address: {
    street: '220 SW 33rd St. B101',
    city: 'Topeka',
    region: 'KS',
    postalCode: '66611',
  },
  hours: {
    days: 'Monday–Friday',
    time: '9 AM–6 PM',
    zone: 'Central Time',
    short: 'Mon–Fri, 9 AM–6 PM',
    schema: {
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
  },
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=220%20SW%2033rd%20St%20B101%2C%20Topeka%2C%20KS%2066611',
} as const;

export const fullAddress = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`;
