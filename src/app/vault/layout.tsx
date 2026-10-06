import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Vault Escape Rooms — Edinburgh Old Town',
  description: 'Four immersive escape rooms in Edinburgh’s Old Town. 60–90 minutes. 2–6 players. Rated #1 escape room in Edinburgh on TripAdvisor.',
  keywords: ['escape room', 'Edinburgh', 'The Vault', 'Old Town', 'team building', 'puzzle room'],
};

export default function VaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="vault-escape-rooms-root">
      {children}
    </div>
  );
}
