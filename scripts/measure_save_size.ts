import { generateCareerPlayerUniverse } from '../src/lib/career/careerUniverse';
import { MOCK_CLUBS } from '../src/lib/data/mockData';
import { generateSeasonFixtures } from '../src/lib/career/fixtureGenerator';
import { generateClubScouts } from '../src/lib/scouting/scoutGenerator';
import { generatePlayerHiddenProfile } from '../src/lib/scouting/playerPersonality';
import { initializeClubAcademy } from '../src/lib/youth/academyQuality';

console.log('Generating universe...');
const players = generateCareerPlayerUniverse(MOCK_CLUBS);
const fixtures = generateSeasonFixtures(MOCK_CLUBS, '2026/27');
const scouts = generateClubScouts('kalyon-doruk', 75);
const academy = initializeClubAcademy(MOCK_CLUBS[0] as any, '2026/27');

const hiddenProfiles: Record<string, any> = {};
for (const p of players) {
  hiddenProfiles[p.id] = generatePlayerHiddenProfile(p);
}

const fullSave = {
  saveVersion: 3,
  savedAt: new Date().toISOString(),
  seasonYear: '2026/27',
  seasonStage: 'PRE_SEASON',
  currentDate: '2026-07-01',
  userClubId: 'kalyon-doruk',
  trainingIntensity: 'BALANCED',
  difficulty: 'BALANCED',
  leagueSize: 10,
  clubs: MOCK_CLUBS,
  players: players,
  fixtures: fixtures,
  tactics: {},
  standings: [],
  inboxMessages: [],
  transferOffers: [],
  shortlistIds: [],
  finances: { transferBudget: 25000000, wageBudget: 500000, currentWageBill: 350000, clubBalance: 40000000 },
  newsFeed: [],
  careerHistory: [],
  activeNegotiations: [],
  transferHistory: [],
  futureCommitments: [],
  scouts: scouts,
  scoutingAssignments: [],
  scoutingKnowledge: {},
  scoutingReports: [],
  playerHiddenProfiles: hiddenProfiles,
  activeLoans: [],
  academyFacilities: academy,
  youthPlayers: [],
  managerContract: { yearsLeft: 2, weeklySalary: 45000, status: 'ACTIVE' },
  seasonNumber: 1,
  careerEconomyVersion: 2,
};

const serialized = JSON.stringify(fullSave);
const bytes = Buffer.byteLength(serialized, 'utf8');
const mb = (bytes / (1024 * 1024)).toFixed(2);
console.log('--- CAREER SAVE SIZE MEASUREMENT ---');
console.log('PLAYER COUNT:', players.length);
console.log('FULL SAVE BYTE SIZE:', bytes, 'bytes');
console.log('FULL SAVE MB SIZE:', mb, 'MB');

// Test localStorage quota simulation: 5MB UTF-16 limit on mobile Safari
// Mobile Safari typically limits localStorage to 5MB (or 2.5M UTF-16 code units / 5,242,880 bytes).
const safariQuotaBytes = 5 * 1024 * 1024;
console.log('SAFARI LOCALSTORAGE LIMIT ~ 5MB =', safariQuotaBytes, 'bytes');
if (bytes > safariQuotaBytes) {
  console.log('LOCALSTORAGE QUOTA ISSUE: YES (Exceeds 5MB)');
} else {
  console.log('LOCALSTORAGE QUOTA ISSUE: HIGH RISK (Near or can exceed 5MB quota)');
}
