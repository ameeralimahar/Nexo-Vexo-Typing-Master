import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${siteConfig.name} handles your data.`,
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Privacy Policy
        </h1>
        <div className="prose prose-sm mt-6 space-y-4 text-muted-foreground">
          <p>
            {siteConfig.name} is designed to collect the minimum data needed to
            help you practice. In this version, your test results and keystroke
            logs are stored locally in your browser (localStorage) on your own
            device. They are not sent to any server.
          </p>
          <h2 className="font-display text-xl font-semibold text-foreground">
            What we store locally
          </h2>
          <ul className="list-disc pl-6">
            <li>Your typing test results (WPM, accuracy, errors).</li>
            <li>Keystroke timings for the test, used to replay and score it.</li>
            <li>Your theme and accent preferences.</li>
          </ul>
          <h2 className="font-display text-xl font-semibold text-foreground">
            Clearing your data
          </h2>
          <p>
            Because data lives in your browser, you can remove it any time by
            clearing this site’s storage in your browser settings. When accounts
            are introduced, we will provide an in-app account-deletion flow.
          </p>
          <h2 className="font-display text-xl font-semibold text-foreground">
            Contact
          </h2>
          <p>
            Questions about privacy can be sent to the project maintainers via
            the official {siteConfig.shortName} channels.
          </p>
        </div>
      </main>
    </>
  );
}
