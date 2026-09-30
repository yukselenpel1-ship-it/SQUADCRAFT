import {
  Club,
  Player,
  ClubTactics,
  LeagueStanding,
  Fixture,
  InboxMessage,
  TransferOffer,
  FinanceSummary,
} from '@/types/game';
import {
  TrainingIntensity,
  NewsItem,
  DailyProcessingResult,
} from './types';
import {
  ActiveNegotiation,
  FutureTransferCommitment,
  TransferHistoryRecord,
} from '../negotiation/types';
import {
  Scout,
  ScoutAssignment,
  ScoutingKnowledgeRecord,
  ScoutingReport,
  PlayerHiddenProfile,
} from '../scouting/types';
import { processDailyScoutingAssignments } from '../scouting/scoutingAssignments';
import { LoanAgreement } from '../loans/types';
import { terminateOrExpireLoan } from '../loans/loanEngine';
import { YouthAcademyFacility, YouthPlayer } from '../youth/types';
import { generateAnnualYouthIntake } from '../youth/youthIntake';
import { processMonthlyYouthDevelopment } from '../youth/development';
import { addDaysToDate } from './calendar';
import { processDailyPlayerRecovery } from './recovery';
import { processPlayerBirthday, processMonthlyPlayerDevelopment } from './training';
import { processDailyPlayerInjury } from './injuryRecovery';
import { checkContractWarnings } from './contractProcessor';
import { processDailyFinances } from './financeProcessor';
import { processDailyAITransfers } from './transferProcessor';
import { generateDailyNews } from './newsGenerator';
import { processAiClubMarketActivity } from '../negotiation/aiTransferEngine';
import { simulatePendingAIMatches } from './leagueMatchSimulator';

export interface DailyProcessorState {
  currentDate: string;
  seasonYear: string;
  userClubId: string;
  trainingIntensity: TrainingIntensity;
  clubs: Club[];
  players: Player[];
  tactics: ClubTactics;
  standings: LeagueStanding[];
  fixtures: Fixture[];
  inboxMessages: InboxMessage[];
  transferOffers: TransferOffer[];
  shortlistIds: string[];
  finances: FinanceSummary;
  newsFeed: NewsItem[];
  activeNegotiations?: ActiveNegotiation[];
  futureCommitments?: FutureTransferCommitment[];
  transferHistory?: TransferHistoryRecord[];
  // v0.5.0-alpha additions
  scouts?: Scout[];
  scoutingAssignments?: ScoutAssignment[];
  scoutingKnowledge?: Record<string, ScoutingKnowledgeRecord>;
  scoutingReports?: ScoutingReport[];
  playerHiddenProfiles?: Record<string, PlayerHiddenProfile>;
  activeLoans?: LoanAgreement[];
  academyFacilities?: YouthAcademyFacility;
  youthPlayers?: YouthPlayer[];
}

