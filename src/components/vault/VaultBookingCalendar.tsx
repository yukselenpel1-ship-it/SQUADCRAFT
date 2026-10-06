'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export type AvailabilityState = 'available' | 'last2' | 'booked';

export interface CalendarSlot {
  time: string;
  vault: AvailabilityState;
  study: AvailabilityState;
  isolation: AvailabilityState;
  heist: AvailabilityState;
}

export const CALENDAR_DATA: CalendarSlot[] = [
  {
    time: '2:00pm',
    vault: 'available',
    study: 'available',
    isolation: 'last2',
    heist: 'available',
  },
  {
    time: '4:00pm',
    vault: 'booked',
    study: 'available',
    isolation: 'available',
    heist: 'last2',
  },
  {
    time: '6:00pm',
    vault: 'available',
    study: 'last2',
    isolation: 'available',
    heist: 'available',
  },
  {
    time: '8:00pm',
    vault: 'available',
    study: 'available',
    isolation: 'booked',
    heist: 'available',
  },
  {
    time: '9:30pm',
    vault: 'last2',
    study: 'available',
    isolation: 'available',
    heist: 'booked',
  },
];

interface VaultBookingCalendarProps {
  onSlotSelect?: (roomName: string, time: string, state: AvailabilityState) => void;
}

interface CellProps {
  state: AvailabilityState;
  roomName: string;
  time: string;
  onSelect?: (roomName: string, time: string, state: AvailabilityState) => void;
}

const CalendarCell: React.FC<CellProps> = ({ state, roomName, time, onSelect }) => {
  const [hovered, setHovered] = useState(false);

  if (state === 'booked') {
    return (
      <div
        className="h-12 flex items-center justify-center rounded-[4px] bg-[#1a1816] border border-[#2a2420] text-[#4a3a2a] font-inter text-[13px] cursor-not-allowed select-none px-3"
      >
        Fully Booked
      </div>
    );
  }

  if (state === 'last2') {
    return (
      <button
        type="button"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelect?.(roomName, time, state)}
        className="h-12 w-full flex items-center justify-center rounded-[4px] border font-inter text-[13px] transition-all duration-150 cursor-pointer select-none px-3 font-normal"
        style={{
          backgroundColor: hovered ? '#c9a55a' : 'rgba(201,165,90,0.1)',
          borderColor: hovered ? '#c9a55a' : 'rgba(201,165,90,0.4)',
          color: hovered ? '#100e0c' : '#c9a55a',
          fontWeight: hovered ? 600 : 400,
        }}
      >
        {hovered ? 'Book →' : 'Last 2 spots'}
      </button>
    );
  }

  // state === 'available'
  return (
    <button
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect?.(roomName, time, state)}
      className="h-12 w-full flex items-center justify-center rounded-[4px] border font-inter text-[13px] transition-all duration-150 cursor-pointer select-none px-3"
      style={{
        backgroundColor: hovered ? '#2ad4b4' : '#1e2e2c',
        borderColor: hovered ? '#2ad4b4' : 'rgba(42,212,180,0.3)',
        color: hovered ? '#100e0c' : '#2ad4b4',
        fontWeight: hovered ? 600 : 400,
      }}
    >
      {hovered ? 'Book →' : 'Available'}
    </button>
  );
};

export const VaultBookingCalendar: React.FC<VaultBookingCalendarProps> = ({ onSlotSelect }) => {
  return (
    <section
      id="calendar"
      className="bg-[#1a1816] w-full"
      style={{
        paddingTop: '80px',
        paddingBottom: '80px',
        paddingLeft: 'clamp(24px, 6vw, 96px)',
        paddingRight: 'clamp(24px, 6vw, 96px)',
      }}
    >
      {/* Section Header */}
      <div className="mb-8">
        <h2
          className="font-bebas text-[#e8d4b0] tracking-[0.02em] mb-2"
          style={{
            fontSize: 'clamp(32px, 4.5vw, 72px)',
            letterSpacing: '0.02em',
          }}
        >
          BOOK YOUR SLOT
        </h2>
        <p className="font-cormorant italic text-[16px] text-[#9a8a7a] mb-12">
          Select a room and time — instant confirmation by email.
        </p>
      </div>

      {/* Colour Legend */}
      <div className="flex flex-row flex-wrap items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-[2px] bg-[#2ad4b4] inline-block shadow-[0_0_6px_rgba(42,212,180,0.5)]" />
          <span className="font-inter text-[13px] text-[#e8d4b0]">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-[2px] bg-[#c9a55a] inline-block shadow-[0_0_6px_rgba(201,165,90,0.5)]" />
          <span className="font-inter text-[13px] text-[#e8d4b0]">Last 2 spots</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-[2px] bg-[#2a2420] inline-block border border-[#3a3028]" />
          <span className="font-inter text-[13px] text-[#9a8a7a]">Fully Booked</span>
        </div>
      </div>

      {/* Responsive Calendar Matrix */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="min-w-[620px]">
          {/* Header row */}
          <div className="grid grid-cols-5 gap-3 pb-3 border-b border-[#2a2420] mb-3 text-left">
            <span className="font-inter text-[13px] text-[#9a8a7a] tracking-[0.06em] uppercase">
              Time
            </span>
            <span className="font-inter text-[13px] text-[#9a8a7a] tracking-[0.06em] uppercase">
              The Vault
            </span>
            <span className="font-inter text-[13px] text-[#9a8a7a] tracking-[0.06em] uppercase">
              The Study
            </span>
            <span className="font-inter text-[13px] text-[#9a8a7a] tracking-[0.06em] uppercase">
              Isolation
            </span>
            <span className="font-inter text-[13px] text-[#9a8a7a] tracking-[0.06em] uppercase">
              The Heist
            </span>
          </div>

          {/* Slots rows */}
          <div className="flex flex-col gap-3">
            {CALENDAR_DATA.map((slot) => (
              <div key={slot.time} className="grid grid-cols-5 gap-3 items-center">
                {/* Time cell */}
                <div className="font-bebas text-[22px] text-[#e8d4b0] tracking-wide pl-1">
                  {slot.time}
                </div>

                {/* The Vault */}
                <CalendarCell
                  state={slot.vault}
                  roomName="The Vault"
                  time={slot.time}
                  onSelect={onSlotSelect}
                />

                {/* The Study */}
                <CalendarCell
                  state={slot.study}
                  roomName="The Study"
                  time={slot.time}
                  onSelect={onSlotSelect}
                />

                {/* Isolation */}
                <CalendarCell
                  state={slot.isolation}
                  roomName="Isolation"
                  time={slot.time}
                  onSelect={onSlotSelect}
                />

                {/* The Heist */}
                <CalendarCell
                  state={slot.heist}
                  roomName="The Heist"
                  time={slot.time}
                  onSelect={onSlotSelect}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Note below grid */}
      <div className="mt-8 pt-4 border-t border-[#2a2420]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="font-inter text-[13px] text-[#6a5a4a]">
          All bookings receive immediate email confirmation. Need a specific date? Call us.
        </p>
        <a
          href="tel:+441310000000"
          className="font-inter text-[13px] text-[#2ad4b4] hover:text-[#22b89e] transition-colors inline-flex items-center gap-1 font-medium"
        >
          +44 (0)131 000 0000
        </a>
      </div>
    </section>
  );
};
