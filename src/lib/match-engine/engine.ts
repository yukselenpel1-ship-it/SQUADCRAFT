import {
  Club,
  Player,
  TacticalSettings,
  Formation,
} from '@/types/game';
import {
  MatchEngineState,
  MatchTeamRuntime,
  PlayerInMatch,
  MatchEngineEvent,
  MatchSimulationConfig,
} from './types';
import { calculateTeamRatings } from './teamStrength';
import { computeTacticalModifiers } from './tacticalEffects';
import { applyFatigueToTeam } from './fatigue';
import { createInitialMomentum, decayMomentum, MomentumState } from './momentum';
import { evaluateInjuries } from './injuries';
import { evaluateFoulsAndDiscipline } from './discipline';
import { simulateMinuteAttack } from './chanceCreation';
import { runAIManagerDecisions } from './aiManager';
import { performSubstitution, SubstitutionResult } from './substitutions';
import { createEmptyTeamStats, updatePlayerMatchRatings } from './matchStats';
import { generateCommentary } from './commentary';
import { FORMATION_COORDINATES } from '@/lib/data/mockData';
import { createSeededRandom, setActiveRng, matchRandom } from './random';

export class MatchEngine {
  private state: MatchEngineState;
  private momentum: MomentumState;
  private config: MatchSimulationConfig;
  private rng: () => number;
  private fixtureId: string;
  private eventCounter: number = 0;