export function processSingleDay(state: DailyProcessorState): {
  updatedState: DailyProcessorState;
  eventsTriggered: string[];
  newInboxMessages: InboxMessage[];
  newNews: NewsItem[];
  hasUserMatch: boolean;
  userMatchFixtureId?: string;
  stoppedReason?: DailyProcessingResult['stoppedReason'];
} {
  // 0. Safety Guard: If user club already has an unplayed scheduled match on or before currentDate, stop immediately
  const pendingUserMatch = state.fixtures.find(
    (f) =>
      f.status === 'SCHEDULED' &&
      f.date <= state.currentDate &&
      (f.homeClubId === state.userClubId || f.awayClubId === state.userClubId)
  );

  if (pendingUserMatch) {
    return {
      updatedState: state,
      eventsTriggered: [`BUGÜN MAÇ GÜNÜ: ${pendingUserMatch.homeClubId === state.userClubId ? 'Ev Sahibi' : 'Deplasman'} Karşılaşması Oynanmayı Bekliyor!`],
      newInboxMessages: [],
      newNews: [],
      hasUserMatch: true,
      userMatchFixtureId: pendingUserMatch.id,
      stoppedReason: 'MATCH_DAY',
    };
  }

  const nextDate = addDaysToDate(state.currentDate, 1);
  const eventsTriggered: string[] = [];
  const newInboxMessages: InboxMessage[] = [];
  const userClub = state.clubs.find((c) => c.id === state.userClubId) || state.clubs[0];

  // 1. Check if nextDate is a Match Day for User Club
  const userMatch = state.fixtures.find(
    (f) =>
      f.status === 'SCHEDULED' &&
      f.date === nextDate &&
      (f.homeClubId === state.userClubId || f.awayClubId === state.userClubId)
  );

  if (userMatch) {
    eventsTriggered.push(`MAÇ GÜNÜ: ${userMatch.homeClubId === state.userClubId ? 'Ev Sahibi' : 'Deplasman'} Karşılaşması`);
  }

  // 1b. Simulate AI-vs-AI matches on nextDate
  const aiSim = simulatePendingAIMatches(
    state.fixtures,
    state.standings,
    state.clubs,
    state.players,
    state.userClubId,
    { maxDate: nextDate }
  );
  let currentFixtures = aiSim.updatedFixtures;
  let currentStandings = aiSim.updatedStandings;
  if (aiSim.simulatedFixtures.length > 0) {
    eventsTriggered.push(`Ligde ${aiSim.simulatedFixtures.length} maç tamamlandı`);
  }

  // 2. Process Player Recovery & Training & Birthdays & Contract Expiries
  let updatedPlayers = state.players.map((p) => {
    // A. Recovery
    let player = processDailyPlayerRecovery(p, state.trainingIntensity);

    // B. Birthday check
    const bdayRes = processPlayerBirthday(player, nextDate);
    if (bdayRes.isBirthday && player.clubId === state.userClubId) {
      eventsTriggered.push(`${player.firstName} ${player.lastName} ${bdayRes.updatedPlayer.age}. yaş gününü kutladı`);
    }
    player = bdayRes.updatedPlayer;

    // C. Monthly development (1st of month)
    if (nextDate.endsWith('-01')) {
      player = processMonthlyPlayerDevelopment(player, state.trainingIntensity);
    }

    // D. Injury Recovery countdown
    const injRes = processDailyPlayerInjury(player, nextDate, state.userClubId);
    if (injRes.recoveredMessage) {
      newInboxMessages.push(injRes.recoveredMessage);
      eventsTriggered.push(`${player.firstName} ${player.lastName} sakatlıktan kurtuldu`);
    }
    player = injRes.updatedPlayer;

    // E. Contract Expiry Milestone Warnings
    const contractMsg = checkContractWarnings(player, nextDate, state.userClubId);
    if (contractMsg) {
      newInboxMessages.push(contractMsg);
      eventsTriggered.push(`Sözleşme Uyarısı: ${player.firstName} ${player.lastName}`);
    }

    // F. Official Contract Expiry -> Converts to Free Agent
    if (player.clubId !== 'FREE_AGENT' && player.clubId !== 'free-agent' && player.contractEnd && player.contractEnd <= nextDate) {
      const wasUserPlayer = player.clubId === state.userClubId;
      player = {
        ...player,
        clubId: 'FREE_AGENT',
        wage: 0,
      };
      if (wasUserPlayer) {
        newInboxMessages.push({
          id: `msg-exp-${Date.now()}-${player.id}`,
          clubId: state.userClubId,
          senderName: 'Kulüp Avukatı',
          senderRole: 'Hukuk Departmanı',
          subject: `Sözleşme Sona Erdi: ${player.firstName} ${player.lastName}`,
          preview: `${player.firstName} ${player.lastName}'ın sözleşmesi sona ermiş olup oyuncu serbest kalmıştır.`,
          body: `Sayın Menajer,\n\n${player.firstName} ${player.lastName} (${player.position}) ile mevcut sözleşmemiz bugün itibarıyla resmen sona ermiştir. Oyuncu serbest oyuncu statüsüne geçmiştir.`,
          date: nextDate,
          category: 'CONTRACT',
          isRead: false,
          priority: 'HIGH',
        });
        eventsTriggered.push(`Sözleşmesi biten ${player.firstName} ${player.lastName} serbest kaldı`);
      }
    }

    return player;
  });

  // 3. Process Active Loans (Expiry, Returns, Mandatory Buyout Checks)
  let updatedLoans: LoanAgreement[] = [];
  let updatedClubs = [...state.clubs];
  let updatedTactics = { ...state.tactics };

  if (state.activeLoans && state.activeLoans.length > 0) {
    for (const loan of state.activeLoans) {
      if (loan.status === 'ACTIVE' && loan.endDate <= nextDate) {
        const pIdx = updatedPlayers.findIndex((p) => p.id === loan.playerId);
        const parent = updatedClubs.find((c) => c.id === loan.parentClubId);
        const borrower = updatedClubs.find((c) => c.id === loan.borrowerClubId);

        if (pIdx !== -1 && parent && borrower) {
          const expiredRes = terminateOrExpireLoan(
            loan,
            updatedPlayers[pIdx],
            nextDate
          );
          updatedPlayers[pIdx] = expiredRes.updatedPlayer;
          newInboxMessages.push(expiredRes.inboxMessage);
          eventsTriggered.push(`${loan.playerName} kiralık süresi bitti (${loan.parentClubName}'a döndü)`);
          updatedLoans.push(expiredRes.updatedLoan);
        } else {
          updatedLoans.push(loan);
        }
      } else {
        updatedLoans.push(loan);
      }
    }
  }

  // 4. Process Scouting Assignments
  let updatedScouts = state.scouts || [];
  let updatedAssignments = state.scoutingAssignments || [];
  let updatedKnowledgeMap = state.scoutingKnowledge || {};
  let updatedReports = state.scoutingReports || [];

  if (state.scoutingAssignments && state.scoutingAssignments.length > 0) {
    const scoutRes = processDailyScoutingAssignments(
      state.scoutingAssignments,
      state.scouts || [],
      updatedPlayers,
      updatedKnowledgeMap,
      state.playerHiddenProfiles || {},
      nextDate,
      state.userClubId
    );
    updatedAssignments = scoutRes.updatedAssignments;
    updatedScouts = scoutRes.updatedScouts;
    updatedReports = [...scoutRes.newReports, ...updatedReports];
    updatedKnowledgeMap = scoutRes.updatedKnowledgeMap;
    newInboxMessages.push(...scoutRes.newInboxMessages);
  }

  // 5. Process Annual Youth Intake (March 15th)
  let updatedFacility = state.academyFacilities;
  let updatedYouthPlayers = state.youthPlayers || [];

  if (nextDate.endsWith('-03-15') && updatedFacility) {
    const intakeRes = generateAnnualYouthIntake(
      userClub,
      updatedFacility,
      nextDate,
      state.seasonYear
    );
    updatedYouthPlayers = [...intakeRes.intakeBatch.players, ...updatedYouthPlayers];
    updatedFacility = {
      ...updatedFacility,
      intakeHistory: [intakeRes.intakeBatch, ...updatedFacility.intakeHistory],
    };
    newInboxMessages.push(intakeRes.inboxMessage);
    eventsTriggered.push(`Yıllık Genç Yetenek Alımı: ${intakeRes.intakeBatch.players.length} yeni futbolcu katıldı`);
  }

  // Monthly Youth Development (1st of month)
  if (nextDate.endsWith('-01') && updatedYouthPlayers.length > 0 && updatedFacility) {
    updatedYouthPlayers = updatedYouthPlayers.map((yp) =>
      processMonthlyYouthDevelopment(yp, updatedFacility?.academyLevel, updatedFacility?.youthCoachingQuality)
    );
  }

  // 6. Process Finances & Commitments
  const finRes = processDailyFinances(
    state.finances,
    nextDate,
    updatedClubs,
    updatedPlayers,
    state.fixtures,
    state.userClubId,
    state.futureCommitments || []
  );

  if (finRes.wageDeducted) {
    eventsTriggered.push(`Haftalık Maaş Ödemeleri Gerçekleştirildi: -€${finRes.wageAmount?.toLocaleString('tr-TR')}`);
  }
  if (finRes.sponsorCredited) {
    eventsTriggered.push(`Aylık Sponsorluk ve TV Gelirleri Kasaya Aktarıldı: +€${finRes.sponsorAmount?.toLocaleString('tr-TR')}`);
  }
  if (finRes.dueCommitmentsProcessed && finRes.dueCommitmentsProcessed > 0) {
    eventsTriggered.push(`Vadesi Gelen ${finRes.dueCommitmentsProcessed} Transfer Taksiti Ödendi`);
  }

  // 7. Process AI Transfer Engine Activity
  const transferRes = processDailyAITransfers(
    nextDate,
    updatedPlayers,
    state.shortlistIds,
    state.userClubId
  );
  newInboxMessages.push(...transferRes.inboxMessages);

  const aiMarketRes = processAiClubMarketActivity(
    updatedPlayers,
    updatedClubs,
    state.userClubId,
    nextDate,
    state.seasonYear
  );
  updatedPlayers = aiMarketRes.updatedPlayers;
  updatedClubs = aiMarketRes.updatedClubs;

  // 8. Generate Daily News
  const generatedNews = generateDailyNews(
    nextDate,
    updatedClubs,
    currentStandings,
    currentFixtures,
    updatedPlayers,
    state.userClubId,
    finRes.updatedFinances
  );
  const combinedNews = [...aiMarketRes.completedNews, ...generatedNews];

  const updatedState: DailyProcessorState = {
    ...state,
    currentDate: nextDate,
    clubs: updatedClubs,
    players: updatedPlayers,
    tactics: updatedTactics,
    fixtures: currentFixtures,
    standings: currentStandings,
    finances: finRes.updatedFinances,
    futureCommitments: finRes.updatedCommitments || state.futureCommitments,
    transferOffers: [...transferRes.newOffers, ...state.transferOffers],
    inboxMessages: [...newInboxMessages, ...state.inboxMessages],
    newsFeed: [...combinedNews, ...state.newsFeed].slice(0, 40),
    scouts: updatedScouts,
    scoutingAssignments: updatedAssignments,
    scoutingKnowledge: updatedKnowledgeMap,
    scoutingReports: updatedReports,
    activeLoans: updatedLoans,
    academyFacilities: updatedFacility,
    youthPlayers: updatedYouthPlayers,
  };

  return {
    updatedState,
    eventsTriggered,
    newInboxMessages,
    newNews: combinedNews,
    hasUserMatch: Boolean(userMatch),
    userMatchFixtureId: userMatch?.id,
    stoppedReason: userMatch
      ? 'MATCH_DAY'
      : transferRes.newOffers.length > 0
      ? 'TRANSFER_OFFER'
      : undefined,
  };
}

