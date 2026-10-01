'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Club,
  Player,
  ClubTactics,
  LeagueStanding,
  Fixture,
  InboxMessage,
  TransferOffer,
  FinanceSummary,
  Formation,
  TacticalSettings,
  ManagerContract,
} from '@/types/game';
import {
  MOCK_CLUBS,
  MOCK_PLAYERS,
  MOCK_STANDINGS,
  MOCK_INBOX_MESSAGES,
  MOCK_TRANSFER_OFFERS,
  MOCK_SHORTLIST_IDS,
  MOCK_FINANCES,
  getInitialTactics,
  generateCareerTactics,
  FORMATION_COORDINATES,
} from '@/lib/data/mockData';
import {
  TrainingIntensity,
  SeasonStage,
  NewsItem,
  ClubCareerHistory,
  DailyProcessingResult,
  CareerSaveDataV3,
  CareerDifficulty,
} from '@/lib/career/types';
import {
  generateSeasonFixtures,
  formatDateTurkish,
  daysBetween,
  getTransferWindowStatus,
  getSeasonStage,
  processSingleDay,
  processMultipleDays,
  startNewSeason,
  evaluateSeasonEnd,
  SeasonEndSummary,
  saveCareerState,
  loadCareerState,
  clearCareerSave,
  simulatePendingAIMatches,
  processMatchSuspension,
} from '@/lib/career';
import { generateCareerPlayerUniverse, EXTERNAL_CLUBS } from '@/lib/career/careerUniverse';

import {
  ActiveNegotiation,
  TransferOfferPackage,
  ContractOfferPackage,
  ClubNegotiationResponse,
  PlayerNegotiationResponse,
  FutureTransferCommitment,
  TransferHistoryRecord,
  createActiveNegotiation,
  addNegotiationLog,
  evaluateClubTransferOffer,
  evaluatePlayerContractOffer,
  executeTransferCompletion,
  canAffordTransfer,
} from '@/lib/negotiation';

import {
  Scout,
  ScoutAssignment,
  ScoutingKnowledgeRecord,
  ScoutingReport,
  PlayerHiddenProfile,
  ScoutingRegionId,
  AssignmentDurationDays,
  KnowledgeLevel,
  MaskedPlayerView,
  generateClubScouts,
  generateFreeAgentScouts,
  generatePlayerHiddenProfile,
  getScoutingKnowledge,
  createScoutingAssignment,
  cancelScoutingAssignment,
  getMaskedPlayerView,
} from '@/lib/scouting';

import {
  LoanAgreement,
  LoanOfferPackage,
  LoanNegotiationResponse,
  evaluateLoanOffer,
  executeLoanOfferAcceptance,
  recallLoanPlayer,
  exerciseBuyOption,
} from '@/lib/loans';

import {
  YouthPlayer,
  YouthAcademyFacility,
  initializeClubAcademy,
  upgradeAcademyFacility,
  promoteYouthPlayerToSenior,
} from '@/lib/youth';

interface GameContextType {
  userClub: Club;
  allClubs: Club[];
  allPlayers: Player[];
  userPlayers: Player[];
  tactics: ClubTactics;
  standings: LeagueStanding[];
  fixtures: Fixture[];
  inboxMessages: InboxMessage[];
  transferOffers: TransferOffer[];
  shortlistIds: string[];
  finances: FinanceSummary;
  currentDate: string; // ISO format YYYY-MM-DD
  seasonYear: string;
  seasonStage: SeasonStage;
  trainingIntensity: TrainingIntensity;
  newsFeed: NewsItem[];
  careerHistory: ClubCareerHistory[];
  unreadMessageCount: number;
  nextMatch: Fixture | undefined;
  previousMatch: Fixture | undefined;
  isMatchDay: boolean;
  daysUntilNextMatch: number;
  seasonEndSummary?: SeasonEndSummary;

  // Negotiation & Transfer Engine State
  activeNegotiations: ActiveNegotiation[];
  transferHistory: TransferHistoryRecord[];
  futureCommitments: FutureTransferCommitment[];

  // Scouting, Fog of War, Loans & Youth State
  scouts: Scout[];
  freeAgentScouts: Scout[];
  scoutingAssignments: ScoutAssignment[];
  scoutingKnowledge: Record<string, ScoutingKnowledgeRecord>;
  scoutingReports: ScoutingReport[];
  playerHiddenProfiles: Record<string, PlayerHiddenProfile>;
  activeLoans: LoanAgreement[];
  academyFacilities: YouthAcademyFacility;
  youthPlayers: YouthPlayer[];

  // Career Mode Management
  hasActiveCareer: boolean;
  hasSavedCareer: boolean;
  isInitialized: boolean;
  difficulty: CareerDifficulty;
  leagueSize: 10 | 14 | 18;
  startNewCareer: (setup: import('@/lib/career/types').CareerSetupConfig) => void;
  loadExistingCareer: () => boolean;

  // General Actions
  advanceDay: () => DailyProcessingResult;
  smartAdvance: (maxDays?: number) => DailyProcessingResult;
  setTrainingIntensity: (intensity: TrainingIntensity) => void;
  applyMatchResult: (
    fixtureId: string,
    homeScore: number,
    awayScore: number,
    events: any[],
    stats: any,
    playerUpdates?: { playerId: string; goals: number; assists: number; yellowCards: number; redCards: number; matchRating: number; fitness: number }[]
  ) => void;
  setFormation: (formation: Formation) => void;
  updateTacticalSettings: (settings: Partial<TacticalSettings>) => void;
  swapLineupPlayer: (slotId: number, newPlayerId: string) => void;
  swapPitchSlots: (fromSlotId: number, toSlotId: number) => void;
  markMessageAsRead: (id: string) => void;
  deleteMessage: (id: string) => void;
  respondToTransferOffer: (offerId: string, accept: boolean) => void;
  toggleShortlist: (playerId: string) => void;
  makeTransferBid: (playerId: string, fee: number) => void;
  startNextSeasonRoll: () => void;
  resetEntireCareer: () => void;
  getPlayerById: (id: string) => Player | undefined;
  getClubById: (id: string) => Club | undefined;

  // Negotiation Actions
  startNegotiation: (playerId: string, isContractRenewal?: boolean) => ActiveNegotiation;
  submitClubOffer: (negotiationId: string, offer: TransferOfferPackage) => ClubNegotiationResponse;
  submitContractOffer: (negotiationId: string, offer: ContractOfferPackage) => PlayerNegotiationResponse;
  acceptClubCounterOffer: (negotiationId: string) => ClubNegotiationResponse;
  acceptPlayerCounterOffer: (negotiationId: string) => PlayerNegotiationResponse;
  withdrawNegotiation: (negotiationId: string) => void;
  getNegotiationByPlayerId: (playerId: string) => ActiveNegotiation | undefined;
  getNegotiationById: (id: string) => ActiveNegotiation | undefined;

