import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPresetById, PRESET_PROFILES } from '@nexovexo/typing-engine';
import { SimulationClient } from './simulation-client';

export function generateStaticParams() {
  return PRESET_PROFILES.map((p) => ({ profileId: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ profileId: string }>;
}): Promise<Metadata> {
  const { profileId } = await params;
  const profile = getPresetById(profileId);
  if (!profile) return { title: 'Exam Simulation' };
  return {
    title: `${profile.service} Simulation`,
    description: `Full-screen typing simulation for ${profile.name}.`,
  };
}

export default async function SimulationRunPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const profile = getPresetById(profileId);
  if (!profile) notFound();
  return <SimulationClient profile={profile} />;
}
