import { SiteHeader } from '@/components/site-header';
import { ResultClient } from './result-client';

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <ResultClient id={id} />
      </main>
    </>
  );
}
