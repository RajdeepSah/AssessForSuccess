// schema.org structured data built only from confirmed facts in site.ts.
import { site } from './site';

export const ORG_ID = `${site.url}/#organization`;

export function organization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    '@id': ORG_ID,
    name: site.name,
    url: `${site.url}/`,
    logo: `${site.url}/icon-512.png`,
    image: `${site.url}/og/default.png`,
    telephone: site.phone.schema,
    faxNumber: site.fax.schema,
    email: site.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: 'US',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: site.hours.schema.dayOfWeek,
        opens: site.hours.schema.opens,
        closes: site.hours.schema.closes,
      },
    ],
  };
}

export function service(name: string, description: string, path: string, audience = 'Adults and youth') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: `${site.url}${path}`,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'City', name: 'Topeka, Kansas' },
    audience: { '@type': 'Audience', audienceType: audience },
  };
}

export function faqPage(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
