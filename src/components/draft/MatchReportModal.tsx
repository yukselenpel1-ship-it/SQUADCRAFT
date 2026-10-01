'use client';

import React, { useState } from 'react';
import { DraftFixture, DraftClub } from '@/lib/draft/types';
import { Player } from '@/types/game';
import { FifaMatchReportModal } from '@/components/match/FifaMatchReportModal';
import { PlayerModal } from '@/components/ui/PlayerModal';

interface MatchReportModalProps {
  fixture: DraftFixture | null;
  clubs: DraftClub[];
  playerPool: Player[];
  isOpen: boolean;
  onClose: () => void;
}

export function MatchReportModal({
  fixture,
  clubs,
  playerPool,
  isOpen,
  onClose,
}: MatchReportModalProps) {
  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);

  if (!isOpen || !fixture || fixture.status !== 'COMPLETED') return null;

  const homeClub = clubs.find((c) => c.id === fixture.homeClubId) || {
    id: fixture.homeClubId,
    name: 'Ev Sahibi',
    code: 'EV',
  };
  const awayClub = clubs.find((c) => c.id === fixture.awayClubId) || {
    id: fixture.awayClubId,
    name: 'Deplasman',
    code: 'DEP',
  };

  const matchResult = fixture.matchResult;

  const homeStats = matchResult?.home?.stats || {
    shots: 12,
    shotsOnTarget: 5,
    xG: 1.45,
    passes: 450,
    completedPasses: 380,
    corners: 5,
    fouls: 9,
    yellowCards: 1,
    redCards: 0,
    saves: 3,
    offsides: 1,
  };

  const awayStats = matchResult?.away?.stats || {
    shots: 9,
    shotsOnTarget: 3,
    xG: 0.95,
    passes: 410,
    completedPasses: 335,
    corners: 3,
    fouls: 11,
    yellowCards: 2,
    redCards: 0,
    saves: 4,
    offsides: 2,
  };

  const totalPasses = (homeStats.passes || 1) + (awayStats.passes || 1);
  const homePossession = Math.round(((homeStats.passes || 1) / totalPasses) * 100);
  const awayPossession = 100 - homePossession;

  const events = matchResult?.events || [];
  const homePlayers = matchResult?.home?.players || [];
  const awayPlayers = matchResult?.away?.players || [];

  const homePlayerList = Array.isArray(homePlayers) ? homePlayers : Object.values(homePlayers as Record<string, any>);
  const awayPlayerList = Array.isArray(awayPlayers) ? awayPlayers : Object.values(awayPlayers as Record<string, any>);
  const allInMatch = [...homePlayerList, ...awayPlayerList];
  const manOfTheMatch = allInMatch.sort((a, b) => (b.matchRating || 0) - (a.matchRating || 0))[0] || null;

  return (
    <>
      <FifaMatchReportModal
        isOpen={isOpen}
        onClose={onClose}
        homeClub={homeClub}
        awayClub={awayClub}
        homeScore={(matchResult as any)?.homeScore ?? (matchResult as any)?.home?.score ?? fixture.homeScore ?? 0}
        awayScore={(matchResult as any)?.awayScore ?? (matchResult as any)?.away?.score ?? fixture.awayScore ?? 0}
        homeStats={homeStats}
        awayStats={awayStats}
        homePossessionPercent={homePossession}
        awayPossessionPercent={awayPossession}
        events={events}
        homePlayers={homePlayers}
        awayPlayers={awayPlayers}
        manOfTheMatch={manOfTheMatch}
        round={fixture.round}
        onInspectPlayer={(p) => setInspectedPlayer(p)}
        onContinue={onClose}
      />

      {inspectedPlayer && (
        <PlayerModal
          player={inspectedPlayer}
          onClose={() => setInspectedPlayer(null)}
        />
      )}
    </>
  );
}
