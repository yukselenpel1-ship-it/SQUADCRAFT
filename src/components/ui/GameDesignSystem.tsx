'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { LucideIcon, ChevronRight, Swords, Calendar, MapPin, Trophy, Shield, Activity, Star } from 'lucide-react';
import { ClubBadge } from './ClubBadge';
import { Player, Club, Fixture } from '@/types/game';
import { formatDateTurkish } from '@/lib/career/calendar';

// ============================================================================
// 1. GAME PANEL
// ============================================================================
export interface GamePanelProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  headerAction?: ReactNode;
  variant?: 'default' | 'elevated' | 'glass' | 'highlight' | 'tactical';
}

export const GamePanel: React.FC<GamePanelProps> = ({
  children,
  title,
  subtitle,
  icon: Icon,
  actionText,
  actionHref,
  onAction,
  className = '',
  headerAction,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'sc-panel rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl bg-[#0d120f]/95',
    elevated: 'bg-gradient-to-b from-[#141b16] to-[#0d120f] rounded-2xl border border-white/10 shadow-2xl',
    glass: 'bg-[#0d120f]/85 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl',
    highlight: 'bg-gradient-to-b from-[#b7ff35]/10 via-[#0d120f] to-[#090d0a] rounded-2xl border border-[#b7ff35]/40 shadow-[0_0_30px_rgba(183,255,53,0.15)]',
    tactical: 'bg-[#0d120f] rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden',
  };

  return (
    <section className={`p-5 md:p-6 transition-all duration-200 ${variantStyles[variant]} ${className}`}>
      {variant === 'tactical' && (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#b7ff35_1px,transparent_1px)] [background-size:16px_16px]" />
      )}
      {(title || subtitle || Icon || headerAction || actionText) && (
        <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="w-8 h-8 rounded-xl bg-[#b7ff35]/10 border border-[#b7ff35]/30 flex items-center justify-center text-[#b7ff35] shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div className="truncate">
              {title && <h3 className="text-base font-barlow font-black text-white tracking-wide uppercase">{title}</h3>}
              {subtitle && <p className="text-xs text-[#8b958d] font-medium truncate font-inter">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerAction}
            {actionText && actionHref && (
              <Link
                href={actionHref}
                className="text-xs font-barlow font-bold uppercase tracking-wider text-[#b7ff35] hover:text-[#9bea27] transition-colors flex items-center gap-1 group"
              >
                <span>{actionText}</span>
                <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
            {actionText && !actionHref && onAction && (
              <button
                onClick={onAction}
                className="text-xs font-barlow font-bold uppercase tracking-wider text-[#b7ff35] hover:text-[#9bea27] transition-colors flex items-center gap-1"
              >
                <span>{actionText}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </section>
  );
};

// ============================================================================
// 2. HERO PANEL
// ============================================================================
export interface HeroPanelProps {
  children: ReactNode;
  badge?: string;
  badgeVariant?: 'emerald' | 'amber' | 'blue' | 'rose' | 'slate';
  title?: string;
  subtitle?: string;
  glowColor?: string;
  className?: string;
}

export const HeroPanel: React.FC<HeroPanelProps> = ({
  children,
  badge,
  badgeVariant = 'emerald',
  title,
  subtitle,
  glowColor = '#b7ff35',
  className = '',
}) => {
  const badgeClasses = {
    emerald: 'bg-[#b7ff35]/15 text-[#b7ff35] border-[#b7ff35]/30',
    amber: 'bg-[#ffc84a]/15 text-[#ffc84a] border-[#ffc84a]/30',
    blue: 'bg-[#17e5c2]/15 text-[#17e5c2] border-[#17e5c2]/30',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    slate: 'bg-[#0d120f] text-[#8b958d] border-white/10',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d120f] via-[#090d0a] to-[#050806] border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-xl ${className}`}
    >
      {/* Background ambient lighting */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: glowColor }}
      />
      <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full blur-3xl bg-[#17e5c2]/10 pointer-events-none" />

      {/* Subtle pitch line vector */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative z-10">
        {(badge || title || subtitle) && (
          <div className="mb-6 space-y-2">
            {badge && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-ibm font-bold uppercase tracking-wider border ${badgeClasses[badgeVariant]}`}
              >
                {badge}
              </span>
            )}
            {title && (
              <h1 className="text-2xl md:text-4xl font-barlow font-black text-white tracking-tight uppercase">
                {title}
              </h1>
            )}
            {subtitle && <p className="text-xs md:text-sm text-[#8b958d] max-w-2xl font-inter">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// 3. SECTION HEADER
// ============================================================================
export interface SectionHeaderProps {
  title: string;
  badge?: string;
  subtitle?: string;
  icon?: LucideIcon;
  actionText?: string;
  actionHref?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  badge,
  subtitle,
  icon: Icon,
  actionText,
  actionHref,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between gap-4 mb-4 ${className}`}>
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-[#b7ff35]/10 border border-[#b7ff35]/25 flex items-center justify-center text-[#b7ff35]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-barlow font-black text-white tracking-wide uppercase">{title}</h2>
            {badge && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-ibm font-bold uppercase bg-[#0d120f] text-[#8b958d] border border-white/10">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-[#8b958d] font-inter">{subtitle}</p>}
        </div>
      </div>

      {actionText && actionHref && (
        <Link
          href={actionHref}
          className="text-xs font-barlow font-bold uppercase tracking-wider text-[#b7ff35] hover:text-[#9bea27] transition-colors flex items-center gap-1 group"
        >
          <span>{actionText}</span>
          <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
};

// ============================================================================
// 4. STATUS CHIP
// ============================================================================
export interface StatusChipProps {
  label: string;
  variant?: 'emerald' | 'amber' | 'rose' | 'sky' | 'purple' | 'slate';
  icon?: LucideIcon;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  label,
  variant = 'slate',
  icon: Icon,
  size = 'md',
  pulse = false,
}) => {
  const styles = {
    emerald: 'bg-[#b7ff35]/15 text-[#b7ff35] border-[#b7ff35]/30',
    amber: 'bg-[#ffc84a]/15 text-[#ffc84a] border-[#ffc84a]/30',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    sky: 'bg-[#17e5c2]/15 text-[#17e5c2] border-[#17e5c2]/30',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    slate: 'bg-[#0d120f] text-[#8b958d] border-white/10',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-ibm font-bold rounded-lg uppercase tracking-wider border ${styles[variant]} ${sizes[size]} ${
        pulse ? 'animate-pulse' : ''
      }`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      <span>{label}</span>
    </span>
  );
};

// ============================================================================
// 5. PRIMARY ACTION BUTTON
// ============================================================================
export interface PrimaryActionProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
  variant?: 'emerald' | 'cyan' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export const PrimaryAction: React.FC<PrimaryActionProps> = ({
  children,
  onClick,
  href,
  icon: Icon,
  variant = 'emerald',
  size = 'md',
  className = '',
  disabled = false,
}) => {
  const variants = {
    emerald:
      'bg-[#b7ff35] hover:bg-[#9bea27] text-[#050806] font-barlow font-black uppercase tracking-wider shadow-[0_0_20px_rgba(183,255,53,0.3)] active:scale-95',
    cyan: 'bg-[#17e5c2] hover:bg-[#12bda0] text-[#050806] font-barlow font-black uppercase tracking-wider shadow-[0_0_20px_rgba(23,229,194,0.3)] active:scale-95',
    secondary:
      'bg-[#0d120f] hover:bg-[#141b16] text-white border border-white/10 active:scale-95 font-barlow font-bold uppercase',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 active:scale-95 font-barlow font-black uppercase',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-bold rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm font-black rounded-xl gap-2',
    lg: 'px-6 py-3.5 text-base font-black rounded-2xl gap-2.5',
  };

  const content = (
    <>
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        className={`inline-flex items-center justify-center transition-all ${variants[variant]} ${sizes[size]} ${className}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {content}
    </button>
  );
};

// ============================================================================
// 6. FIXTURE HERO (Dominant Next Match Panel)
// ============================================================================
export interface FixtureHeroProps {
  fixture?: Fixture;
  homeClub?: Club;
  awayClub?: Club;
  userClubId: string;
  isMatchDay: boolean;
  daysUntilNextMatch: number;
}

export const FixtureHero: React.FC<FixtureHeroProps> = ({
  fixture,
  homeClub,
  awayClub,
  userClubId,
  isMatchDay,
  daysUntilNextMatch,
}) => {
  if (!fixture || !homeClub || !awayClub) {
    return (
      <GamePanel variant="elevated" className="text-center py-8">
        <Calendar className="w-10 h-10 text-[#8b958d] mx-auto mb-2" />
        <h3 className="text-base font-barlow font-black text-white uppercase">Planlanmış Maç Bulunmuyor</h3>
        <p className="text-xs text-[#8b958d]">Sezon fikstürü tamamlanmış veya yeni sezon hazırlıkları devam ediyor olabilir.</p>
      </GamePanel>
    );
  }

  const isUserHome = fixture.homeClubId === userClubId;
  const opponent = isUserHome ? awayClub : homeClub;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d120f] via-[#090d0a] to-[#050806] border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
      {/* Dynamic Stadium Pitch Backing */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(183,255,53,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#b7ff35]/10 blur-3xl pointer-events-none" />

      {/* Top Meta Line */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-ibm font-black uppercase tracking-wider bg-[#b7ff35]/15 text-[#b7ff35] border border-[#b7ff35]/30">
            {fixture.competition} • Hafta {fixture.round}
          </span>
          <span className="text-xs text-[#8b958d] font-ibm">
            {formatDateTurkish(fixture.date)} • {fixture.time || '20:00'}
          </span>
        </div>

        <div>
          {isMatchDay ? (
            <span className="px-3 py-1 rounded-xl text-xs font-barlow font-black uppercase tracking-widest bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5" />
              BUGÜN MAÇ GÜNÜ
            </span>
          ) : (
            <span className="px-3 py-1 rounded-xl text-xs font-ibm font-bold uppercase tracking-wider bg-[#0d120f] text-[#8b958d] border border-white/10">
              {daysUntilNextMatch > 0 ? `${daysUntilNextMatch} Gün Kaldı` : 'Maç Başlıyor'}
            </span>
          )}
        </div>
      </div>

      {/* Matchup Center Stage */}
      <div className="relative z-10 py-6 grid grid-cols-1 md:grid-cols-3 items-center gap-6 text-center">
        {/* Home Club */}
        <div className="flex flex-col items-center gap-2">
          <ClubBadge
            code={homeClub.code}
            primaryColor={homeClub.primaryColor}
            secondaryColor={homeClub.secondaryColor}
            size="lg"
          />
          <h4 className="text-xl md:text-2xl font-barlow font-black uppercase text-white tracking-wide">{homeClub.name}</h4>
          <span className="text-xs text-[#8b958d] font-inter">
            {homeClub.city} • (Ev Sahibi)
          </span>
        </div>

        {/* VS / Center Timing */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#0d120f] border border-white/10 flex items-center justify-center font-barlow font-black text-xl text-[#b7ff35] shadow-inner">
            VS
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#8b958d]">
            <MapPin className="w-3.5 h-3.5 text-[#b7ff35]" />
            <span>{fixture.stadium || homeClub.stadium}</span>
          </div>
          {fixture.referee && (
            <span className="text-[11px] text-[#8b958d] font-ibm">Hakem: {fixture.referee}</span>
          )}
        </div>

        {/* Away Club */}
        <div className="flex flex-col items-center gap-2">
          <ClubBadge
            code={awayClub.code}
            primaryColor={awayClub.primaryColor}
            secondaryColor={awayClub.secondaryColor}
            size="lg"
          />
          <h4 className="text-xl md:text-2xl font-barlow font-black uppercase text-white tracking-wide">{awayClub.name}</h4>
          <span className="text-xs text-[#8b958d] font-inter">
            {awayClub.city} • (Deplasman)
          </span>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-[#8b958d] text-center sm:text-left font-ibm">
          <span>Rakip İtibarı: </span>
          <strong className="text-white">%{opponent.reputation}</strong> •{' '}
          <span>Menajer: </span>
          <strong className="text-white">{opponent.managerName}</strong>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/tactics"
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#0d120f] hover:bg-[#141b16] text-zinc-200 font-barlow font-bold text-xs uppercase tracking-wider border border-white/10 text-center transition-colors"
          >
            Taktik Ayarla
          </Link>

          <Link
            href={`/match/${fixture.id}`}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-barlow font-black text-sm uppercase tracking-wider text-center shadow-lg transition-all flex items-center justify-center gap-2 ${
              isMatchDay
                ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/30'
                : 'bg-[#b7ff35] hover:bg-[#9bea27] text-[#050806] shadow-[0_0_20px_rgba(183,255,53,0.3)]'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>{isMatchDay ? 'MAÇA GİT' : 'MAÇA HAZIRLAN'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 7. CLUB IDENTITY CARD
// ============================================================================
export interface ClubIdentityProps {
  club: Club;
  size?: 'sm' | 'md' | 'lg';
  showReputation?: boolean;
}

export const ClubIdentity: React.FC<ClubIdentityProps> = ({
  club,
  size = 'md',
  showReputation = true,
}) => {
  return (
    <div className="flex items-center gap-3">
      <ClubBadge
        code={club.code}
        primaryColor={club.primaryColor}
        secondaryColor={club.secondaryColor}
        size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'}
      />
      <div>
        <h4 className="text-sm font-barlow font-black text-white leading-tight uppercase">{club.name}</h4>
        <div className="flex items-center gap-2 text-xs text-[#8b958d] mt-0.5 font-ibm">
          <span>{club.city}</span>
          {showReputation && (
            <>
              <span>•</span>
              <span className="text-[#b7ff35] font-bold">%{club.reputation} İtibar</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 8. GAME TABS
// ============================================================================
export interface GameTabItem {
  id: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

export interface GameTabsProps {
  tabs: GameTabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export const GameTabs: React.FC<GameTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1.5 bg-[#0d120f] p-1.5 rounded-2xl border border-white/10 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-barlow font-bold uppercase tracking-wider transition-all shrink-0 ${
              isActive
                ? 'bg-[#b7ff35] text-[#050806] shadow-[0_0_15px_rgba(183,255,53,0.3)] font-black'
                : 'text-[#8b958d] hover:text-white hover:bg-[#141b16] border border-transparent'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-ibm font-black ${
                  isActive ? 'bg-[#050806] text-[#b7ff35]' : 'bg-[#141b16] text-[#8b958d]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// 9. EMPTY STATE
// ============================================================================
export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionHref?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Trophy,
  title,
  description,
  actionText,
  onAction,
  actionHref,
}) => {
  return (
    <div className="text-center py-12 px-4 rounded-2xl bg-[#0d120f]/50 border border-dashed border-white/10">
      <div className="w-12 h-12 rounded-2xl bg-[#0d120f] border border-white/10 flex items-center justify-center text-[#8b958d] mx-auto mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-barlow font-bold uppercase text-white mb-1">{title}</h3>
      <p className="text-xs text-[#8b958d] max-w-sm mx-auto mb-4 font-inter">{description}</p>
      {actionText && actionHref && (
        <PrimaryAction href={actionHref} size="sm">
          {actionText}
        </PrimaryAction>
      )}
      {actionText && !actionHref && onAction && (
        <PrimaryAction onClick={onAction} size="sm">
          {actionText}
        </PrimaryAction>
      )}
    </div>
  );
};
