'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface RoomData {
  id: string;
  name: string;
  difficulty: string;
  starsFilled: number;
  starsTotal: number;
  tagline: string;
  duration: string;
  players: string;
  escapeRate: string;
  image: string;
  imageAlt: string;
}

export const ROOMS: RoomData[] = [
  {
    id: 'vault',
    name: 'THE VAULT',
    difficulty: 'HARD',
    starsFilled: 4,
    starsTotal: 5,
    tagline: '1921. Crack the vault before the alarm trips.',
    duration: '90min',
    players: '2-6 players',
    escapeRate: '23% escape rate',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'The Vault escape room interior with bank vault atmosphere',
  },
  {
    id: 'study',
    name: 'THE STUDY',
    difficulty: 'MEDIUM',
    starsFilled: 3,
    starsTotal: 5,
    tagline: "Victorian detective's study. Find the killer first.",
    duration: '75min',
    players: '2-6 players',
    escapeRate: '51% escape rate',
    image: 'https://images.unsplash.com/photo-1507842229440-9759c55b6300?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'The Study Victorian detective escape room interior',
  },
  {
    id: 'isolation',
    name: 'ISOLATION',
    difficulty: 'EASY',
    starsFilled: 2,
    starsTotal: 5,
    tagline: 'Space station. Oxygen running out. Work fast.',
    duration: '60min',
    players: '2-4 players',
    escapeRate: '67% escape rate',
    image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Isolation space station escape room interior',
  },
  {
    id: 'heist',
    name: 'THE HEIST',
    difficulty: 'EXPERT',
    starsFilled: 5,
    starsTotal: 5,
    tagline: 'Art gallery heist. Gone very wrong.',
    duration: '90min',
    players: '2-6 players',
    escapeRate: '38% escape rate',
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'The Heist art gallery escape room with security lasers',
  },
];

interface VaultRoomsGridProps {
  onSelectRoom?: (roomId: string) => void;
}

export const VaultRoomsGrid: React.FC<VaultRoomsGridProps> = ({ onSelectRoom }) => {
  return (
    <section
      id="rooms"
      className="bg-[#100e0c] w-full"
      style={{
        paddingTop: '80px',
        paddingBottom: '80px',
        paddingLeft: 'clamp(24px, 6vw, 96px)',
        paddingRight: 'clamp(24px, 6vw, 96px)',
      }}
    >
      {/* Section Header */}
      <div className="mb-12">
        <h2
          className="font-bebas text-[#e8d4b0] tracking-[0.02em] mb-2"
          style={{
            fontSize: 'clamp(36px, 5.5vw, 84px)',
            letterSpacing: '0.02em',
          }}
        >
          CHOOSE YOUR ROOM
        </h2>
        <p className="font-cormorant italic text-[17px] text-[#9a8a7a]">
          Four rooms. Four stories. One way out.
        </p>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ROOMS.map((room, idx) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.12, ease: 'easeOut' }}
            whileHover={{
              scale: 1.02,
              boxShadow: '0 8px 40px rgba(42,212,180,0.22)',
            }}
            onClick={() => onSelectRoom?.(room.id)}
            className="group relative overflow-hidden rounded-[8px] cursor-pointer bg-[#1a1816] border border-[#2a2420] transition-all"
            style={{ borderRadius: '8px' }}
          >
            {/* Room Photo with 4:3 aspect ratio */}
            <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#181614]">
              <img
                src={room.image}
                alt={room.imageAlt}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 filter brightness-[0.78] contrast-[1.1]"
              />

              {/* Bottom gradient overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to top, rgba(16,14,12,0.96) 0%, rgba(16,14,12,0.4) 50%, transparent 100%)',
                }}
              />
            </div>

            {/* Card Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10 flex flex-col items-start">
              {/* Difficulty badge + Stars */}
              <div className="inline-flex items-center gap-2 bg-[#2ad4b4]/15 border border-[#2ad4b4]/40 px-2 py-1 rounded-[3px]">
                <span className="text-[#2ad4b4] text-[12px] tracking-wider">
                  {'★'.repeat(room.starsFilled)}
                  <span className="text-[#3a3030]">
                    {'★'.repeat(room.starsTotal - room.starsFilled)}
                  </span>
                </span>
                <span className="font-inter text-[11px] text-[#2ad4b4] font-semibold tracking-wider">
                  {room.difficulty}
                </span>
              </div>

              {/* Room Name */}
              <h3
                className="font-bebas text-[28px] text-[#e8d4b0] tracking-[0.04em] mt-2 group-hover:text-white transition-colors"
                style={{ letterSpacing: '0.04em' }}
              >
                {room.name}
              </h3>

              {/* Tagline */}
              <p className="font-cormorant italic text-[14px] text-[#9a8a7a] mt-1">
                {room.tagline}
              </p>

              {/* Metadata */}
              <p className="font-inter text-[12px] text-[#6a5a4a] mt-2 tracking-normal">
                {room.duration} · {room.players} · {room.escapeRate}
              </p>

              {/* Gold Link */}
              <span className="font-cormorant italic text-[14px] text-[#c9a55a] group-hover:text-[#ffd685] mt-3 inline-flex items-center gap-1 transition-colors">
                Book This Room →
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
