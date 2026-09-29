import {
  Club,
  Player,
  LeagueStanding,
  Fixture,
  InboxMessage,
} from '@/types/game';
import { ClubCareerHistory } from './types';
import { generateSeasonFixtures } from './fixtureGenerator';

export interface SeasonEndSummary {
  seasonYear: string;
  championClubName: string;
  userClubRank: number;
  userClubPoints: number;
  topScorerName: string;
  topScorerGoals: number;
  continentalClubs: string[];
  relegatedClubs: string[];
}

export function evaluateSeasonEnd(
  seasonYear: string,
  standings: LeagueStanding[],
  clubs: Club[],
  players: Player[],
  userClubId: string
): SeasonEndSummary {
  const sorted = [...standings].sort((a, b) => b.points - a.points);
  const champClub = clubs.find((c) => c.id === sorted[0]?.clubId);
  const userStanding = sorted.find((s) => s.clubId === userClubId);

  const topScorer = [...players]
    .filter((p) => (p.seasonStats?.goals || 0) > 0)
    .sort((a, b) => (b.seasonStats?.goals || 0) - (a.seasonStats?.goals || 0))[0];

  const continentalClubs = sorted.slice(0, 3).map((s) => clubs.find((c) => c.id === s.clubId)?.name || '');
  const relegatedClubs = sorted.slice(-2).map((s) => clubs.find((c) => c.id === s.clubId)?.name || '');

  return {
    seasonYear,
    championClubName: champClub?.name || 'Şampiyon Kulüp',
    userClubRank: userStanding?.rank || 1,
    userClubPoints: userStanding?.points || 0,
    topScorerName: topScorer ? `${topScorer.firstName} ${topScorer.lastName}` : 'Yok',
    topScorerGoals: topScorer?.seasonStats?.goals || 0,
    continentalClubs,
    relegatedClubs,
  };
}

