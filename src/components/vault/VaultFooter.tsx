'use client';

import React from 'react';

interface VaultFooterProps {
  onBookClick?: () => void;
  onRoomClick?: (roomName: string) => void;
}

export const VaultFooter: React.FC<VaultFooterProps> = ({ onBookClick, onRoomClick }) => {
  return (
    <footer
      className="bg-[#100e0c] border-t border-[#1e1c1a] w-full"
      style={{
        paddingTop: '48px',
        paddingBottom: '32px',
        paddingLeft: 'clamp(24px, 6vw, 96px)',
        paddingRight: 'clamp(24px, 6vw, 96px)',
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#1e1c1a]">
        {/* Column 1: Brand */}
        <div className="flex flex-col items-start">
          <div className="flex items-center">
            <span className="font-bebas text-[18px] text-[#e8d4b0] tracking-[0.06em]">
              THE VAULT
            </span>
            <span className="w-[6px] h-[6px] rounded-full bg-[#2ad4b4] ml-2 inline-block shadow-[0_0_6px_#2ad4b4]" />
          </div>
          <span className="font-cormorant italic text-[13px] text-[#6a5a4a] mt-1">
            Edinburgh Old Town
          </span>
          <p className="font-cormorant italic text-[14px] text-[#7a6a5a] mt-4 leading-[1.6]">
            Atmospheric Victorian, crime noir, and sci-fi escape room experiences handcrafted in the vaults below the Royal Mile.
          </p>
        </div>

        {/* Column 2: Rooms */}
        <div className="flex flex-col items-start">
          <span className="font-inter text-[12px] uppercase text-[#9a8a7a] tracking-[0.1em] font-medium mb-4">
            Our Rooms
          </span>
          <div className="flex flex-col gap-2.5">
            {['The Vault', 'The Study', 'Isolation', 'The Heist'].map((room) => (
              <button
                key={room}
                type="button"
                onClick={() => onRoomClick?.(room)}
                className="font-cormorant italic text-[14px] text-[#7a6a5a] hover:text-[#2ad4b4] transition-colors text-left cursor-pointer"
              >
                {room}
              </button>
            ))}
          </div>
        </div>

        {/* Column 3: Plan Your Visit */}
        <div className="flex flex-col items-start">
          <span className="font-inter text-[12px] uppercase text-[#9a8a7a] tracking-[0.1em] font-medium mb-4">
            Plan Your Visit
          </span>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onBookClick}
              className="font-inter text-[14px] text-[#7a6a5a] hover:text-[#e8d4b0] transition-colors text-left cursor-pointer"
            >
              Book Now
            </button>
            <a
              href="#pricing"
              className="font-inter text-[14px] text-[#7a6a5a] hover:text-[#e8d4b0] transition-colors"
            >
              Gift Cards
            </a>
            <a
              href="#team-building"
              className="font-inter text-[14px] text-[#7a6a5a] hover:text-[#e8d4b0] transition-colors"
            >
              Team Building
            </a>
            <a
              href="#perfect-for"
              className="font-inter text-[14px] text-[#7a6a5a] hover:text-[#e8d4b0] transition-colors"
            >
              FAQs & Groups
            </a>
          </div>
        </div>

        {/* Column 4: Contact */}
        <div className="flex flex-col items-start">
          <span className="font-inter text-[12px] uppercase text-[#9a8a7a] tracking-[0.1em] font-medium mb-4">
            Contact
          </span>
          <div className="flex flex-col gap-2.5 font-inter text-[14px] text-[#7a6a5a]">
            <span>Royal Mile, Edinburgh Old Town</span>
            <a
              href="tel:+441310000000"
              className="hover:text-[#2ad4b4] transition-colors"
            >
              +44 (0)131 000 0000
            </a>
            <a
              href="mailto:hello@thevaultescape.co.uk"
              className="hover:text-[#2ad4b4] transition-colors"
            >
              hello@thevaultescape.co.uk
            </a>
            <span className="text-[#c9a55a] font-cormorant italic text-[13px] mt-1">
              TripAdvisor ★★★★★ #1 Edinburgh Escape Rooms
            </span>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-cormorant italic text-[12px] text-[#4a3a2a]">
          © 2025 The Vault Escape Rooms. Edinburgh.
        </p>
        <p className="font-inter text-[12px] text-[#4a3a2a]">
          Designed for immersive puzzle solvers. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
