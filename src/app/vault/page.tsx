'use client';

import React, { useState } from 'react';
import Head from 'next/head';
import { VaultNavbar } from '@/components/vault/VaultNavbar';
import { VaultHero } from '@/components/vault/VaultHero';
import { VaultRoomsGrid } from '@/components/vault/VaultRoomsGrid';
import { VaultBookingCalendar, AvailabilityState } from '@/components/vault/VaultBookingCalendar';
import { VaultPricing } from '@/components/vault/VaultPricing';
import { VaultPerfectFor } from '@/components/vault/VaultPerfectFor';
import { VaultTeamBuilding } from '@/components/vault/VaultTeamBuilding';
import { VaultReviews } from '@/components/vault/VaultReviews';
import { VaultStatsStrip } from '@/components/vault/VaultStatsStrip';
import { VaultTealCTA } from '@/components/vault/VaultTealCTA';
import { VaultFooter } from '@/components/vault/VaultFooter';
import { VaultBookingModal } from '@/components/vault/VaultBookingModal';
import { VaultEnquiryModal } from '@/components/vault/VaultEnquiryModal';

export default function VaultPage() {
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('The Vault');
  const [selectedTime, setSelectedTime] = useState('4:00pm');

  const handleOpenBooking = (roomName?: string, timeSlot?: string) => {
    if (roomName) setSelectedRoom(roomName);
    if (timeSlot) setSelectedTime(timeSlot);
    setBookingModalOpen(true);
  };

  const handleCalendarSlotSelect = (roomName: string, time: string, state: AvailabilityState) => {
    if (state === 'booked') return;
    setSelectedRoom(roomName);
    setSelectedTime(time);
    setBookingModalOpen(true);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#100e0c] text-[#e8d4b0] selection:bg-[#2ad4b4] selection:text-[#100e0c] font-inter overflow-x-hidden">
      {/* 1. Navbar */}
      <VaultNavbar onBookClick={() => handleOpenBooking()} />

      {/* 2. Hero */}
      <VaultHero
        onBookClick={() => handleOpenBooking()}
        onViewRoomsClick={() => scrollToSection('rooms')}
      />

      {/* 3. Room Cards — 2x2 Grid */}
      <VaultRoomsGrid
        onSelectRoom={(roomId) => {
          const map: Record<string, string> = {
            vault: 'The Vault',
            study: 'The Study',
            isolation: 'Isolation',
            heist: 'The Heist',
          };
          handleOpenBooking(map[roomId] || 'The Vault');
        }}
      />

      {/* 4. Interactive Booking Calendar */}
      <VaultBookingCalendar onSlotSelect={handleCalendarSlotSelect} />

      {/* 5. Pricing Section */}
      <VaultPricing onGiftCardClick={() => handleOpenBooking('The Vault')} />

      {/* 6. Perfect For */}
      <VaultPerfectFor />

      {/* 7. Team Building */}
      <VaultTeamBuilding onEnquireClick={() => setEnquiryModalOpen(true)} />

      {/* 8. Reviews */}
      <VaultReviews />

      {/* 9. Stats Strip */}
      <VaultStatsStrip />

      {/* 10. Teal CTA */}
      <VaultTealCTA onBookClick={() => handleOpenBooking()} />

      {/* 11. Footer */}
      <VaultFooter
        onBookClick={() => handleOpenBooking()}
        onRoomClick={(r) => handleOpenBooking(r)}
      />

      {/* Interactive Booking Modal */}
      <VaultBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        initialRoom={selectedRoom}
        initialTime={selectedTime}
      />

      {/* Corporate Team Enquiry Modal */}
      <VaultEnquiryModal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
      />
    </div>
  );
}