export function startNewSeason(
  currentSeasonYear: string,
  clubs: Club[],
  players: Player[],
  standings: LeagueStanding[],
  userClubId: string
): {
  newSeasonYear: string;
  newCurrentDate: string;
  newFixtures: Fixture[];
  newStandings: LeagueStanding[];
  resetPlayers: Player[];
  archivedHistory: ClubCareerHistory[];
  boardMessage: InboxMessage;
} {
  // Parse year "2026/27" -> "2027/28"
  const startYear = parseInt(currentSeasonYear.split('/')[0], 10) + 1;
  const endYearShort = (startYear + 1).toString().slice(-2);
  const newSeasonYear = `${startYear}/${endYearShort}`;
  const newCurrentDate = `${startYear}-08-01`;

  // 1. Archive previous season for user club
  const userStanding = standings.find((s) => s.clubId === userClubId);
  const userClub = clubs.find((c) => c.id === userClubId);
  const userPlayers = players.filter((p) => p.clubId === userClubId);
  const topScorer = [...userPlayers].sort((a, b) => (b.seasonStats?.goals || 0) - (a.seasonStats?.goals || 0))[0];

  const archivedEntry: ClubCareerHistory = {
    seasonYear: currentSeasonYear,
    clubId: userClubId,
    clubName: userClub?.name || 'Kalyon Doruk SK',
    rank: userStanding?.rank || 1,
    points: userStanding?.points || 0,
    won: userStanding?.won || 0,
    drawn: userStanding?.drawn || 0,
    lost: userStanding?.lost || 0,
    goalsFor: userStanding?.goalsFor || 0,
    goalsAgainst: userStanding?.goalsAgainst || 0,
    topScorerName: topScorer ? `${topScorer.firstName} ${topScorer.lastName}` : 'Yok',
    topScorerGoals: topScorer?.seasonStats?.goals || 0,
    averageRating: 7.2,
  };

  // 2. Reset Standings table for all clubs in league
  const newStandings: LeagueStanding[] = clubs.map((club, idx) => ({
    rank: idx + 1,
    clubId: club.id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    form: [],
  }));

  // 3. AI Club Contract Renewals, Age Progression & Transfers
  let updatedPlayers: Player[] = players.map((p) => {
    const isUserPlayer = p.clubId === userClubId;
    const newAge = p.age + 1;
    let contractYears = Math.max(0, (p.contractYearsLeft ?? 2) - 1);
    let wage = p.wage;
    let clubId = p.clubId;

    if (!isUserPlayer && clubId) {
      // AI Club Contract Renewal logic:
      if (contractYears <= 1 && p.overall >= 72) {
        // AI Club extends key player
        contractYears = Math.floor(Math.random() * 2) + 2; // +2 or +3 years
        wage = Math.round(wage * 1.1);
      } else if (contractYears <= 1 && p.overall < 68 && newAge > 28) {
        // AI Club releases surplus aging player
        clubId = '';
        contractYears = 0;
      }
    }

    return {
      ...p,
      age: newAge,
      contractYearsLeft: contractYears,
      wage,
      clubId,
      fitness: 100,
      matchSharpness: 85,
      form: 7.0,
      isInjured: false,
      injuryDetails: undefined,
      isSuspended: false,
      suspensionDetails: undefined,
      seasonStats: {
        appearances: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        cleanSheets: 0,
        averageRating: 7.0,
      },
    };
  });

  // 4. AI-to-AI Club Transfers between seasons
  const aiClubs = clubs.filter((c) => c.id !== userClubId);
  const transferCount = Math.min(5, Math.max(2, Math.floor(aiClubs.length / 3)));

  for (let i = 0; i < transferCount; i++) {
    const buyerClub = aiClubs[Math.floor(Math.random() * aiClubs.length)];
    const sellerClub = aiClubs.filter((c) => c.id !== buyerClub.id)[Math.floor(Math.random() * (aiClubs.length - 1))];

    if (!buyerClub || !sellerClub) continue;

    const sellerPlayers = updatedPlayers.filter((p) => p.clubId === sellerClub.id && p.overall >= 74 && p.overall <= 85);
    if (sellerPlayers.length === 0) continue;

    const targetPlayer = sellerPlayers[Math.floor(Math.random() * sellerPlayers.length)];
    if (buyerClub.transferBudget >= targetPlayer.marketValue * 0.8) {
      // Execute AI Transfer
      updatedPlayers = updatedPlayers.map((p) => {
        if (p.id === targetPlayer.id) {
          return {
            ...p,
            clubId: buyerClub.id,
            contractYearsLeft: 3,
            wage: Math.round(p.wage * 1.15),
          };
        }
        return p;
      });
    }
  }

  // 5. Generate new fixture schedule
  const newFixtures = generateSeasonFixtures(clubs, newSeasonYear, `${startYear}-08-15`);

  // 6. Board welcome message for new season
  const boardMessage: InboxMessage = {
    id: `msg-board-new-${Date.now()}`,
    clubId: userClubId,
    senderName: 'Hikmet Dorukoğlu',
    senderRole: 'Yönetim Kurulu Başkanı',
    subject: `Yeni Sezon Başladı: ${newSeasonYear} Sezon Hedefleri`,
    preview: `Yeni sezon hazırlıklarımız başladı. Yönetim kurulu bu sezonki hedeflerinizi belirledi...`,
    body: `Sayın Menajer,\n\n${newSeasonYear} sezonuna resmi olarak başlamış bulunuyoruz. Yeni fikstürümüz açıklanmış olup takımımız lig maratonuna hazırlanmaktadır.\n\nYönetim kurulu olarak bu sezon hedefimiz üst sıralarda yer alarak Kıtasal Şampiyona vizesi almaktır. Bütçeniz ve transfer imkanlarınız güncellenmiştir.\n\nBaşarılar dileriz.\nHikmet Dorukoğlu\nKulüp Başkanı`,
    date: newCurrentDate,
    category: 'BOARD',
    isRead: false,
    priority: 'HIGH',
  };

  return {
    newSeasonYear,
    newCurrentDate,
    newFixtures,
    newStandings,
    resetPlayers: updatedPlayers,
    archivedHistory: [archivedEntry],
    boardMessage,
  };
}
