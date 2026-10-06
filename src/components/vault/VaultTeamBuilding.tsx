'use client';

import React from 'react';

interface VaultTeamBuildingProps {
  onEnquireClick?: () => void;
}

export const VaultTeamBuilding: React.FC<VaultTeamBuildingProps> = ({ onEnquireClick }) => {
  return (
    <section
      id="team-building"
      className="bg-[#100e0c] w-full"
      style={{
        paddingTop: '80px',
        paddingBottom: '80px',
        paddingLeft: 'clamp(24px, 6vw, 96px)',
        paddingRight: 'clamp(24px, 6vw, 96px)',
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left column: Content */}
        <div className="flex flex-col items-start pr-0 lg:pr-6">
          {/* Small label */}
          <span
            className="font-inter text-[11px] uppercase text-[#c9a55a] tracking-[0.14em] mb-4 font-normal"
            style={{ letterSpacing: '0.14em' }}
          >
            CORPORATE & TEAM EVENTS
          </span>

          {/* Headline */}
          <h2
            className="font-bebas text-[#e8d4b0] tracking-[0.02em] leading-tight"
            style={{
              fontSize: 'clamp(28px, 4.5vw, 68px)',
              letterSpacing: '0.02em',
            }}
          >
            BOOK THE WHOLE ROOM.
          </h2>

          {/* Body paragraph 1 */}
          <p className="font-cormorant italic text-[17px] text-[#9a8a7a] mt-4 leading-[1.75]">
            Private hire available for corporate teams, team days, and company events. Dedicated Games Master, full debrief session, and post-game drinks package available at the Royal Mile bar.
          </p>

          {/* Body paragraph 2 */}
          <p className="font-cormorant italic text-[17px] text-[#9a8a7a] mt-3">
            From £14pp (minimum 6 players). Typically 2–3 hours total.
          </p>

          {/* Gold Link */}
          <button
            type="button"
            onClick={onEnquireClick}
            className="font-cormorant italic text-[15px] text-[#c9a55a] hover:text-[#ffd685] mt-6 cursor-pointer inline-flex items-center gap-1.5 transition-colors group"
          >
            Enquire About Team Booking
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {/* Right column: Full-bleed team activity photography */}
        <div className="relative w-full h-[340px] sm:h-[420px] lg:h-[480px] rounded-[8px] overflow-hidden border border-[#2a2420] shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop"
            alt="Corporate team celebrating after escape room team building session"
            className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.1]"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
          {/* Subtle dark vignette overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(16,14,12,0.8) 0%, transparent 40%, rgba(16,14,12,0.4) 100%)',
            }}
          />
          {/* Subtle badge on photo */}
          <div className="absolute bottom-4 left-4 z-10 bg-[#100e0c]/80 backdrop-blur-md px-3 py-1.5 rounded-[4px] border border-[#2ad4b4]/30">
            <span className="font-inter text-[11px] text-[#2ad4b4] font-medium">
              Private Hire & Debrief Included
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