export function processMultipleDays(
  initialState: DailyProcessorState,
  maxDays: number = 30
): {
  finalState: DailyProcessorState;
  result: DailyProcessingResult;
} {
  let currentState = { ...initialState };
  let daysProcessed = 0;
  const allEvents: string[] = [];
  const allNewMessages: InboxMessage[] = [];
  const allNewNews: NewsItem[] = [];
  let stoppedReason: DailyProcessingResult['stoppedReason'] = 'MANUAL_STOP';
  let hasUserMatch = false;
  let userMatchFixtureId: string | undefined;

  for (let i = 0; i < maxDays; i++) {
    const step = processSingleDay(currentState);
    currentState = step.updatedState;
    daysProcessed++;

    allEvents.push(...step.eventsTriggered);
    allNewMessages.push(...step.newInboxMessages);
    allNewNews.push(...step.newNews);

    if (step.hasUserMatch) {
      stoppedReason = 'MATCH_DAY';
      hasUserMatch = true;
      userMatchFixtureId = step.userMatchFixtureId;
      break;
    }

    if (step.stoppedReason === 'TRANSFER_OFFER') {
      stoppedReason = 'TRANSFER_OFFER';
      break;
    }
  }

  return {
    finalState: currentState,
    result: {
      currentDate: currentState.currentDate,
      daysProcessed,
      eventsTriggered: allEvents,
      newInboxMessages: allNewMessages,
      newNews: allNewNews,
      hasUserMatch,
      userMatchFixtureId,
      stoppedReason,
    },
  };
}