  // Scouting, Loans & Youth Actions
  assignScout: (
    scoutId: string,
    playerId: string,
    durationDays: AssignmentDurationDays,
    regionId?: ScoutingRegionId
  ) => { success: boolean; message: string; assignment?: ScoutAssignment };
  cancelScoutAssignment: (assignmentId: string) => void;
  hireScout: (scoutId: string) => { success: boolean; message: string };
  fireScout: (scoutId: string) => void;
  submitLoanOffer: (playerId: string, offer: LoanOfferPackage) => LoanNegotiationResponse;
  recallLoan: (loanAgreementId: string) => { success: boolean; message: string };
  exerciseLoanBuyOption: (loanAgreementId: string) => { success: boolean; message: string };
  promoteYouthPlayer: (youthPlayerId: string) => { success: boolean; message: string; player?: Player };
  upgradeAcademy: (facilityType: 'academyLevel' | 'youthCoachingQuality' | 'youthRecruitmentNetwork') => { success: boolean; message: string };
  getMaskedPlayer: (player: Player) => MaskedPlayerView;
  getPlayerKnowledge: (playerId: string) => { level: KnowledgeLevel; percentage: number };
  seasonNumber: number;
  managerContract: ManagerContract;
  autoAssignTactics: () => void;
  respondToManagerContractOffer: (accept: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [hasActiveCareer, setHasActiveCareer] = useState<boolean>(false);
  const [hasSavedCareer, setHasSavedCareer] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<CareerDifficulty>('Standart');
  const [leagueSize, setLeagueSize] = useState<10 | 14 | 18>(10);
  const [userClubId, setUserClubId] = useState<string>('kalyon-doruk');
  const [currentDate, setCurrentDate] = useState<string>('2026-08-01');
  const [seasonYear, setSeasonYear] = useState<string>('2026/27');
  const [seasonStage, setSeasonStage] = useState<SeasonStage>('PRE_SEASON');
  const [trainingIntensity, setTrainingIntensityState] = useState<TrainingIntensity>('Normal');
  const [seasonNumber, setSeasonNumber] = useState<number>(1);
  const [careerEconomyVersion, setCareerEconomyVersion] = useState<number>(2);
  const [managerContract, setManagerContract] = useState<ManagerContract>({
    yearsLeft: 2,
    weeklySalary: 45000,
    status: 'ACTIVE',
  });
  const [allClubs, setAllClubs] = useState<Club[]>(MOCK_CLUBS);
  const [allPlayers, setAllPlayers] = useState<Player[]>(() => generateCareerPlayerUniverse(MOCK_CLUBS));
  const [tactics, setTactics] = useState<ClubTactics>(() => {
    const initPool = generateCareerPlayerUniverse(MOCK_CLUBS);
    const userSquad = initPool.filter((p) => p.clubId === 'kalyon-doruk');
    return generateCareerTactics('kalyon-doruk', userSquad, '4-2-3-1');
  });
  const [standings, setStandings] = useState<LeagueStanding[]>(() =>
    MOCK_CLUBS.map((c, i) => ({
      rank: i + 1,
      clubId: c.id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
    }))
  );
  const [fixtures, setFixtures] = useState<Fixture[]>(() =>
    generateSeasonFixtures(MOCK_CLUBS, '2026/27', '2026-08-15')
  );
  const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>(MOCK_INBOX_MESSAGES);
  const [transferOffers, setTransferOffers] = useState<TransferOffer[]>(MOCK_TRANSFER_OFFERS);
  const [shortlistIds, setShortlistIds] = useState<string[]>(MOCK_SHORTLIST_IDS);
  const [finances, setFinances] = useState<FinanceSummary>(MOCK_FINANCES);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  const [careerHistory, setCareerHistory] = useState<ClubCareerHistory[]>([]);
  const [activeNegotiations, setActiveNegotiations] = useState<ActiveNegotiation[]>([]);
  const [transferHistory, setTransferHistory] = useState<TransferHistoryRecord[]>([]);
  const [futureCommitments, setFutureCommitments] = useState<FutureTransferCommitment[]>([]);

  // v0.5.0-alpha states
  const [scouts, setScouts] = useState<Scout[]>(() => generateClubScouts('kalyon-doruk', 80));
  const [freeAgentScouts, setFreeAgentScouts] = useState<Scout[]>(() => generateFreeAgentScouts());
  const [scoutingAssignments, setScoutingAssignments] = useState<ScoutAssignment[]>([]);
  const [scoutingKnowledge, setScoutingKnowledge] = useState<Record<string, ScoutingKnowledgeRecord>>({});
  const [scoutingReports, setScoutingReports] = useState<ScoutingReport[]>([]);
  const [playerHiddenProfiles, setPlayerHiddenProfiles] = useState<Record<string, PlayerHiddenProfile>>(() => {
    const profiles: Record<string, PlayerHiddenProfile> = {};
    const initPool = generateCareerPlayerUniverse(MOCK_CLUBS);
    for (const p of initPool) {
      profiles[p.id] = generatePlayerHiddenProfile(p);
    }
    return profiles;
  });
  const [activeLoans, setActiveLoans] = useState<LoanAgreement[]>([]);
  const [academyFacilities, setAcademyFacilities] = useState<YouthAcademyFacility>(() =>
    initializeClubAcademy(MOCK_CLUBS[0], '2026/27')
  );
  const [youthPlayers, setYouthPlayers] = useState<YouthPlayer[]>([]);

  // Load from local storage on mount (browser only)
  useEffect(() => {
    try {
      const saved = loadCareerState();
      if (saved) {
        setHasSavedCareer(true);
        if (saved.difficulty) setDifficulty(saved.difficulty);
        if (saved.leagueSize) setLeagueSize(saved.leagueSize);
        setUserClubId(saved.userClubId || 'kalyon-doruk');
        setCurrentDate(saved.currentDate);
        setSeasonYear(saved.seasonYear);
        setSeasonStage(saved.seasonStage);
        setTrainingIntensityState(saved.trainingIntensity);
        setAllClubs(saved.clubs);
        setAllPlayers(saved.players);
        setTactics(saved.tactics);
        setStandings(saved.standings);
        setFixtures(saved.fixtures);
        setInboxMessages(saved.inboxMessages);
        setTransferOffers(saved.transferOffers);
        setShortlistIds(saved.shortlistIds);
        setFinances(saved.finances);
        setNewsFeed(saved.newsFeed || []);
        setCareerHistory(saved.careerHistory || []);
        if (saved.activeNegotiations) setActiveNegotiations(saved.activeNegotiations);
        if (saved.transferHistory) setTransferHistory(saved.transferHistory);
        if (saved.futureCommitments) setFutureCommitments(saved.futureCommitments);
        if (saved.scouts) setScouts(saved.scouts);
        if (saved.scoutingAssignments) setScoutingAssignments(saved.scoutingAssignments);
        if (saved.scoutingKnowledge) setScoutingKnowledge(saved.scoutingKnowledge);
        if (saved.scoutingReports) setScoutingReports(saved.scoutingReports);
        if (saved.playerHiddenProfiles) setPlayerHiddenProfiles(saved.playerHiddenProfiles);
        if (saved.activeLoans) setActiveLoans(saved.activeLoans);
        if (saved.academyFacilities) setAcademyFacilities(saved.academyFacilities);
        if (saved.youthPlayers) setYouthPlayers(saved.youthPlayers);
        if (saved.managerContract) setManagerContract(saved.managerContract);
        if (saved.seasonNumber) setSeasonNumber(saved.seasonNumber);
        if (saved.careerEconomyVersion) setCareerEconomyVersion(saved.careerEconomyVersion);

        // If navigated directly to an active career route and save exists, mark active
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (
            path.startsWith('/dashboard') ||
            path.startsWith('/squad') ||
            path.startsWith('/tactics') ||
            path.startsWith('/fixtures') ||
            path.startsWith('/league') ||
            path.startsWith('/transfers') ||
            path.startsWith('/scouting') ||
            path.startsWith('/academy') ||
            path.startsWith('/finances') ||
            path.startsWith('/inbox') ||
            path.startsWith('/settings') ||
            path.startsWith('/match')
          ) {
            setHasActiveCareer(true);
          }
        }
      } else {
        setHasSavedCareer(false);
        setHasActiveCareer(false);
      }
    } catch {
      // ignore
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save changes to local storage helper (V3 format)
  const persist = (
    cDate = currentDate,
    sYear = seasonYear,
    sStage = seasonStage,
    tIntensity = trainingIntensity,
    pls = allPlayers,
    tacts = tactics,
    stnds = standings,
    fixs = fixtures,
    msgs = inboxMessages,
    trOffers = transferOffers,
    shortIds = shortlistIds,
    fins = finances,
    news = newsFeed,
    history = careerHistory,
    negs = activeNegotiations,
    trHistory = transferHistory,
    comms = futureCommitments,
    scs = scouts,
    assigns = scoutingAssignments,
    know = scoutingKnowledge,
    reps = scoutingReports,
    profiles = playerHiddenProfiles,
    loans = activeLoans,
    fac = academyFacilities,
    youths = youthPlayers,
    diff = difficulty,
    lSize = leagueSize,
    cls = allClubs
  ) => {
    saveCareerState({
      saveVersion: 3,
      savedAt: new Date().toISOString(),
      seasonYear: sYear,
      seasonStage: sStage,
      currentDate: cDate,
      userClubId,
      trainingIntensity: tIntensity,
      difficulty: diff,
      leagueSize: lSize,
      clubs: cls,
      players: pls,
      tactics: tacts,
      standings: stnds,
      fixtures: fixs,
      inboxMessages: msgs,
      transferOffers: trOffers,
      shortlistIds: shortIds,
      finances: fins,
      newsFeed: news,
      careerHistory: history,
      activeNegotiations: negs,
      transferHistory: trHistory,
      futureCommitments: comms,
      scouts: scs,
      scoutingAssignments: assigns,
      scoutingKnowledge: know,
      scoutingReports: reps,
      playerHiddenProfiles: profiles,
      activeLoans: loans,
      academyFacilities: fac,
      youthPlayers: youths,
      managerContract,
      seasonNumber,
      careerEconomyVersion: 2,
      settings: {
        autoSave: true,
        defaultMatchSpeed: 1,
        debugMode: false,
      },
    });
  };

  const userClub = allClubs.find((c) => c.id === userClubId) || allClubs[0];
  const userPlayers = allPlayers.filter((p) => p.clubId === userClubId);

  // Auto-reconciliation to prevent tactics displaying "Boş" or mismatched squad IDs
  useEffect(() => {
    if (userPlayers.length >= 11) {
      const userPlayerIds = new Set(userPlayers.map((p) => p.id));
      const validAssigned = tactics.lineup.filter((s) => s.playerId && userPlayerIds.has(s.playerId));

      const needsHealing =
        validAssigned.length < 11 ||
        tactics.lineup.some((s) => !s.playerId) ||
        tactics.substitutes.length === 0 ||
        tactics.substitutes.some((id) => !userPlayerIds.has(id));

      if (needsHealing) {
        const healed = generateCareerTactics(userClubId, userPlayers, tactics.formation || '4-2-3-1');
        healed.settings = tactics.settings;
        setTactics(healed);
      }
    }
  }, [allPlayers, userClubId, userPlayers.length]);

  const unreadMessageCount = inboxMessages.filter((m) => !m.isRead).length;

  const nextMatch = fixtures.find(
    (f) =>
      (f.homeClubId === userClubId || f.awayClubId === userClubId) &&
      f.status === 'SCHEDULED'
  );

  const previousMatch = [...fixtures]
    .reverse()
    .find(
      (f) =>
        (f.homeClubId === userClubId || f.awayClubId === userClubId) &&
        f.status === 'FINISHED'
    );

  const isMatchDay = Boolean(nextMatch && nextMatch.date <= currentDate);
  const daysUntilNextMatch = nextMatch ? Math.max(0, daysBetween(currentDate, nextMatch.date)) : 999;

  const getPlayerById = (id: string) => allPlayers.find((p) => p.id === id);
  const getClubById = (id: string): Club | undefined => {
    const found = allClubs.find((c) => c.id === id);
    if (found) return found;
    const ext = EXTERNAL_CLUBS.find((c) => c.id === id);
    if (ext) {
      return {
        id: ext.id,
        name: ext.name,
        shortName: ext.name,
        code: ext.code,
        city: ext.region,
        stadium: `${ext.name} Arena`,
        stadiumCapacity: 25000,
        reputation: ext.reputation,
        balance: 15000000,
        transferBudget: 8000000,
        wageBudget: 250000,
        weeklyWageExpense: 180000,
        primaryColor: '#2563EB',
        secondaryColor: '#1E3A8A',
        managerName: 'Teknik Direktör',
        foundedYear: 1960,
      };
    }
    return undefined;
  };

  const setTrainingIntensity = (intensity: TrainingIntensity) => {
    setTrainingIntensityState(intensity);
    persist(currentDate, seasonYear, seasonStage, intensity);
  };

  // 1. Advance Exactly 1 Day
  const advanceDay = (): DailyProcessingResult => {
    // If today is an unplayed matchday for the user, do not advance past it!
    if (isMatchDay && nextMatch) {
      return {
        currentDate,
        daysProcessed: 0,
        eventsTriggered: [`BUGÜN MAÇ GÜNÜ: ${nextMatch.homeClubId === userClubId ? 'Ev Sahibi' : 'Deplasman'} Karşılaşması Oynanmayı Bekliyor!`],
        newInboxMessages: [],
        newNews: [],
        hasUserMatch: true,
        userMatchFixtureId: nextMatch.id,
        stoppedReason: 'MATCH_DAY',
      };
    }

    const res = processSingleDay({
      currentDate,
      seasonYear,
      userClubId,
      trainingIntensity,
      clubs: allClubs,
      players: allPlayers,
      tactics,
      standings,
      fixtures,
      inboxMessages,
      transferOffers,
      shortlistIds,
      finances,
      newsFeed,
      activeNegotiations,
      futureCommitments,
      transferHistory,
      scouts,
      scoutingAssignments,
      scoutingKnowledge,
      scoutingReports,
      playerHiddenProfiles,
      activeLoans,
      academyFacilities,
      youthPlayers,
    });

    const newStage = getSeasonStage(res.updatedState.currentDate, res.updatedState.standings?.[0]?.played || standings[0]?.played || 0);

    setCurrentDate(res.updatedState.currentDate);
    setSeasonStage(newStage);
    setAllClubs(res.updatedState.clubs);
    setAllPlayers(res.updatedState.players);
    if (res.updatedState.fixtures) setFixtures(res.updatedState.fixtures);
    if (res.updatedState.standings) setStandings(res.updatedState.standings);
    setFinances(res.updatedState.finances);
    setTransferOffers(res.updatedState.transferOffers);
    setInboxMessages(res.updatedState.inboxMessages);
    setNewsFeed(res.updatedState.newsFeed);
    if (res.updatedState.futureCommitments) setFutureCommitments(res.updatedState.futureCommitments);
    if (res.updatedState.scouts) setScouts(res.updatedState.scouts);
    if (res.updatedState.scoutingAssignments) setScoutingAssignments(res.updatedState.scoutingAssignments);
    if (res.updatedState.scoutingKnowledge) setScoutingKnowledge(res.updatedState.scoutingKnowledge);
    if (res.updatedState.scoutingReports) setScoutingReports(res.updatedState.scoutingReports);
    if (res.updatedState.activeLoans) setActiveLoans(res.updatedState.activeLoans);
    if (res.updatedState.academyFacilities) setAcademyFacilities(res.updatedState.academyFacilities);
    if (res.updatedState.youthPlayers) setYouthPlayers(res.updatedState.youthPlayers);
    if (res.updatedState.transferHistory) setTransferHistory(res.updatedState.transferHistory);

    persist(
      res.updatedState.currentDate,
      seasonYear,
      newStage,
      trainingIntensity,
      res.updatedState.players,
      tactics,
      res.updatedState.standings || standings,
      res.updatedState.fixtures || fixtures,
      res.updatedState.inboxMessages,
      res.updatedState.transferOffers,
      shortlistIds,
      res.updatedState.finances,
      res.updatedState.newsFeed,
      careerHistory,
      activeNegotiations,
      res.updatedState.transferHistory || transferHistory,
      res.updatedState.futureCommitments || futureCommitments,
      res.updatedState.scouts || scouts,
      res.updatedState.scoutingAssignments || scoutingAssignments,
      res.updatedState.scoutingKnowledge || scoutingKnowledge,
      res.updatedState.scoutingReports || scoutingReports,
      playerHiddenProfiles,
      res.updatedState.activeLoans || activeLoans,
      res.updatedState.academyFacilities || academyFacilities,
      res.updatedState.youthPlayers || youthPlayers
    );

    return {
      currentDate: res.updatedState.currentDate,
      daysProcessed: res.stoppedReason === 'MATCH_DAY' && res.updatedState.currentDate === currentDate ? 0 : 1,
      eventsTriggered: res.eventsTriggered,
      newInboxMessages: res.newInboxMessages,
      newNews: res.newNews,
      hasUserMatch: res.hasUserMatch,
      userMatchFixtureId: res.userMatchFixtureId,
      stoppedReason: res.stoppedReason,
    };
  };

  // 2. Smart Advance (Up to next important event or matchday)
  const smartAdvance = (maxDays: number = 30): DailyProcessingResult => {
    // If today is an unplayed matchday for the user, do not advance past it!
    if (isMatchDay && nextMatch) {
      return {
        currentDate,
        daysProcessed: 0,
        eventsTriggered: [`BUGÜN MAÇ GÜNÜ: ${nextMatch.homeClubId === userClubId ? 'Ev Sahibi' : 'Deplasman'} Karşılaşması Oynanmayı Bekliyor!`],
        newInboxMessages: [],
        newNews: [],
        hasUserMatch: true,
        userMatchFixtureId: nextMatch.id,
        stoppedReason: 'MATCH_DAY',
      };
    }

    const { finalState, result } = processMultipleDays(
      {
        currentDate,
        seasonYear,
        userClubId,
        trainingIntensity,
        clubs: allClubs,
        players: allPlayers,
        tactics,
        standings,
        fixtures,
        inboxMessages,
        transferOffers,
        shortlistIds,
        finances,
        newsFeed,
        activeNegotiations,
        futureCommitments,
        transferHistory,
        scouts,
        scoutingAssignments,
        scoutingKnowledge,
        scoutingReports,
        playerHiddenProfiles,
        activeLoans,
        academyFacilities,
        youthPlayers,
      },
      maxDays
    );

    const newStage = getSeasonStage(finalState.currentDate, finalState.standings?.[0]?.played || standings[0]?.played || 0);

    setCurrentDate(finalState.currentDate);
    setSeasonStage(newStage);
    setAllClubs(finalState.clubs);
    setAllPlayers(finalState.players);
    if (finalState.fixtures) setFixtures(finalState.fixtures);
    if (finalState.standings) setStandings(finalState.standings);
    setFinances(finalState.finances);
    setTransferOffers(finalState.transferOffers);
    setInboxMessages(finalState.inboxMessages);
    setNewsFeed(finalState.newsFeed);
    if (finalState.futureCommitments) setFutureCommitments(finalState.futureCommitments);
    if (finalState.scouts) setScouts(finalState.scouts);
    if (finalState.scoutingAssignments) setScoutingAssignments(finalState.scoutingAssignments);
    if (finalState.scoutingKnowledge) setScoutingKnowledge(finalState.scoutingKnowledge);
    if (finalState.scoutingReports) setScoutingReports(finalState.scoutingReports);
    if (finalState.activeLoans) setActiveLoans(finalState.activeLoans);
    if (finalState.academyFacilities) setAcademyFacilities(finalState.academyFacilities);
    if (finalState.youthPlayers) setYouthPlayers(finalState.youthPlayers);
    if (finalState.transferHistory) setTransferHistory(finalState.transferHistory);

    persist(
      finalState.currentDate,
      seasonYear,
      newStage,
      trainingIntensity,
      finalState.players,
      tactics,
      finalState.standings || standings,
      finalState.fixtures || fixtures,
      finalState.inboxMessages,
      finalState.transferOffers,
      shortlistIds,
      finalState.finances,
      finalState.newsFeed,
      careerHistory,
      activeNegotiations,
      finalState.transferHistory || transferHistory,
      finalState.futureCommitments || futureCommitments,
      finalState.scouts || scouts,
      finalState.scoutingAssignments || scoutingAssignments,
      finalState.scoutingKnowledge || scoutingKnowledge,
      finalState.scoutingReports || scoutingReports,
      playerHiddenProfiles,
      finalState.activeLoans || activeLoans,
      finalState.academyFacilities || academyFacilities,
      finalState.youthPlayers || youthPlayers
    );

    return result;
  };

  // 3. Apply Match Results
  const applyMatchResult = (
    fixtureId: string,
    homeScore: number,
    awayScore: number,
    events: any[],
    stats: any,
    playerUpdates?: { playerId: string; goals: number; assists: number; yellowCards: number; redCards: number; matchRating: number; fitness: number }[]
  ) => {
    const fixture = fixtures.find((f) => f.id === fixtureId);
    if (!fixture || fixture.status === 'FINISHED') return;

    // A. Update Fixture
    const updatedFixtures = fixtures.map((f) => {
      if (f.id === fixtureId) {
        return {
          ...f,
          status: 'FINISHED' as const,
          homeScore,
          awayScore,
          events: events.map((ev) => ({
            id: ev.id,
            minute: ev.minute,
            type: ev.type,
            teamId: ev.teamId,
            playerId: ev.playerId || '',
            playerName: ev.playerName || '',
            secondaryPlayerId: ev.secondaryPlayerId,
            secondaryPlayerName: ev.secondaryPlayerName,
            description: ev.description,
          })),
          stats: {
            possession: [stats.possession?.[0] || 50, stats.possession?.[1] || 50] as [number, number],
            shots: [stats.shots?.[0] || 0, stats.shots?.[1] || 0] as [number, number],
            shotsOnTarget: [stats.shotsOnTarget?.[0] || 0, stats.shotsOnTarget?.[1] || 0] as [number, number],
            corners: [stats.corners?.[0] || 0, stats.corners?.[1] || 0] as [number, number],
            fouls: [stats.fouls?.[0] || 0, stats.fouls?.[1] || 0] as [number, number],
            yellowCards: [stats.yellowCards?.[0] || 0, stats.yellowCards?.[1] || 0] as [number, number],
            redCards: [stats.redCards?.[0] || 0, stats.redCards?.[1] || 0] as [number, number],
            passAccuracy: [stats.passAccuracy?.[0] || 80, stats.passAccuracy?.[1] || 80] as [number, number],
            xg: [stats.xg?.[0] || 0, stats.xg?.[1] || 0] as [number, number],
          },
        };
      }
      return f;
    });
    setFixtures(updatedFixtures);

    // B. Update League Standings
    const updatedStandings = standings.map((st) => {
      if (st.clubId === fixture.homeClubId) {
        const isWin = homeScore > awayScore;
        const isDraw = homeScore === awayScore;
        const isLoss = homeScore < awayScore;
        const pts = isWin ? 3 : isDraw ? 1 : 0;
        const formChar: 'W' | 'D' | 'L' = isWin ? 'W' : isDraw ? 'D' : 'L';
        return {
          ...st,
          played: st.played + 1,
          won: st.won + (isWin ? 1 : 0),
          drawn: st.drawn + (isDraw ? 1 : 0),
          lost: st.lost + (isLoss ? 1 : 0),
          goalsFor: st.goalsFor + homeScore,
          goalsAgainst: st.goalsAgainst + awayScore,
          goalDifference: st.goalDifference + (homeScore - awayScore),
          points: st.points + pts,
          form: [...st.form.slice(-4), formChar],
        };
      }
      if (st.clubId === fixture.awayClubId) {
        const isWin = awayScore > homeScore;
        const isDraw = homeScore === awayScore;
        const isLoss = awayScore < homeScore;
        const pts = isWin ? 3 : isDraw ? 1 : 0;
        const formChar: 'W' | 'D' | 'L' = isWin ? 'W' : isDraw ? 'D' : 'L';
        return {
          ...st,
          played: st.played + 1,
          won: st.won + (isWin ? 1 : 0),
          drawn: st.drawn + (isDraw ? 1 : 0),
          lost: st.lost + (isLoss ? 1 : 0),
          goalsFor: st.goalsFor + awayScore,
          goalsAgainst: st.goalsAgainst + homeScore,
          goalDifference: st.goalDifference + (awayScore - homeScore),
          points: st.points + pts,
          form: [...st.form.slice(-4), formChar],
        };
      }
      return st;
    });

    updatedStandings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
    updatedStandings.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    // Also simulate all remaining AI matches in this round!
    const roundSim = simulatePendingAIMatches(
      updatedFixtures,
      updatedStandings,
      allClubs,
      allPlayers,
      userClubId,
      { roundNumber: fixture.round }
    );
    const finalFixtures = roundSim.updatedFixtures;
    const finalStandings = roundSim.updatedStandings;
    setFixtures(finalFixtures);
    setStandings(finalStandings);

    // C. Update Player Stats, Injuries & Suspensions
    const injuryEvents = events.filter((ev) => ev.type === 'INJURY');
    const injuryMap = new Map(injuryEvents.map((ev) => [ev.playerId, ev]));
    const redCardPlayerIds = new Set(events.filter((ev) => ev.type === 'RED_CARD').map((ev) => ev.playerId));

    const updateMap = playerUpdates && playerUpdates.length > 0
      ? new Map(playerUpdates.map((u) => [u.playerId, u]))
      : new Map();

    const isMatchClub = (clubId?: string) => clubId === fixture.homeClubId || clubId === fixture.awayClubId;

    const updatedPlayers = allPlayers.map((p) => {
      const u = updateMap.get(p.id);

      // Handle players who were ALREADY suspended from this fixture's clubs and did not play
      if (!u && isMatchClub(p.clubId) && p.isSuspended) {
        return processMatchSuspension(p, 1);
      }

      if (!u) return p;

      const currentStats = p.seasonStats || {
        appearances: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        cleanSheets: 0,
        averageRating: 7.0,
      };

      const totalApps = currentStats.appearances + 1;
      const totalRating = (currentStats.averageRating * currentStats.appearances + u.matchRating) / totalApps;
      const newYellows = currentStats.yellowCards + u.yellowCards;
      const newReds = currentStats.redCards + u.redCards;

      // Match injury determination
      let isInjured = p.isInjured;
      let injuryDetails = p.injuryDetails;
      const injEvent = injuryMap.get(p.id);
      if (injEvent) {
        const isSevere = injEvent.description?.includes('sakatlanarak oyuna devam edemiyor') || injEvent.description?.includes('SEVERE');
        isInjured = true;
        injuryDetails = {
          type: isSevere ? 'Ciddi Bağ / Kas Yaralanması' : 'Hafif Darbe & Adale Zorlanması',
          daysRemaining: isSevere ? 14 : 5,
          severity: isSevere ? 'SEVERE' : 'LIGHT',
        };
      }

      // Suspension determination (Red card or 4 yellow card accumulation)
      let isSuspended = p.isSuspended;
      let suspensionDetails = p.suspensionDetails;
      if (redCardPlayerIds.has(p.id) || u.redCards > 0) {
        isSuspended = true;
        suspensionDetails = {
          reason: 'Kırmızı Kart Cezası',
          matchesRemaining: 1,
        };
      } else if (newYellows >= 4 && newYellows % 4 === 0 && u.yellowCards > 0) {
        isSuspended = true;
        suspensionDetails = {
          reason: `Sarı Kart Cezası (${newYellows}. Sarı Kart)`,
          matchesRemaining: 1,
        };
      }

      return {
        ...p,
        fitness: Math.min(100, Math.max(30, Math.round(u.fitness))),
        form: Number(((p.form * 4 + u.matchRating) / 5).toFixed(1)),
        isInjured,
        injuryDetails,
        isSuspended,
        suspensionDetails,
        seasonStats: {
          appearances: totalApps,
          goals: currentStats.goals + u.goals,
          assists: currentStats.assists + u.assists,
          yellowCards: newYellows,
          redCards: newReds,
          cleanSheets: currentStats.cleanSheets + (p.position === 'GK' && (fixture.homeClubId === p.clubId ? awayScore === 0 : homeScore === 0) ? 1 : 0),
          averageRating: Number(totalRating.toFixed(2)),
        },
      };
    });

    setAllPlayers(updatedPlayers);

    persist(
      currentDate,
      seasonYear,
      seasonStage,
      trainingIntensity,
      updatedPlayers,
      tactics,
      finalStandings,
      finalFixtures
    );
  };

  // 4. Start Next Season
  const startNextSeasonRoll = () => {
    const rolled = startNewSeason(seasonYear, allClubs, allPlayers, standings, userClubId, finances);
    const nextSeasonNum = seasonNumber + 1;
    setSeasonNumber(nextSeasonNum);

    const nextContractYears = Math.max(0, managerContract.yearsLeft - 1);
    let updatedContract: ManagerContract = {
      ...managerContract,
      yearsLeft: nextContractYears,
    };

    let nextInbox = [rolled.boardMessage, ...inboxMessages];

    // If manager contract has 1 year or less left, board makes an extension offer
    if (nextContractYears <= 1) {
      const offerSalary = Math.round(managerContract.weeklySalary * 1.15);
      updatedContract = {
        ...updatedContract,
        status: 'OFFERED',
        offerYears: 2,
        offerSalary,
      };

      const offerMsg: InboxMessage = {
        id: `msg-manager-contract-${Date.now()}`,
        clubId: userClubId,
        senderName: `${userClub.name} Yönetim Kurulu`,
        senderRole: 'Kulüp Başkanı',
        subject: 'Sözleşme Uzatma Teklifi (2 Yıllık)',
        preview: `Yönetim kurulumuz sözleşmenizi 2 yıl uzatmayı teklif ediyor (€${offerSalary.toLocaleString('tr-TR')}/hf).`,
        body: `Sayın Menajer,\n\nKulübümüzle olan sözleşmenizin son yılına girmiş bulunmaktasınız. Takımımızın gelişimi ve hedeflerimiz doğrultusunda, sözleşmenizi 2 yıl daha uzatmayı ve haftalık maaşınızı €${offerSalary.toLocaleString('tr-TR')} olarak belirlemeyi teklif ediyoruz.\n\nDashboard veya Gelen Kutusu üzerinden teklifimizi kabul edebilir veya reddedebilirsiniz.`,
        date: rolled.newCurrentDate,
        category: 'BOARD',
        priority: 'HIGH',
        isRead: false,
        actionable: true,
      };
      nextInbox = [offerMsg, ...nextInbox];
    }

    setManagerContract(updatedContract);
    setSeasonYear(rolled.newSeasonYear);
    setCurrentDate(rolled.newCurrentDate);
    setSeasonStage('PRE_SEASON');
    setFixtures(rolled.newFixtures);
    setStandings(rolled.newStandings);
    setAllPlayers(rolled.resetPlayers);
    setAllClubs(rolled.updatedClubs);
    setFinances(rolled.newFinances);
    setCareerHistory([...rolled.archivedHistory, ...careerHistory]);
    setInboxMessages(nextInbox);

    persist(
      rolled.newCurrentDate,
      rolled.newSeasonYear,
      'PRE_SEASON',
      trainingIntensity,
      rolled.resetPlayers,
      tactics,
      rolled.newStandings,
      rolled.newFixtures,
      nextInbox,
      [],
      shortlistIds,
      rolled.newFinances,
      [],
      [...rolled.archivedHistory, ...careerHistory],
      activeNegotiations,
      transferHistory,
      futureCommitments,
      scouts,
      scoutingAssignments,
      scoutingKnowledge,
      scoutingReports,
      playerHiddenProfiles,
      activeLoans,
      academyFacilities,
      youthPlayers,
      difficulty,
      leagueSize,
      rolled.updatedClubs
    );
  };

  // 5. Reset Entire Career Save
  const resetEntireCareer = () => {
    clearCareerSave();
    const initialUniverse = generateCareerPlayerUniverse(MOCK_CLUBS);
    const kalyonPlayers = initialUniverse.filter((p) => p.clubId === 'kalyon-doruk');
    const initialScouts = generateClubScouts('kalyon-doruk', 80);
    const initialFreeScouts = generateFreeAgentScouts();
    const initialProfiles: Record<string, PlayerHiddenProfile> = {};
    for (const p of initialUniverse) {
      initialProfiles[p.id] = generatePlayerHiddenProfile(p);
    }
    const initialAcademy = initializeClubAcademy(MOCK_CLUBS[0], '2026/27');

    setCurrentDate('2026-08-01');
    setSeasonYear('2026/27');
    setSeasonStage('PRE_SEASON');
    setSeasonNumber(1);
    setCareerEconomyVersion(2);
    setManagerContract({ yearsLeft: 2, weeklySalary: 45000, status: 'ACTIVE' });
    setTrainingIntensityState('Normal');
    setAllClubs(MOCK_CLUBS);
    setAllPlayers(initialUniverse);
    setTactics(generateCareerTactics('kalyon-doruk', kalyonPlayers, '4-2-3-1'));
    setStandings(
      MOCK_CLUBS.map((c, i) => ({
        rank: i + 1,
        clubId: c.id,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        form: [],
      }))
    );
    setFixtures(generateSeasonFixtures(MOCK_CLUBS, '2026/27', '2026-08-15'));
    setInboxMessages(MOCK_INBOX_MESSAGES);
    setTransferOffers(MOCK_TRANSFER_OFFERS);
    setShortlistIds(MOCK_SHORTLIST_IDS);
    setFinances(MOCK_FINANCES);
    setNewsFeed([]);
    setCareerHistory([]);
    setActiveNegotiations([]);
    setTransferHistory([]);
    setFutureCommitments([]);
    setScouts(initialScouts);
    setFreeAgentScouts(initialFreeScouts);
    setScoutingAssignments([]);
    setScoutingKnowledge({});
    setScoutingReports([]);
    setPlayerHiddenProfiles(initialProfiles);
    setActiveLoans([]);
    setAcademyFacilities(initialAcademy);
    setYouthPlayers([]);
    setHasActiveCareer(false);
    setHasSavedCareer(false);
  };

  // 6. Start Brand New Career
  const startNewCareer = (setup: import('@/lib/career/types').CareerSetupConfig) => {
    const chosenClubId = setup.selectedClubId;
    const managerName = setup.managerProfile.name || 'Menajer';
    const diff = setup.managerProfile.difficulty || 'Standart';
    const lSize = setup.leagueSize || 10;

    setDifficulty(diff);
    setLeagueSize(lSize);

    // Filter clubs to match selected league size
    const clubsInLeague = MOCK_CLUBS.slice(0, lSize);

    // Difficulty budget adjustments
    const budgetMultiplier = diff === 'Rahat' ? 1.25 : diff === 'Zorlu' ? 0.85 : 1.0;

    const baseClubs = clubsInLeague.map((c) => {
      if (c.id === chosenClubId) {
        return {
          ...c,
          managerName,
          transferBudget: Math.round(c.transferBudget * budgetMultiplier),
          balance: Math.round(c.balance * (diff === 'Rahat' ? 1.2 : diff === 'Zorlu' ? 0.9 : 1.0)),
        };
      }
      return c;
    });

    const targetClub = baseClubs.find((c) => c.id === chosenClubId) || baseClubs[0];
    const initialUniverse = generateCareerPlayerUniverse(baseClubs);
    const userSquad = initialUniverse.filter((p) => p.clubId === chosenClubId);
    const initialTacts = generateCareerTactics(chosenClubId, userSquad, '4-2-3-1');
    const initialStandings: LeagueStanding[] = baseClubs.map((c, i) => ({
      rank: i + 1,
      clubId: c.id,
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

    const startDate = setup.startingDate || '2026-08-01';
    const initialFixtures = generateSeasonFixtures(baseClubs, '2026/27', '2026-08-15');

    const leagueTitle = lSize === 18 ? 'Alveria Süper Ligi' : lSize === 14 ? 'Alveria Premier Ligi' : 'Alveria Elit Ligi';

    const welcomeMsg: InboxMessage = {
      id: `msg-welcome-${Date.now()}`,
      clubId: chosenClubId,
      senderName: `${targetClub.name} Yönetim Kurulu`,
      senderRole: 'Kulüp Başkanı',
      subject: `Hoş Geldiniz, ${managerName}!`,
      preview: `${targetClub.name} teknik direktörlük görevine hoş geldiniz. Kulübümüzün hedefleri...`,
      body: `Sayın ${managerName},\n\n${targetClub.name} teknik direktörlük görevine hoş geldiniz. Kulübümüzün zengin geçmişi ve tutkulu taraftarları adına sizinle çalışmaktan büyük onur duyuyoruz.\n\nBu sezonki öncelikli hedefimiz ${leagueTitle}'nde (${lSize} Kulüp) üst sıralarda yer almak ve kulübümüzü zirveye taşımaktır. Yönetim kurulumuz transfer bütçesi (€${(targetClub.transferBudget / 1000000).toFixed(1)}M) ve altyapı olanaklarıyla her zaman arkanızda olacaktır.\n\nBaşarılar dileriz.`,
      date: startDate,
      category: 'BOARD',
      priority: 'HIGH',
      isRead: false,
    };

    const initialFinances: FinanceSummary = {
      clubBalance: targetClub.balance,
      transferBudget: targetClub.transferBudget,
      wageBudget: targetClub.wageBudget,
      weeklyWages: targetClub.weeklyWageExpense,
      incomeCategories: {
        matchdayTickets: 3000000,
        sponsorships: 9000000,
        broadcasting: 14000000,
        merchandising: 2000000,
        playerSales: 0,
      },
      expenseCategories: {
        playerWages: targetClub.weeklyWageExpense * 52,
        staffWages: 1800000,
        scoutingNetwork: 600000,
        stadiumMaintenance: 1100000,
        academyYouth: 1200000,
        playerSignings: 0,
      },
      monthlyHistory: [
        { month: 'Haziran 2026', income: 6000000, expense: 4000000, net: 2000000 },
        { month: 'Temmuz 2026', income: 5500000, expense: 3800000, net: 1700000 },
        { month: 'Ağustos 2026', income: 8000000, expense: 3500000, net: 4500000 },
      ],
    };

    const initialScouts = generateClubScouts(chosenClubId, targetClub.reputation);
    const initialFreeScouts = generateFreeAgentScouts();
    const initialProfiles: Record<string, PlayerHiddenProfile> = {};
    for (const p of initialUniverse) {
      initialProfiles[p.id] = generatePlayerHiddenProfile(p);
    }
    const initialAcademy = initializeClubAcademy(targetClub, '2026/27');

    const initialContract: ManagerContract = {
      yearsLeft: 2,
      weeklySalary: 45000,
      status: 'ACTIVE',
    };

    setUserClubId(chosenClubId);
    setCurrentDate(startDate);
    setSeasonYear('2026/27');
    setSeasonStage('PRE_SEASON');
    setSeasonNumber(1);
    setCareerEconomyVersion(2);
    setManagerContract(initialContract);
    setTrainingIntensityState('Normal');
    setAllClubs(baseClubs);
    setAllPlayers(initialUniverse);
    setTactics(initialTacts);
    setStandings(initialStandings);
    setFixtures(initialFixtures);
    setInboxMessages([welcomeMsg]);
    setTransferOffers([]);
    setShortlistIds([]);
    setFinances(initialFinances);
    setNewsFeed([
      {
        id: `news-welcome-${Date.now()}`,
        date: startDate,
        headline: `${targetClub.name} Yeni Menajerini Açıkladı: ${managerName}`,
        content: `${targetClub.name} kulübü, takımın başına ${managerName} getirildiğini resmen duyurdu. Yeni menajer ilk antrenmanına bugün çıkacak.`,
        category: 'CLUB_NEWS',
        importance: 'HIGH',
        clubId: chosenClubId,
      },
    ]);
    setCareerHistory([]);
    setActiveNegotiations([]);
    setTransferHistory([]);
    setFutureCommitments([]);
    setScouts(initialScouts);
    setFreeAgentScouts(initialFreeScouts);
    setScoutingAssignments([]);
    setScoutingKnowledge({});
    setScoutingReports([]);
    setPlayerHiddenProfiles(initialProfiles);
    setActiveLoans([]);
    setAcademyFacilities(initialAcademy);
    setYouthPlayers([]);

    setHasActiveCareer(true);
    setHasSavedCareer(true);

    saveCareerState({
      saveVersion: 3,
      savedAt: new Date().toISOString(),
      seasonYear: '2026/27',
      seasonStage: 'PRE_SEASON',
      currentDate: startDate,
      userClubId: chosenClubId,
      trainingIntensity: 'Normal',
      difficulty: diff,
      leagueSize: lSize,
      clubs: baseClubs,
      players: initialUniverse,
      tactics: initialTacts,
      standings: initialStandings,
      fixtures: initialFixtures,
      inboxMessages: [welcomeMsg],
      transferOffers: [],
      shortlistIds: [],
      finances: initialFinances,
      newsFeed: [],
      careerHistory: [],
      activeNegotiations: [],
      transferHistory: [],
      futureCommitments: [],
      scouts: initialScouts,
      scoutingAssignments: [],
      scoutingKnowledge: {},
      scoutingReports: [],
      playerHiddenProfiles: initialProfiles,
      activeLoans: [],
      academyFacilities: initialAcademy,
      youthPlayers: [],
      managerContract: initialContract,
      seasonNumber: 1,
      careerEconomyVersion: 2,
      settings: {
        autoSave: true,
        defaultMatchSpeed: 1,
        debugMode: false,
      },
    });
  };

  // 7. Load Saved Career
  const loadExistingCareer = (): boolean => {
    try {
      const saved = loadCareerState();
      if (!saved) return false;

      setUserClubId(saved.userClubId || 'kalyon-doruk');
      setCurrentDate(saved.currentDate);
      setSeasonYear(saved.seasonYear);
      setSeasonStage(saved.seasonStage);
      setTrainingIntensityState(saved.trainingIntensity);
      setAllClubs(saved.clubs);
      setAllPlayers(saved.players);
      setTactics(saved.tactics);
      setStandings(saved.standings);
      setFixtures(saved.fixtures);
      setInboxMessages(saved.inboxMessages);
      setTransferOffers(saved.transferOffers);
      setShortlistIds(saved.shortlistIds);
      setFinances(saved.finances);
      setNewsFeed(saved.newsFeed || []);
      setCareerHistory(saved.careerHistory || []);
      if (saved.activeNegotiations) setActiveNegotiations(saved.activeNegotiations);
      if (saved.transferHistory) setTransferHistory(saved.transferHistory);
      if (saved.futureCommitments) setFutureCommitments(saved.futureCommitments);
      if (saved.scouts) setScouts(saved.scouts);
      if (saved.scoutingAssignments) setScoutingAssignments(saved.scoutingAssignments);
      if (saved.scoutingKnowledge) setScoutingKnowledge(saved.scoutingKnowledge);
      if (saved.scoutingReports) setScoutingReports(saved.scoutingReports);
      if (saved.playerHiddenProfiles) setPlayerHiddenProfiles(saved.playerHiddenProfiles);
      if (saved.activeLoans) setActiveLoans(saved.activeLoans);
      if (saved.academyFacilities) setAcademyFacilities(saved.academyFacilities);
      if (saved.youthPlayers) setYouthPlayers(saved.youthPlayers);

      setHasActiveCareer(true);
      setHasSavedCareer(true);
      return true;
    } catch {
      return false;
    }
  };


  // 6. Negotiation Engine Handlers
  const getNegotiationById = (id: string) => activeNegotiations.find((n) => n.id === id);
  const getNegotiationByPlayerId = (playerId: string) =>
    activeNegotiations.find((n) => n.playerId === playerId && n.stage !== 'COMPLETED' && n.stage !== 'FAILED');

  const startNegotiation = (playerId: string, isContractRenewal = false): ActiveNegotiation => {
    const existing = getNegotiationByPlayerId(playerId);
    if (existing) return existing;

    const targetPlayer = getPlayerById(playerId);
    if (!targetPlayer) throw new Error('Player not found');

    const sellerClub = targetPlayer.clubId === 'FREE_AGENT' ? undefined : getClubById(targetPlayer.clubId);

    const newNeg = createActiveNegotiation(
      targetPlayer,
      userClub,
      sellerClub,
      currentDate,
      isContractRenewal
    );

    const updated = [newNeg, ...activeNegotiations];
    setActiveNegotiations(updated);
    persist(currentDate, seasonYear, seasonStage, trainingIntensity, allPlayers, tactics, standings, fixtures, inboxMessages, transferOffers, shortlistIds, finances, newsFeed, careerHistory, updated);
    return newNeg;
  };

  const submitClubOffer = (negotiationId: string, offer: TransferOfferPackage): ClubNegotiationResponse => {
    const neg = getNegotiationById(negotiationId);
    if (!neg) throw new Error('Negotiation not found');

    const targetPlayer = getPlayerById(neg.playerId);
    const sellerClub = neg.sellerClubId ? getClubById(neg.sellerClubId) : undefined;
    if (!targetPlayer) throw new Error('Invalid party in negotiation');

    const response = evaluateClubTransferOffer(
      targetPlayer,
      sellerClub,
      userClub,
      offer,
      neg.clubPatience,
      currentDate
    );

    let updatedNeg: ActiveNegotiation = {
      ...neg,
      latestClubOffer: offer,
      clubStatus: response.status,
      clubPatience: response.patienceRemaining,
      lastUpdatedDate: currentDate,
    };

    if (response.counterOffer) {
      updatedNeg.latestClubDemand = response.counterOffer;
    }

    if (response.status === 'ACCEPTED') {
      updatedNeg.stage = 'PLAYER_NEGOTIATION';
    } else if (response.status === 'REJECTED' && response.patienceRemaining <= 0) {
      updatedNeg.stage = 'FAILED';
    }

    updatedNeg = addNegotiationLog(updatedNeg, {
      date: currentDate,
      sender: 'USER',
      senderName: userClub.name,
      text: `Kulübe teklif iletildi: Peşin €${offer.upfrontFee.toLocaleString('tr-TR')}, Taksit €${offer.installmentsFee.toLocaleString('tr-TR')}`,
      type: 'OFFER',
      clubOffer: offer,
    });

    updatedNeg = addNegotiationLog(updatedNeg, {
      date: currentDate,
      sender: 'CLUB',
      senderName: sellerClub?.name || 'Kulüp',
      text: response.feedbackMessage,
      type: response.status === 'ACCEPTED' ? 'ACCEPT' : response.status === 'COUNTER_OFFER' ? 'COUNTER' : 'REJECT',
      clubOffer: response.counterOffer,
    });

    const updatedNegs = activeNegotiations.map((n) => (n.id === negotiationId ? updatedNeg : n));
    setActiveNegotiations(updatedNegs);
    persist(currentDate, seasonYear, seasonStage, trainingIntensity, allPlayers, tactics, standings, fixtures, inboxMessages, transferOffers, shortlistIds, finances, newsFeed, careerHistory, updatedNegs);

    return response;
  };

  const submitContractOffer = (negotiationId: string, offer: ContractOfferPackage): PlayerNegotiationResponse => {
    const neg = getNegotiationById(negotiationId);
    if (!neg) throw new Error('Negotiation not found');

    const targetPlayer = getPlayerById(neg.playerId);
    const sellerClub = neg.sellerClubId ? getClubById(neg.sellerClubId) : undefined;
    if (!targetPlayer) throw new Error('Player not found');

    const response = evaluatePlayerContractOffer(
      targetPlayer,
      userClub,
      offer,
      neg.playerPatience,
      currentDate,
      neg.isContractRenewal
    );

    let updatedNeg: ActiveNegotiation = {
      ...neg,
      latestContractOffer: offer,
      playerStatus: response.status,
      playerPatience: response.patienceRemaining,
      lastUpdatedDate: currentDate,
    };

    if (response.counterOffer) {
      updatedNeg.latestContractDemand = response.counterOffer;
    }

    updatedNeg = addNegotiationLog(updatedNeg, {
      date: currentDate,
      sender: 'USER',
      senderName: userClub.name,
      text: `Sözleşme teklifi iletildi: Haftalık €${offer.wage.toLocaleString('tr-TR')}, ${offer.durationYears} yıl, Rol: ${offer.squadRole}`,
      type: 'OFFER',
      contractOffer: offer,
    });

    updatedNeg = addNegotiationLog(updatedNeg, {
      date: currentDate,
      sender: 'AGENT',
      senderName: targetPlayer.agent?.name || 'Temsilci',
      text: response.feedbackMessage,
      type: response.status === 'ACCEPTED' ? 'ACCEPT' : response.status === 'COUNTER_OFFER' ? 'COUNTER' : 'REJECT',
      contractOffer: response.counterOffer,
    });

    let newAllPlayers = allPlayers;
    let newAllClubs = allClubs;
    let newFinances = finances;
    let newCommitments = futureCommitments;
    let newHistory = transferHistory;
    let newInbox = inboxMessages;
    let newNews = newsFeed;

    if (response.status === 'ACCEPTED') {
      updatedNeg.stage = 'COMPLETED';

      const completionResult = executeTransferCompletion({
        player: targetPlayer,
        sellerClub,
        buyerClub: userClub,
        transferPackage: neg.latestClubOffer || { upfrontFee: 0, installmentsFee: 0, installmentsMonths: 12, bonuses: [] },
        contractPackage: offer,
        currentDate,
        seasonYear,
        buyerFinances: finances,
        sellerTactics: sellerClub ? getInitialTactics(sellerClub.id) : undefined,
        isContractRenewal: neg.isContractRenewal,
      });

      newAllPlayers = allPlayers.map((p) => (p.id === targetPlayer.id ? completionResult.updatedPlayer : p));
      newAllClubs = allClubs.map((c) => {
        if (c.id === userClub.id) return completionResult.updatedBuyerClub;
        if (sellerClub && c.id === sellerClub.id && completionResult.updatedSellerClub) {
          return completionResult.updatedSellerClub;
        }
        return c;
      });
      newFinances = completionResult.updatedBuyerFinances;
      newCommitments = [...completionResult.newCommitments, ...futureCommitments];
      newHistory = [completionResult.historyRecord, ...transferHistory];
      newInbox = [completionResult.inboxMessage, ...inboxMessages];
      if (completionResult.newsItem) {
        newNews = [completionResult.newsItem, ...newsFeed];
      }

      setAllPlayers(newAllPlayers);
      setAllClubs(newAllClubs);
      setFinances(newFinances);
      setFutureCommitments(newCommitments);
      setTransferHistory(newHistory);
      setInboxMessages(newInbox);
      setNewsFeed(newNews);
    } else if (response.status === 'REJECTED' && response.patienceRemaining <= 0) {
      updatedNeg.stage = 'FAILED';
    }

    const updatedNegs = activeNegotiations.map((n) => (n.id === negotiationId ? updatedNeg : n));
    setActiveNegotiations(updatedNegs);

    persist(
      currentDate,
      seasonYear,
      seasonStage,
      trainingIntensity,
      newAllPlayers,
      tactics,
      standings,
      fixtures,
      newInbox,
      transferOffers,
      shortlistIds,
      newFinances,
      newNews,
      careerHistory,
      updatedNegs,
      newHistory,
      newCommitments
    );

    return response;
  };

  const acceptClubCounterOffer = (negotiationId: string): ClubNegotiationResponse => {
    const neg = getNegotiationById(negotiationId);
    if (!neg || !neg.latestClubDemand) throw new Error('Counter offer not available');
    return submitClubOffer(negotiationId, neg.latestClubDemand);
  };

  const acceptPlayerCounterOffer = (negotiationId: string): PlayerNegotiationResponse => {
    const neg = getNegotiationById(negotiationId);
    if (!neg || !neg.latestContractDemand) throw new Error('Counter offer not available');
    return submitContractOffer(negotiationId, neg.latestContractDemand);
  };

  const withdrawNegotiation = (negotiationId: string) => {
    const negIndex = activeNegotiations.findIndex((n) => n.id === negotiationId);
    if (negIndex === -1) return;

    let updatedNeg: ActiveNegotiation = {
      ...activeNegotiations[negIndex],
      stage: 'FAILED',
      clubStatus: 'WITHDRAWN',
      playerStatus: 'WITHDRAWN',
      lastUpdatedDate: currentDate,
    };

    updatedNeg = addNegotiationLog(updatedNeg, {
      date: currentDate,
      sender: 'USER',
      senderName: userClub.name,
      text: 'Transfer görüşmelerinden resmi olarak çekilindi.',
      type: 'TERMINATE',
    });

    const updatedNegs = [...activeNegotiations];
    updatedNegs[negIndex] = updatedNeg;
    setActiveNegotiations(updatedNegs);
    persist(currentDate, seasonYear, seasonStage, trainingIntensity, allPlayers, tactics, standings, fixtures, inboxMessages, transferOffers, shortlistIds, finances, newsFeed, careerHistory, updatedNegs, transferHistory, futureCommitments);
  };

  // 7. Scouting, Fog of War, Loans & Youth Actions
  const assignScout = (
    scoutId: string,
    playerId: string,
    durationDays: AssignmentDurationDays,
    regionId?: ScoutingRegionId
  ): { success: boolean; message: string; assignment?: ScoutAssignment } => {
    const scout = scouts.find((s) => s.id === scoutId);
    if (!scout) return { success: false, message: 'Gözlemci bulunamadı.' };
    const player = allPlayers.find((p) => p.id === playerId);
    if (!player) return { success: false, message: 'Hedef oyuncu bulunamadı.' };

    const targetType = regionId ? 'REGION' : 'PLAYER';
    const assignRes = createScoutingAssignment(
      scout,
      targetType,
      durationDays,
      currentDate,
      userClubId,
      player,
      regionId
    );

    if (!assignRes.success || !assignRes.assignment) {
      return { success: false, message: assignRes.message };
    }

    const updatedScouts = scouts.map((s) => (s.id === scoutId ? { ...s, activeAssignmentId: assignRes.assignment!.id } : s));
    const updatedAssignments = [assignRes.assignment, ...scoutingAssignments];

    setScouts(updatedScouts);
    setScoutingAssignments(updatedAssignments);

    persist(
      currentDate,
      seasonYear,
      seasonStage,
      trainingIntensity,
      allPlayers,
      tactics,
      standings,
      fixtures,
      inboxMessages,
      transferOffers,
      shortlistIds,
      finances,
      newsFeed,
      careerHistory,
      activeNegotiations,
      transferHistory,
      futureCommitments,
      updatedScouts,
      updatedAssignments
    );

    return { success: true, message: assignRes.message, assignment: assignRes.assignment };
  };

  const cancelScoutAssignment = (assignmentId: string) => {
    const res = cancelScoutingAssignment(scoutingAssignments, scouts, assignmentId);
    setScoutingAssignments(res.updatedAssignments);
    setScouts(res.updatedScouts);
    persist(
      currentDate,
      seasonYear,
      seasonStage,
      trainingIntensity,
      allPlayers,
      tactics,
      standings,
      fixtures,
      inboxMessages,
      transferOffers,
      shortlistIds,
      finances,
      newsFeed,
      careerHistory,
      activeNegotiations,
      transferHistory,
      futureCommitments,
      res.updatedScouts,
      res.updatedAssignments
    );
  };

  const hireScout = (scoutId: string): { success: boolean; message: string } => {
    const scout = freeAgentScouts.find((s) => s.id === scoutId);
    if (!scout) return { success: false, message: 'Gözlemci bulunamadı.' };

    if (finances.wageBudget < finances.weeklyWages + scout.wage) {
      return { success: false, message: 'Maaş bütçesi bu gözlemci için yetersiz.' };
    }

    const hiredScout: Scout = { ...scout, clubId: userClubId };
    const updatedScouts = [...scouts, hiredScout];
    const updatedFreeAgents = freeAgentScouts.filter((s) => s.id !== scoutId);

    setScouts(updatedScouts);
    setFreeAgentScouts(updatedFreeAgents);

    persist(
      currentDate,
      seasonYear,
      seasonStage,
      trainingIntensity,
      allPlayers,
      tactics,
      standings,
      fixtures,
      inboxMessages,
      transferOffers,
      shortlistIds,
      finances,
      newsFeed,
      careerHistory,
      activeNegotiations,
      transferHistory,
      futureCommitments,
      updatedScouts
    );

    return { success: true, message: `${scout.firstName} ${scout.lastName} kulübümüz scout ekibine katıldı.` };
  };

  const fireScout = (scoutId: string) => {
    const scout = scouts.find((s) => s.id === scoutId);
    if (!scout) return;

    let updatedAssignments = scoutingAssignments;
    if (scout.activeAssignmentId) {
      updatedAssignments = scoutingAssignments.filter((a) => a.id !== scout.activeAssignmentId);
    }

    const updatedScouts = scouts.filter((s) => s.id !== scoutId);
    const freeScout: Scout = { ...scout, clubId: 'FREE_AGENT', activeAssignmentId: undefined };
    const updatedFreeAgents = [freeScout, ...freeAgentScouts];

    setScouts(updatedScouts);
    setFreeAgentScouts(updatedFreeAgents);
    setScoutingAssignments(updatedAssignments);

    persist(
      currentDate,
      seasonYear,
      seasonStage,
      trainingIntensity,
      allPlayers,
      tactics,
      standings,
      fixtures,
      inboxMessages,
      transferOffers,
      shortlistIds,
      finances,
      newsFeed,
      careerHistory,
      activeNegotiations,
      transferHistory,
      futureCommitments,
      updatedScouts,
      updatedAssignments
    );
  };

  const submitLoanOffer = (playerId: string, offer: LoanOfferPackage): LoanNegotiationResponse => {
    const player = allPlayers.find((p) => p.id === playerId);
    if (!player) {
      return { decision: 'REJECTED', feedback: 'Oyuncu bulunamadı.', patienceRemaining: 0 };
    }
    const parentClub = allClubs.find((c) => c.id === player.clubId);
    if (!parentClub) {
      return { decision: 'REJECTED', feedback: 'Kulüp bulunamadı.', patienceRemaining: 0 };
    }

    const evalRes = evaluateLoanOffer({
      player,
      parentClub,
      borrowerClub: userClub,
      offerPackage: offer,
      borrowerFinances: finances,
    });

    if (evalRes.decision === 'ACCEPTED') {
      const execRes = executeLoanOfferAcceptance({
        player,
        parentClub,
        borrowerClub: userClub,
        offerPackage: offer,
        currentDate,
        buyerFinances: finances,
      });

      const updatedPlayers = allPlayers.map((p) => (p.id === player.id ? execRes.updatedPlayer : p));
      const updatedLoans = [execRes.loanAgreement, ...activeLoans];
      const updatedInbox = [execRes.inboxMessage, ...inboxMessages];
      const updatedNews = [execRes.newsItem, ...newsFeed];

      setAllPlayers(updatedPlayers);
      setFinances(execRes.updatedFinances);
      setActiveLoans(updatedLoans);
      setInboxMessages(updatedInbox);
      setNewsFeed(updatedNews);

      persist(
        currentDate,
        seasonYear,
        seasonStage,
        trainingIntensity,
        updatedPlayers,
        tactics,
        standings,
        fixtures,
        updatedInbox,
        transferOffers,
        shortlistIds,
        execRes.updatedFinances,
        updatedNews,
        careerHistory,
        activeNegotiations,
        transferHistory,
        futureCommitments,
        scouts,
        scoutingAssignments,
        scoutingKnowledge,
        scoutingReports,
        playerHiddenProfiles,
        updatedLoans
      );
    }

    return evalRes;
  };

  const recallLoan = (loanAgreementId: string): { success: boolean; message: string } => {
    const loan = activeLoans.find((l) => l.id === loanAgreementId);
    if (!loan) return { success: false, message: 'Kiralık anlaşması bulunamadı.' };

    const player = allPlayers.find((p) => p.id === loan.playerId);
    if (!player) return { success: false, message: 'Oyuncu bulunamadı.' };

    const res = recallLoanPlayer(loan, player, currentDate, userClubId);
    if (!res.success) return { success: false, message: res.message };

    const updatedPlayers = allPlayers.map((p) => (p.id === player.id ? res.updatedPlayer : p));
    const updatedLoans = activeLoans.map((l) => (l.id === loan.id ? res.updatedLoan : l));
    const updatedInbox = [res.inboxMessage, ...inboxMessages];

    setAllPlayers(updatedPlayers);
    setActiveLoans(updatedLoans);
    setInboxMessages(updatedInbox);

    persist(
      currentDate,
      seasonYear,
      seasonStage,
      trainingIntensity,
      updatedPlayers,
      tactics,
      standings,
      fixtures,
      updatedInbox,
      transferOffers,
      shortlistIds,
      finances,
      newsFeed,
      careerHistory,
      activeNegotiations,
      transferHistory,
      futureCommitments,
      scouts,
      scoutingAssignments,
      scoutingKnowledge,
      scoutingReports,
      playerHiddenProfiles,
      updatedLoans
    );

    return { success: true, message: res.message };
  };

  const exerciseLoanBuyOption = (loanAgreementId: string): { success: boolean; message: string } => {
    const loan = activeLoans.find((l) => l.id === loanAgreementId);
    if (!loan) return { success: false, message: 'Kiralık anlaşması bulunamadı.' };

    const player = allPlayers.find((p) => p.id === loan.playerId);
    if (!player) return { success: false, message: 'Oyuncu bulunamadı.' };

    const res = exerciseBuyOption(loan, player, finances, currentDate);
    if (!res.success) return { success: false, message: res.message };

    const updatedPlayers = allPlayers.map((p) => (p.id === player.id ? res.updatedPlayer : p));
    const updatedLoans = activeLoans.map((l) => (l.id === loan.id ? res.updatedLoan : l));
    const updatedInbox = [res.inboxMessage, ...inboxMessages];
    const updatedNews = [res.newsItem, ...newsFeed];

    setAllPlayers(updatedPlayers);
    setFinances(res.updatedFinances);
    setActiveLoans(updatedLoans);
    setInboxMessages(updatedInbox);
    setNewsFeed(updatedNews);

    persist(
      currentDate,
      seasonYear,
      seasonStage,
      trainingIntensity,
      updatedPlayers,
      tactics,
      standings,
      fixtures,
      updatedInbox,
      transferOffers,
      shortlistIds,
      res.updatedFinances,
      updatedNews,
      careerHistory,
      activeNegotiations,
      transferHistory,
      futureCommitments,
      scouts,
      scoutingAssignments,
      scoutingKnowledge,
      scoutingReports,
      playerHiddenProfiles,
      updatedLoans
    );

    return { success: true, message: res.message };
  };

  const promoteYouthPlayer = (youthPlayerId: string): { success: boolean; message: string; player?: Player } => {
    const yPlayer = youthPlayers.find((yp) => yp.id === youthPlayerId);
    if (!yPlayer) return { success: false, message: 'Altyapı oyuncusu bulunamadı.' };

    const res = promoteYouthPlayerToSenior(yPlayer, userClubId, currentDate);
    const updatedYouth = youthPlayers.filter((yp) => yp.id !== youthPlayerId);
    const updatedAllPlayers = [res.seniorPlayer, ...allPlayers];
    const updatedInbox = [res.inboxMessage, ...inboxMessages];
    const updatedNews = [res.newsItem, ...newsFeed];

    setYouthPlayers(updatedYouth);
    setAllPlayers(updatedAllPlayers);
    setInboxMessages(updatedInbox);
    setNewsFeed(updatedNews);

    persist(
      currentDate,
      seasonYear,
      seasonStage,
      trainingIntensity,
      updatedAllPlayers,
      tactics,
      standings,
      fixtures,
      updatedInbox,
      transferOffers,
      shortlistIds,
      finances,
      updatedNews,
      careerHistory,
      activeNegotiations,
      transferHistory,
      futureCommitments,
      scouts,
      scoutingAssignments,
      scoutingKnowledge,
      scoutingReports,
      playerHiddenProfiles,
      activeLoans,
      academyFacilities,
      updatedYouth
    );

    return { success: true, message: `${res.seniorPlayer.firstName} ${res.seniorPlayer.lastName} A Takıma terfi ettirildi.`, player: res.seniorPlayer };
  };

  const upgradeAcademy = (facilityType: 'academyLevel' | 'youthCoachingQuality' | 'youthRecruitmentNetwork'): { success: boolean; message: string } => {
    const res = upgradeAcademyFacility(academyFacilities, finances.clubBalance, facilityType);
    if (!res.success) return { success: false, message: res.message };

    const updatedFinances: FinanceSummary = {
      ...finances,
      clubBalance: finances.clubBalance - res.cost,
    };

    setAcademyFacilities(res.updatedFacility);
    setFinances(updatedFinances);

    persist(
      currentDate,
      seasonYear,
      seasonStage,
      trainingIntensity,
      allPlayers,
      tactics,
      standings,
      fixtures,
      inboxMessages,
      transferOffers,
      shortlistIds,
      updatedFinances,
      newsFeed,
      careerHistory,
      activeNegotiations,
      transferHistory,
      futureCommitments,
      scouts,
      scoutingAssignments,
      scoutingKnowledge,
      scoutingReports,
      playerHiddenProfiles,
      activeLoans,
      res.updatedFacility,
      youthPlayers
    );

    return { success: true, message: res.message };
  };

  const getPlayerKnowledge = (playerId: string): { level: KnowledgeLevel; percentage: number } => {
    const player = allPlayers.find((p) => p.id === playerId);
    if (!player) return { level: 0, percentage: 0 };
    const record = getScoutingKnowledge(scoutingKnowledge, player, userClubId);
    return { level: record.knowledgeLevel, percentage: record.percentage };
  };

  const getMaskedPlayer = (player: Player): MaskedPlayerView => {
    const kn = getPlayerKnowledge(player.id);
    const report = scoutingReports.find((r) => r.playerId === player.id);
    const hidden = playerHiddenProfiles[player.id];
    return getMaskedPlayerView(player, userClubId, kn.level, kn.percentage, report, hidden);
  };

  // Tactics & Lineup Actions
  const setFormation = (formation: Formation) => {
    const userSquad = allPlayers.filter((p) => p.clubId === userClubId);
    const updated = generateCareerTactics(userClubId, userSquad, formation);
    updated.settings = tactics.settings;
    setTactics(updated);
    persist(currentDate, seasonYear, seasonStage, trainingIntensity, allPlayers, updated);
  };

  const autoAssignTactics = () => {
    const userSquad = allPlayers.filter((p) => p.clubId === userClubId);
    const updated = generateCareerTactics(userClubId, userSquad, tactics.formation || '4-2-3-1');
    updated.settings = tactics.settings;
    setTactics(updated);
    persist(currentDate, seasonYear, seasonStage, trainingIntensity, allPlayers, updated);
  };

  const respondToManagerContractOffer = (accept: boolean) => {
    if (managerContract.status !== 'OFFERED') return;

    if (accept) {
      const addedYears = managerContract.offerYears || 2;
      const newSalary = managerContract.offerSalary || managerContract.weeklySalary;
      const updatedContract: ManagerContract = {
        yearsLeft: managerContract.yearsLeft + addedYears,
        weeklySalary: newSalary,
        status: 'ACTIVE',
      };
      setManagerContract(updatedContract);

      const acceptanceMsg: InboxMessage = {
        id: `msg-contract-accepted-${Date.now()}`,
        clubId: userClubId,
        senderName: `${userClub.name} Yönetim Kurulu`,
        senderRole: 'Kulüp Başkanı',
        subject: 'Sözleşme Uzatması İmzalandı!',
        preview: `Teknik direktörlük sözleşmeniz ${addedYears} yıl uzatıldı.`,
        body: `Sayın Menajer,\n\nKulübümüzle olan sözleşmenizi ${addedYears} yıl daha uzattığınız için büyük mutluluk duyuyoruz. Yeni haftalık maaşınız: €${newSalary.toLocaleString('tr-TR')}.\n\nBirlikte nice başarılara ve zaferlere!`,
        date: currentDate,
        category: 'BOARD',
        priority: 'HIGH',
        isRead: false,
      };
      const nextInbox = [acceptanceMsg, ...inboxMessages];
      setInboxMessages(nextInbox);
      persist(currentDate, seasonYear, seasonStage, trainingIntensity, allPlayers, tactics, standings, fixtures, nextInbox);
    } else {
      const updatedContract: ManagerContract = {
        ...managerContract,
        status: 'ACTIVE',
        offerYears: undefined,
        offerSalary: undefined,
      };
      setManagerContract(updatedContract);

      const declineMsg: InboxMessage = {
        id: `msg-contract-declined-${Date.now()}`,
        clubId: userClubId,
        senderName: `${userClub.name} Yönetim Kurulu`,
        senderRole: 'Kulüp Başkanı',
        subject: 'Sözleşme Teklifi Reddedildi',
        preview: 'Sözleşme uzatma teklifini geri çevirdiniz.',
        body: `Sayın Menajer,\n\nSözleşme uzatma teklifimizi geri çevirdiğinizi üzüntüyle öğrendik. Mevcut sözleşmeniz devam etmektedir. Sezon sonunda tekrar değerlendireceğiz.`,
        date: currentDate,
        category: 'BOARD',
        priority: 'NORMAL',
        isRead: false,
      };
      const nextInbox = [declineMsg, ...inboxMessages];
      setInboxMessages(nextInbox);
      persist(currentDate, seasonYear, seasonStage, trainingIntensity, allPlayers, tactics, standings, fixtures, nextInbox);
    }
  };

  const updateTacticalSettings = (settings: Partial<TacticalSettings>) => {
    const updated: ClubTactics = {
      ...tactics,
      settings: {
        ...tactics.settings,
        ...settings,
      },
    };
    setTactics(updated);
    persist(currentDate, seasonYear, seasonStage, trainingIntensity, allPlayers, updated);
  };

  const swapLineupPlayer = (slotId: number, newPlayerId: string) => {
    const existingSlotIndex = tactics.lineup.findIndex((s) => s.slotId === slotId);
    if (existingSlotIndex === -1) return;

    const oldPlayerId = tactics.lineup[existingSlotIndex].playerId;
    const newLineup = [...tactics.lineup];
    newLineup[existingSlotIndex] = {
      ...newLineup[existingSlotIndex],
      playerId: newPlayerId,
    };

    let newSubs = tactics.substitutes.filter((id) => id !== newPlayerId);
    let newReserves = tactics.reserves.filter((id) => id !== newPlayerId);

    if (oldPlayerId) {
      newSubs = [oldPlayerId, ...newSubs];
    }

    const updated: ClubTactics = {
      ...tactics,
      lineup: newLineup,
      substitutes: newSubs,
      reserves: newReserves,
    };
    setTactics(updated);
    persist(currentDate, seasonYear, seasonStage, trainingIntensity, allPlayers, updated);
  };

  const swapPitchSlots = (fromSlotId: number, toSlotId: number) => {
    const fromIndex = tactics.lineup.findIndex((s) => s.slotId === fromSlotId);
    const toIndex = tactics.lineup.findIndex((s) => s.slotId === toSlotId);
    if (fromIndex === -1 || toIndex === -1) return;

    const newLineup = [...tactics.lineup];
    const tempPlayerId = newLineup[fromIndex].playerId;
    newLineup[fromIndex].playerId = newLineup[toIndex].playerId;
    newLineup[toIndex].playerId = tempPlayerId;

    const updated: ClubTactics = {
      ...tactics,
      lineup: newLineup,
    };
    setTactics(updated);
    persist(currentDate, seasonYear, seasonStage, trainingIntensity, allPlayers, updated);
  };

  const markMessageAsRead = (id: string) => {
    const updated = inboxMessages.map((m) => (m.id === id ? { ...m, isRead: true } : m));
    setInboxMessages(updated);
    persist(currentDate, seasonYear, seasonStage, trainingIntensity, allPlayers, tactics, standings, fixtures, updated);
  };

  const deleteMessage = (id: string) => {
    const updated = inboxMessages.filter((m) => m.id !== id);
    setInboxMessages(updated);
    persist(currentDate, seasonYear, seasonStage, trainingIntensity, allPlayers, tactics, standings, fixtures, updated);
  };

  const respondToTransferOffer = (offerId: string, accept: boolean) => {
    const offer = transferOffers.find((o) => o.id === offerId);
    if (!offer) return;

    const updatedOffers = transferOffers.map((o) =>
      o.id === offerId ? { ...o, status: (accept ? 'ACCEPTED' : 'REJECTED') as TransferOffer['status'] } : o
    );
    setTransferOffers(updatedOffers);

    if (accept) {
      setFinances((prev) => ({
        ...prev,
        clubBalance: prev.clubBalance + offer.fee,
        transferBudget: prev.transferBudget + Math.round(offer.fee * 0.8),
      }));

      const soldPlayer = getPlayerById(offer.playerId);
      const buyerClub = getClubById(offer.fromClubId);
      const newMsg: InboxMessage = {
        id: `msg-tr-${Date.now()}`,
        clubId: userClubId,
        senderName: 'Transfer Komitesi',
        senderRole: 'Kulüp Sekreteryası',
        subject: `Transfer Tamamlandı: ${soldPlayer ? soldPlayer.firstName + ' ' + soldPlayer.lastName : 'Oyuncu'}`,
        preview: `${soldPlayer?.firstName} ${soldPlayer?.lastName}, €${offer.fee.toLocaleString('tr-TR')} karşılığında ${buyerClub?.name} kulübüne transfer oldu.`,
        body: `Bilgilendirme:\n\n${soldPlayer?.firstName} ${soldPlayer?.lastName} için ${buyerClub?.name} tarafından yapılan resmi teklif onaylanmış ve transfer tamamlanmıştır.\n\nKulüp kasamıza net €${offer.fee.toLocaleString('tr-TR')} eklenmiş, transfer bütçeniz güncellenmiştir.`,
        date: currentDate,
        category: 'TRANSFER',
        isRead: false,
        priority: 'HIGH',
      };
      setInboxMessages([newMsg, ...inboxMessages]);
    }
  };

  const toggleShortlist = (playerId: string) => {
    const exists = shortlistIds.includes(playerId);
    const updated = exists
      ? shortlistIds.filter((id) => id !== playerId)
      : [...shortlistIds, playerId];
    setShortlistIds(updated);
    persist(currentDate, seasonYear, seasonStage, trainingIntensity, allPlayers, tactics, standings, fixtures, inboxMessages, transferOffers, updated);
  };

  const makeTransferBid = (playerId: string, fee: number) => {
    const targetPlayer = getPlayerById(playerId);
    if (!targetPlayer) return;

    const newOffer: TransferOffer = {
      id: `tr-out-${Date.now()}`,
      playerId,
      fromClubId: userClubId,
      toClubId: targetPlayer.clubId,
      fee,
      status: 'PENDING',
      date: currentDate,
      expiresInDays: 3,
    };
    setTransferOffers([newOffer, ...transferOffers]);

    const newMsg: InboxMessage = {
      id: `msg-bid-${Date.now()}`,
      clubId: userClubId,
      senderName: 'Gözlemci & Transfer Ekibi',
      senderRole: 'Transfer Departmanı',
      subject: `Resmi Teklif Gönderildi: ${targetPlayer.firstName} ${targetPlayer.lastName}`,
      preview: `${targetPlayer.firstName} ${targetPlayer.lastName} için €${fee.toLocaleString('tr-TR')} tutarında resmi teklif iletildi.`,
      body: `Sayın Menajer,\n\n${targetPlayer.firstName} ${targetPlayer.lastName} için kulübü ${getClubById(targetPlayer.clubId)?.name}'ne €${fee.toLocaleString('tr-TR')} resmi teklifimiz faks ve e-posta ile iletilmiştir. Karşı kulüpten gelecek yanıt beklenmektedir.`,
      date: currentDate,
      category: 'TRANSFER',
      isRead: false,
      priority: 'NORMAL',
    };
    setInboxMessages([newMsg, ...inboxMessages]);
  };

  const maxWeeks = Math.max(18, (allClubs.length - 1) * 2);
  const seasonEndSummary = standings[0]?.played >= maxWeeks
    ? evaluateSeasonEnd(seasonYear, standings, allClubs, allPlayers, userClubId)
    : undefined;

  return (
    <GameContext.Provider
      value={{
        isInitialized,
        hasActiveCareer,
        hasSavedCareer,
        difficulty,
        leagueSize,
        startNewCareer,
        loadExistingCareer,
        userClub,
        allClubs,
        allPlayers,
        userPlayers,
        tactics,
        standings,
        fixtures,
        inboxMessages,
        transferOffers,
        shortlistIds,
        finances,
        currentDate,
        seasonYear,
        seasonStage,
        trainingIntensity,
        newsFeed,
        careerHistory,
        unreadMessageCount,
        nextMatch,
        previousMatch,
        isMatchDay,
        daysUntilNextMatch,
        seasonEndSummary,
        activeNegotiations,
        transferHistory,
        futureCommitments,
        scouts,
        freeAgentScouts,
        scoutingAssignments,
        scoutingKnowledge,
        scoutingReports,
        playerHiddenProfiles,
        activeLoans,
        academyFacilities,
        youthPlayers,
        advanceDay,
        smartAdvance,
        setTrainingIntensity,
        applyMatchResult,
        setFormation,
        updateTacticalSettings,
        swapLineupPlayer,
        swapPitchSlots,
        markMessageAsRead,
        deleteMessage,
        respondToTransferOffer,
        toggleShortlist,
        makeTransferBid,
        startNextSeasonRoll,
        resetEntireCareer,
        getPlayerById,
        getClubById,
        startNegotiation,
        submitClubOffer,
        submitContractOffer,
        acceptClubCounterOffer,
        acceptPlayerCounterOffer,
        withdrawNegotiation,
        getNegotiationByPlayerId,
        getNegotiationById,
        assignScout,
        cancelScoutAssignment,
        hireScout,
        fireScout,
        submitLoanOffer,
        recallLoan,
        exerciseLoanBuyOption,
        promoteYouthPlayer,
        upgradeAcademy,
        getMaskedPlayer,
        getPlayerKnowledge,
        seasonNumber,
        managerContract,
        autoAssignTactics,
        respondToManagerContractOffer,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