  constructor(
    homeClub: Club,
    awayClub: Club,
    homePlayers: Player[],
    awayPlayers: Player[],
    homeTactics: TacticalSettings,
    awayTactics: TacticalSettings,
    homeFormation: Formation = '4-2-3-1',
    awayFormation: Formation = '4-2-3-1',
    homeStartingIds?: string[],
    awayStartingIds?: string[],
    fixtureId: string = `fix-${Date.now()}`,
    config: MatchSimulationConfig = {
      isCompetitive: true,
      enableHomeAdvantage: true,
      homeAdvantageMultiplier: 1.10,
    }
  ) {
    this.config = config;
    this.fixtureId = fixtureId;
    this.rng = createSeededRandom(fixtureId);
    setActiveRng(this.rng);
    this.momentum = createInitialMomentum(config.enableHomeAdvantage);

    const calcConsistencyVariance = (p: Player) => {
      const consistency = p.hiddenAttributes?.consistency ?? 70;
      // spread: consistency 100 -> 0%, consistency 70 -> ±3.3%, consistency 50 -> ±5.5%
      const spread = (100 - consistency) * 0.0011;
      return (matchRandom(this.rng) - 0.5) * 2 * spread;
    };

    // Initialize Home Team Runtime
    const homeStarting = (homeStartingIds || homePlayers.slice(0, 11).map((p) => p.id)).slice(0, 11);
    const homeBench = homePlayers.filter((p) => !homeStarting.includes(p.id)).map((p) => p.id);
    const homeSlots = FORMATION_COORDINATES[homeFormation] || FORMATION_COORDINATES['4-2-3-1'];

    const homePlayerMap: Record<string, PlayerInMatch> = {};
    homePlayers.forEach((p) => {
      const isStart = homeStarting.includes(p.id);
      const slotIdx = isStart ? homeStarting.indexOf(p.id) : undefined;
      const assignedPos = slotIdx !== undefined && homeSlots[slotIdx] ? homeSlots[slotIdx].role : p.position;

      homePlayerMap[p.id] = {
        player: p,
        currentPosition: assignedPos,
        slotIndex: slotIdx,
        isStartingXI: isStart,
        isOnPitch: isStart,
        minutesPlayed: 0,
        matchRating: 6.5,
        currentFitness: p.fitness || 98,
        matchDayConsistencyVariance: calcConsistencyVariance(p),
        goals: 0,
        assists: 0,
        shots: 0,
        shotsOnTarget: 0,
        keyPasses: 0,
        blocks: 0,
        passesAttempted: 0,
        passesCompleted: 0,
        tacklesAttempted: 0,
        tacklesWon: 0,
        interceptions: 0,
        saves: 0,
        foulsCommitted: 0,
        yellowCards: 0,
        redCards: 0,
        isInjured: false,
      };
    });

    // Initialize Away Team Runtime
    const awayStarting = (awayStartingIds || awayPlayers.slice(0, 11).map((p) => p.id)).slice(0, 11);
    const awayBench = awayPlayers.filter((p) => !awayStarting.includes(p.id)).map((p) => p.id);
    const awaySlots = FORMATION_COORDINATES[awayFormation] || FORMATION_COORDINATES['4-2-3-1'];

    const awayPlayerMap: Record<string, PlayerInMatch> = {};
    awayPlayers.forEach((p) => {
      const isStart = awayStarting.includes(p.id);
      const slotIdx = isStart ? awayStarting.indexOf(p.id) : undefined;
      const assignedPos = slotIdx !== undefined && awaySlots[slotIdx] ? awaySlots[slotIdx].role : p.position;

      awayPlayerMap[p.id] = {
        player: p,
        currentPosition: assignedPos,
        slotIndex: slotIdx,
        isStartingXI: isStart,
        isOnPitch: isStart,
        minutesPlayed: 0,
        matchRating: 6.5,
        currentFitness: p.fitness || 98,
        matchDayConsistencyVariance: calcConsistencyVariance(p),
        goals: 0,
        assists: 0,
        shots: 0,
        shotsOnTarget: 0,
        keyPasses: 0,
        blocks: 0,
        passesAttempted: 0,
        passesCompleted: 0,
        tacklesAttempted: 0,
        tacklesWon: 0,
        interceptions: 0,
        saves: 0,
        foulsCommitted: 0,
        yellowCards: 0,
        redCards: 0,
        isInjured: false,
      };
    });

    const homeActive = homeStarting.map((id) => homePlayerMap[id]).filter(Boolean);
    const awayActive = awayStarting.map((id) => awayPlayerMap[id]).filter(Boolean);

    const isComp = this.config.isCompetitive !== false;
    const homeRatings = calculateTeamRatings(homeActive, isComp);
    const awayRatings = calculateTeamRatings(awayActive, isComp);

    const homeRuntime: MatchTeamRuntime = {
      club: homeClub,
      tactics: { ...homeTactics },
      formation: homeFormation,
      players: homePlayerMap,
      startingXIIds: homeStarting,
      activePitchPlayerIds: [...homeStarting],
      benchPlayerIds: homeBench,
      substitutionsUsed: 0,
      maxSubstitutions: 5,
      ratings: homeRatings,
      stats: createEmptyTeamStats(),
      consecutiveAttacks: 0,
    };

    const awayRuntime: MatchTeamRuntime = {
      club: awayClub,
      tactics: { ...awayTactics },
      formation: awayFormation,
      players: awayPlayerMap,
      startingXIIds: awayStarting,
      activePitchPlayerIds: [...awayStarting],
      benchPlayerIds: awayBench,
      substitutionsUsed: 0,
      maxSubstitutions: 5,
      ratings: awayRatings,
      stats: createEmptyTeamStats(),
      consecutiveAttacks: 0,
    };

    const addedTime1 = Math.floor(1 + matchRandom(this.rng) * 3); // 1-3 min
    const addedTime2 = Math.floor(2 + matchRandom(this.rng) * 4); // 2-5 min

    const initialKickoffEvent: MatchEngineEvent = {
      id: `ev-${fixtureId}-0-0-KICKOFF`,
      minute: 0,
      second: 0,
      type: 'KICKOFF',
      teamId: homeClub.id,
      description: `Karşılaşma başladı: ${homeClub.name} vs ${awayClub.name}`,
      commentary: generateCommentary('KICKOFF', {
        team: homeClub.name,
        opponent: awayClub.name,
      }),
      isImportant: true,
    };

    this.state = {
      fixtureId,
      minute: 0,
      addedTimeFirstHalf: addedTime1,
      addedTimeSecondHalf: addedTime2,
      currentAddedTime: 0,
      isFirstHalf: true,
      isSecondHalf: false,
      isFinished: false,
      homeScore: 0,
      awayScore: 0,
      homePossessionPercent: 50,
      awayPossessionPercent: 50,
      homeMomentum: 54,
      awayMomentum: 46,
      home: homeRuntime,
      away: awayRuntime,
      events: [initialKickoffEvent],
      commentaryLog: [initialKickoffEvent.commentary],
      latestEvent: initialKickoffEvent,
    };
  }

