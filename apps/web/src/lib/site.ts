/** Central site/brand config. Base URL comes from the environment. */
export const siteConfig = {
  name: 'NEXO VEXO Typing Master',
  shortName: 'NEXO VEXO',
  description:
    'Exam-accurate typing practice for Pakistan government and private typing tests — PPSC, FPSC, NTS and more. Simulate real exams, track WPM and accuracy, and fix your weak spots.',
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000',
  locale: 'en',
  twitter: '@nexovexo',
  keywords: [
    'typing test',
    'typing practice',
    'PPSC typing test',
    'FPSC typing test',
    'NTS typing test',
    'WPM test',
    'data entry test',
    'Pakistan government jobs typing',
  ],
} as const;

export type SiteConfig = typeof siteConfig;
