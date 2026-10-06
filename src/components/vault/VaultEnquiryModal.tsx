'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Briefcase, Users, Calendar, Mail } from 'lucide-react';

interface VaultEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VaultEnquiryModal: React.FC<VaultEnquiryModalProps> = ({ isOpen, onClose }) => {
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [groupSize, setGroupSize] = useState('12');
  const [includeBar, setIncludeBar] = useState(true);
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
  };

  const handleReset = () => {
    setIsSent(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleReset}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-[#1a1816] border border-[#c9a55a]/40 rounded-[8px] p-6 sm:p-8 text-[#e8d4b0] shadow-2xl z-10 my-8"
          style={{
            boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(201,165,90,0.15)',
          }}
        >
          <button
            type="button"
            onClick={handleReset}
            className="absolute top-4 right-4 text-[#9a8a7a] hover:text-[#e8d4b0] p-1 rounded transition-colors"
          >
            <X size={20} />
          </button>

          {!isSent ? (
            <div>
              <div className="mb-6">
                <span className="font-inter text-[11px] uppercase tracking-[0.14em] text-[#c9a55a]">
                  Corporate & Private Hire
                </span>
                <h3 className="font-bebas text-[32px] text-[#e8d4b0] tracking-wide leading-tight mt-1">
                  TEAM BUILDING ENQUIRY
                </h3>
                <p className="font-cormorant italic text-[15px] text-[#9a8a7a]">
                  Dedicated Games Master, debrief session, and optional Royal Mile drinks package.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block font-inter text-[12px] text-[#9a8a7a] mb-1">
                    Company / Organisation
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Studio"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-[#221e1c] border border-[#2a2420] rounded-[4px] px-3 py-2 text-[#e8d4b0] font-inter text-[13px] focus:outline-none focus:border-[#c9a55a]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-inter text-[12px] text-[#9a8a7a] mb-1">
                      Lead Contact
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Charlotte"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-[#221e1c] border border-[#2a2420] rounded-[4px] px-3 py-2 text-[#e8d4b0] font-inter text-[13px] focus:outline-none focus:border-[#c9a55a]"
                    />
                  </div>
                  <div>
                    <label className="block font-inter text-[12px] text-[#9a8a7a] mb-1">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="charlotte@acme.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#221e1c] border border-[#2a2420] rounded-[4px] px-3 py-2 text-[#e8d4b0] font-inter text-[13px] focus:outline-none focus:border-[#c9a55a]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-inter text-[12px] text-[#9a8a7a] mb-1">
                      Estimated Team Size
                    </label>
                    <select
                      value={groupSize}
                      onChange={(e) => setGroupSize(e.target.value)}
                      className="w-full bg-[#221e1c] border border-[#2a2420] rounded-[4px] px-3 py-2 text-[#e8d4b0] font-inter text-[13px] focus:outline-none focus:border-[#c9a55a]"
                    >
                      <option value="6-10">6–10 Players (From £14pp)</option>
                      <option value="11-20">11–20 Players</option>
                      <option value="21-30">21–30 Players (Multi-room battle)</option>
                      <option value="30+">30+ Full Venue Hire</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-inter text-[12px] text-[#9a8a7a] mb-1">
                      Event Window
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Next Thursday afternoon"
                      className="w-full bg-[#221e1c] border border-[#2a2420] rounded-[4px] px-3 py-2 text-[#e8d4b0] font-inter text-[13px] focus:outline-none focus:border-[#c9a55a]"
                    />
                  </div>
                </div>

                {/* Drinks package toggle */}
                <label className="flex items-center gap-3 p-3 bg-[#221e1c] border border-[#2a2420] rounded-[4px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBar}
                    onChange={(e) => setIncludeBar(e.target.checked)}
                    className="accent-[#c9a55a] w-4 h-4 rounded cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-inter text-[13px] text-[#e8d4b0]">
                      Include Royal Mile Bar debrief & drinks package
                    </span>
                    <span className="font-cormorant italic text-[12px] text-[#9a8a7a]">
                      Reserved seating, craft ales & spirits tasting
                    </span>
                  </div>
                </label>

                <button
                  type="submit"
                  className="font-inter text-[14px] font-semibold text-[#100e0c] bg-[#c9a55a] hover:bg-[#dfba6a] py-3.5 rounded-[4px] transition-colors mt-2 cursor-pointer shadow-lg"
                >
                  Submit Team Request →
                </button>
              </form>
            </div>
          ) : (
            <div className="py-6 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#c9a55a]/15 border border-[#c9a55a] flex items-center justify-center text-[#c9a55a] mb-4">
                <CheckCircle size={36} />
              </div>

              <span className="font-inter text-[11px] uppercase tracking-[0.16em] text-[#c9a55a]">
                Enquiry Received
              </span>

              <h3 className="font-bebas text-[36px] text-[#e8d4b0] tracking-wide mt-1">
                WE WILL BE IN TOUCH
              </h3>

              <p className="font-cormorant italic text-[15px] text-[#9a8a7a] max-w-sm mx-auto my-4">
                Thank you, {contactName || 'Adventurer'}! Our Events Master will review your requirements for {company || 'your team'} and send customized package options within 2 hours.
              </p>

              <button
                type="button"
                onClick={handleReset}
                className="mt-4 font-inter text-[13px] font-semibold text-[#100e0c] bg-[#c9a55a] hover:bg-[#dfba6a] px-8 py-2.5 rounded-[4px] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