  public getState(): MatchEngineState {
    return this.state;
  }

  public isMatchFinished(): boolean {
    return this.state.isFinished;
  }

  public applyTactics(isHome: boolean, newTactics: Partial<TacticalSettings>): void {
    const team = isHome ? this.state.home : this.state.away;
    team.tactics = {
      ...team.tactics,
      ...newTactics,
    };
  }

  private registerEvent(event: MatchEngineEvent): MatchEngineEvent {
    this.eventCounter += 1;
    event.id = `ev-${this.fixtureId}-${event.minute}-${this.eventCounter}-${event.type}${event.playerId ? `-${event.playerId}` : ''}`;
    this.state.events.push(event);
    this.state.commentaryLog.push(event.commentary);
    this.state.latestEvent = event;
    return event;
  }

  public applyUserTactics(newTactics: Partial<TacticalSettings>): void {
    this.applyTactics(true, newTactics);
  }

  public makeSubstitution(isHome: boolean, playerOutId: string, playerInId: string): SubstitutionResult {
    const team = isHome ? this.state.home : this.state.away;
    const res = performSubstitution(team, playerOutId, playerInId, this.state.minute, this.rng);

    if (res.success && res.event) {
      this.registerEvent(res.event);
    }

    return res;
  }

  public simulateMinute(): { events: MatchEngineEvent[]; isFinished: boolean } {
    setActiveRng(this.rng);
    if (this.state.isFinished) {
      return { events: [], isFinished: true };
    }

    this.state.minute += 1;
    const minute = this.state.minute;
    const newEvents: MatchEngineEvent[] = [];

    // Track minutes played for all active pitch players
    for (const id of this.state.home.activePitchPlayerIds) {
      const p = this.state.home.players[id];
      if (p) p.minutesPlayed += 1;
    }
    for (const id of this.state.away.activePitchPlayerIds) {
      const p = this.state.away.players[id];
      if (p) p.minutesPlayed += 1;
    }

    // Halftime / Fulltime checks
    if (minute === 45) {
      const halfEvent: MatchEngineEvent = {
        id: `ht-45`,
        minute: 45,
        second: 0,
        type: 'HALFTIME',
        teamId: this.state.home.club.id,
        description: `İlk Yarı Sona Erdi: ${this.state.home.club.name} ${this.state.homeScore} - ${this.state.awayScore} ${this.state.away.club.name}`,
        commentary: generateCommentary('HALFTIME', {}),
        isImportant: true,
      };
      newEvents.push(halfEvent);
    } else if (minute === 90 + this.state.addedTimeSecondHalf) {
      this.state.isFinished = true;
      const fullEvent: MatchEngineEvent = {
        id: `ft-${minute}`,
        minute: 90,
        second: 0,
        type: 'FULLTIME',
        teamId: this.state.home.club.id,
        description: `Maç Sona Erdi! Skor: ${this.state.home.club.name} ${this.state.homeScore} - ${this.state.awayScore} ${this.state.away.club.name}`,
        commentary: generateCommentary('FULLTIME', {}),
        isImportant: true,
      };
      newEvents.push(fullEvent);

      updatePlayerMatchRatings(this.state.home.players, this.state.awayScore);
      updatePlayerMatchRatings(this.state.away.players, this.state.homeScore);

      return { events: newEvents, isFinished: true };
    }

    // 1. Recalculate dynamic tactical modifiers & team ratings
    const homeActive = this.state.home.activePitchPlayerIds.map((id) => this.state.home.players[id]).filter(Boolean);
    const awayActive = this.state.away.activePitchPlayerIds.map((id) => this.state.away.players[id]).filter(Boolean);

    const isComp = this.config.isCompetitive !== false;
    this.state.home.ratings = calculateTeamRatings(homeActive, isComp);
    this.state.away.ratings = calculateTeamRatings(awayActive, isComp);

    const homeMods = computeTacticalModifiers(
      this.state.home.tactics,
      this.state.home.ratings,
      this.state.away.tactics,
      this.state.away.ratings
    );

    const awayMods = computeTacticalModifiers(
      this.state.away.tactics,
      this.state.away.ratings,
      this.state.home.tactics,
      this.state.home.ratings
    );

    // 2. Apply minute fatigue to both teams
    applyFatigueToTeam(this.state.home.players, this.state.home.activePitchPlayerIds, homeMods.fatigueBurnRateMult);
    applyFatigueToTeam(this.state.away.players, this.state.away.activePitchPlayerIds, awayMods.fatigueBurnRateMult);

    // 3. Momentum natural decay
    this.momentum = decayMomentum(this.momentum);

    // 4. Calculate dynamic minute possession ratio
    const homePossAbility = this.state.home.ratings.possessionAbility + homeMods.possessionShareBonus + (this.config.enableHomeAdvantage ? 5 : 0);
    const awayPossAbility = this.state.away.ratings.possessionAbility + awayMods.possessionShareBonus;
    const totalPossAbility = homePossAbility + awayPossAbility;

    const minuteHomePossRatio = homePossAbility / Math.max(1, totalPossAbility);

    // Accumulate passes
    const passCount = Math.floor(7 + matchRandom(this.rng) * 5);
    if (matchRandom(this.rng) < minuteHomePossRatio) {
      this.state.home.stats.passes += passCount;
      this.state.home.stats.completedPasses += Math.floor(passCount * (this.state.home.ratings.possessionAbility / 100));
    } else {
      this.state.away.stats.passes += passCount;
      this.state.away.stats.completedPasses += Math.floor(passCount * (this.state.away.ratings.possessionAbility / 100));
    }

    // Update cumulative match possession percentage strictly summing to 100%
    const totalPasses = this.state.home.stats.passes + this.state.away.stats.passes;
    if (totalPasses > 0) {
      const homePct = Math.round((this.state.home.stats.passes / totalPasses) * 100);
      this.state.homePossessionPercent = homePct;
      this.state.awayPossessionPercent = 100 - homePct;
    }

    // 5. Injury checks
    const homeInjRes = evaluateInjuries(minute, this.state.home.club.id, homeActive, this.state.away.ratings.physicalStrength, this.rng);
    if (homeInjRes.hasInjury && homeInjRes.event) {
      newEvents.push(homeInjRes.event);
    }

    const awayInjRes = evaluateInjuries(minute, this.state.away.club.id, awayActive, this.state.home.ratings.physicalStrength, this.rng);
    if (awayInjRes.hasInjury && awayInjRes.event) {
      newEvents.push(awayInjRes.event);
    }

    // 6. Discipline / Fouls & Cards check
    const foulCheckHome = evaluateFoulsAndDiscipline(
      minute,
      this.state.home.club.id,
      homeActive,
      awayActive,
      homeMods.foulRiskMult,
      false,
      this.rng
    );
    if (foulCheckHome.foulOccurred) {
      this.state.home.stats.fouls += 1;
      if (foulCheckHome.cardType === 'YELLOW') this.state.home.stats.yellowCards += 1;
      if (foulCheckHome.cardType === 'RED') this.state.home.stats.redCards += 1;
      if (foulCheckHome.event) newEvents.push(foulCheckHome.event);
    }

    const foulCheckAway = evaluateFoulsAndDiscipline(
      minute,
      this.state.away.club.id,
      awayActive,
      homeActive,
      awayMods.foulRiskMult,
      false,
      this.rng
    );
    if (foulCheckAway.foulOccurred) {
      this.state.away.stats.fouls += 1;
      if (foulCheckAway.cardType === 'YELLOW') this.state.away.stats.yellowCards += 1;
      if (foulCheckAway.cardType === 'RED') this.state.away.stats.redCards += 1;
      if (foulCheckAway.event) newEvents.push(foulCheckAway.event);
    }

    // 7. Attack Sequence simulation
    const attackRes = simulateMinuteAttack(
      minute,
      this.state.home,
      this.state.away,
      homeMods,
      awayMods,
      minuteHomePossRatio,
      this.momentum,
      this.config.enableHomeAdvantage ? this.config.homeAdvantageMultiplier : 1.0,
      this.rng
    );

    if (attackRes.hasAttack) {
      this.momentum = attackRes.momentum;
      this.state.homeMomentum = this.momentum.homeMomentum;
      this.state.awayMomentum = this.momentum.awayMomentum;

      // Update Scores & Stats
      this.state.homeScore += attackRes.homeScoreDelta;
      this.state.awayScore += attackRes.awayScoreDelta;

      this.state.home.stats.shots += attackRes.homeStatsDelta.shots;
      this.state.home.stats.shotsOnTarget += attackRes.homeStatsDelta.shotsOnTarget;
      this.state.home.stats.xG = Number((this.state.home.stats.xG + attackRes.homeStatsDelta.xG).toFixed(2));
      this.state.home.stats.corners += attackRes.homeStatsDelta.corners;
      this.state.home.stats.saves += attackRes.homeStatsDelta.saves;

      this.state.away.stats.shots += attackRes.awayStatsDelta.shots;
      this.state.away.stats.shotsOnTarget += attackRes.awayStatsDelta.shotsOnTarget;
      this.state.away.stats.xG = Number((this.state.away.stats.xG + attackRes.awayStatsDelta.xG).toFixed(2));
      this.state.away.stats.corners += attackRes.awayStatsDelta.corners;
      this.state.away.stats.saves += attackRes.awayStatsDelta.saves;

      if (attackRes.pitchCoords && attackRes.attackingDirection) {
        this.state.lastAttackingAction = {
          direction: attackRes.attackingDirection,
          type: attackRes.events[0]?.type || 'SHOT',
          coords: attackRes.pitchCoords,
        };
      }

      attackRes.events.forEach((ev) => newEvents.push(ev));
    }

    // 8. Run AI Opponent Decisions (Substitutions & Tactical Mentality reactions)
    const aiEvents = runAIManagerDecisions(
      minute,
      this.state.away,
      this.state.home,
      false,
      this.state.homeScore,
      this.state.awayScore,
      this.rng
    );
    aiEvents.forEach((ev) => newEvents.push(ev));

    // 9. Update Player match ratings dynamically
    updatePlayerMatchRatings(this.state.home.players, this.state.awayScore);
    updatePlayerMatchRatings(this.state.away.players, this.state.homeScore);

    // Append to event and commentary logs with guaranteed unique deterministic IDs
    if (newEvents.length > 0) {
      newEvents.forEach((ev) => {
        this.registerEvent(ev);
      });
    }

    return {
      events: newEvents,
      isFinished: this.state.isFinished,
    };
  }

  public simulateFullMatch(): MatchEngineState {
    while (!this.state.isFinished) {
      this.simulateMinute();
    }
    return this.state;
  }
}
