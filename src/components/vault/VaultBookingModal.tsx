'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Calendar, Clock, Users, Shield } from 'lucide-react';
import { ROOMS } from './VaultRoomsGrid';

interface VaultBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoom?: string;
  initialTime?: string;
}

export const VaultBookingModal: React.FC<VaultBookingModalProps> = ({
  isOpen,
  onClose,
  initialRoom = 'The Vault',
  initialTime = '4:00pm',
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string>(initialRoom);
  const [selectedTime, setSelectedTime] = useState<string>(initialTime);
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-14');
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [bookingCode, setBookingCode] = useState<string>('');

  // Synchronize when initial props change
  React.useEffect(() => {
    if (initialRoom) setSelectedRoom(initialRoom);
    if (initialTime) setSelectedTime(initialTime);
  }, [initialRoom, initialTime]);

  // Pricing calculation
  const getPricePerPerson = () => {
    if (playerCount >= 6) return 16;
    return 18; // default weekday/base
  };

  const pricePerPerson = getPricePerPerson();
  const totalPrice = pricePerPerson * playerCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = 'VAULT-' + Math.floor(1000 + Math.random() * 9000);
    setBookingCode(code);
    setIsConfirmed(true);
  };

  const handleReset = () => {
    setIsConfirmed(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleReset}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal dialog */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-xl bg-[#1a1816] border border-[#2ad4b4]/30 rounded-[8px] p-6 sm:p-8 text-[#e8d4b0] shadow-2xl z-10 my-8 overflow-hidden"
          style={{
            boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(42,212,180,0.15)',
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleReset}
            className="absolute top-4 right-4 text-[#9a8a7a] hover:text-[#e8d4b0] p-1 rounded transition-colors"
          >
            <X size={20} />
          </button>

          {!isConfirmed ? (
            <div>
              <div className="mb-6">
                <span className="font-inter text-[11px] uppercase tracking-[0.14em] text-[#2ad4b4]">
                  Instant Reservation
                </span>
                <h3 className="font-bebas text-[32px] text-[#e8d4b0] tracking-wide leading-tight mt-1">
                  SECURE YOUR ESCAPE SLOT
                </h3>
                <p className="font-cormorant italic text-[15px] text-[#9a8a7a]">
                  Edinburgh Old Town · Instant confirmation sent to your inbox.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Room Selector */}
                <div>
                  <label className="block font-inter text-[12px] uppercase text-[#9a8a7a] tracking-[0.08em] mb-1.5">
                    Select Room
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROOMS.map((r) => {
                      const isSelected =
                        selectedRoom.toLowerCase() === r.name.toLowerCase() ||
                        selectedRoom.toLowerCase() === r.id.toLowerCase();
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedRoom(r.name)}
                          className={`p-3 rounded-[4px] border text-left transition-all ${
                            isSelected
                              ? 'bg-[#2ad4b4]/15 border-[#2ad4b4] text-[#2ad4b4]'
                              : 'bg-[#221e1c] border-[#2a2420] text-[#e8d4b0] hover:border-[#9a8a7a]'
                          }`}
                        >
                          <div className="font-bebas text-[17px] tracking-wide">
                            {r.name}
                          </div>
                          <div className="font-inter text-[10px] text-[#9a8a7a]">
                            {r.duration} · {r.difficulty}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-inter text-[12px] uppercase text-[#9a8a7a] tracking-[0.08em] mb-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={13} className="text-[#2ad4b4]" /> Date
                      </span>
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-[#221e1c] border border-[#2a2420] rounded-[4px] px-3 py-2.5 text-[#e8d4b0] font-inter text-[13px] focus:outline-none focus:border-[#2ad4b4]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-inter text-[12px] uppercase text-[#9a8a7a] tracking-[0.08em] mb-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} className="text-[#2ad4b4]" /> Time Slot
                      </span>
                    </label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full bg-[#221e1c] border border-[#2a2420] rounded-[4px] px-3 py-2.5 text-[#e8d4b0] font-inter text-[13px] focus:outline-none focus:border-[#2ad4b4]"
                    >
                      <option value="2:00pm">2:00pm (Available)</option>
                      <option value="4:00pm">4:00pm (Available)</option>
                      <option value="6:00pm">6:00pm (Available)</option>
                      <option value="8:00pm">8:00pm (Available)</option>
                      <option value="9:30pm">9:30pm (Last 2 spots)</option>
                    </select>
                  </div>
                </div>

                {/* Player count stepper */}
                <div>
                  <label className="block font-inter text-[12px] uppercase text-[#9a8a7a] tracking-[0.08em] mb-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={13} className="text-[#2ad4b4]" /> Adventurers ({playerCount} players)
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={2}
                      max={6}
                      value={playerCount}
                      onChange={(e) => setPlayerCount(Number(e.target.value))}
                      className="flex-1 accent-[#2ad4b4] cursor-pointer"
                    />
                    <span className="font-bebas text-[22px] text-[#2ad4b4] min-w-[28px] text-center">
                      {playerCount}
                    </span>
                  </div>
                  <div className="flex justify-between font-inter text-[11px] text-[#6a5a4a] mt-1">
                    <span>Min: 2 players</span>
                    <span>{playerCount === 6 ? 'Group discount applied: £16pp' : 'Standard rate: £18pp'}</span>
                    <span>Max: 6 players</span>
                  </div>
                </div>

                {/* Contact info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-inter text-[12px] text-[#9a8a7a] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Eleanor Vance"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#221e1c] border border-[#2a2420] rounded-[4px] px-3 py-2 text-[#e8d4b0] font-inter text-[13px] focus:outline-none focus:border-[#2ad4b4]"
                    />
                  </div>
                  <div>
                    <label className="block font-inter text-[12px] text-[#9a8a7a] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#221e1c] border border-[#2a2420] rounded-[4px] px-3 py-2 text-[#e8d4b0] font-inter text-[13px] focus:outline-none focus:border-[#2ad4b4]"
                    />
                  </div>
                </div>

                {/* Pricing Summary Block */}
                <div className="bg-[#221e1c] border border-[#2a2420] rounded-[4px] p-3.5 flex items-center justify-between mt-2">
                  <div>
                    <div className="font-inter text-[12px] text-[#9a8a7a]">
                      Estimated Total ({playerCount} × £{pricePerPerson})
                    </div>
                    <div className="font-cormorant italic text-[12px] text-[#c9a55a]">
                      No upfront charges · Pay upon arrival at Old Town
                    </div>
                  </div>
                  <div className="font-bebas text-[30px] text-[#2ad4b4] leading-none">
                    £{totalPrice}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="font-inter text-[14px] font-semibold text-[#100e0c] bg-[#2ad4b4] hover:bg-[#22b89e] py-3.5 rounded-[4px] transition-colors mt-2 cursor-pointer shadow-lg hover:scale-[1.01]"
                >
                  Confirm Reservation →
                </button>
              </form>
            </div>
          ) : (
            /* Confirmation state */
            <div className="py-6 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#2ad4b4]/15 border border-[#2ad4b4] flex items-center justify-center text-[#2ad4b4] mb-4">
                <CheckCircle size={36} />
              </div>

              <span className="font-inter text-[11px] uppercase tracking-[0.16em] text-[#2ad4b4]">
                Booking Confirmed
              </span>

              <h3 className="font-bebas text-[36px] text-[#e8d4b0] tracking-wide mt-1">
                SEE YOU IN THE VAULT
              </h3>

              <div className="bg-[#221e1c] border border-[#2a2420] rounded-[6px] p-5 my-5 w-full text-left">
                <div className="flex justify-between items-center border-b border-[#2a2420] pb-2 mb-3">
                  <span className="font-inter text-[12px] text-[#9a8a7a]">Booking Reference</span>
                  <span className="font-bebas text-[20px] text-[#2ad4b4] tracking-wider">{bookingCode}</span>
                </div>
                <div className="space-y-1.5 font-inter text-[13px] text-[#e8d4b0]">
                  <p><span className="text-[#9a8a7a]">Room:</span> {selectedRoom}</p>
                  <p><span className="text-[#9a8a7a]">Date & Time:</span> {selectedDate} at {selectedTime}</p>
                  <p><span className="text-[#9a8a7a]">Party:</span> {playerCount} Players (£{totalPrice} total)</p>
                  <p><span className="text-[#9a8a7a]">Lead Adventurer:</span> {fullName || 'Valued Guest'}</p>
                </div>
              </div>

              <p className="font-cormorant italic text-[14px] text-[#9a8a7a] max-w-sm mx-auto">
                A confirmation voucher and briefing packet has been sent to <span className="text-[#e8d4b0]">{email || 'your email'}</span>. Please arrive 15 minutes before your slot time.
              </p>

              <button
                type="button"
                onClick={handleReset}
                className="mt-6 font-inter text-[13px] font-semibold text-[#100e0c] bg-[#2ad4b4] hover:bg-[#22b89e] px-8 py-2.5 rounded-[4px] transition-colors cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
