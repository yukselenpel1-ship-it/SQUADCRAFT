'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGame } from '@/lib/context/GameContext';
import { InboxMessage } from '@/types/game';
import { CareerClubHero } from '@/components/ui/CareerClubHero';
import {
  Inbox,
  Mail,
  MailOpen,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Building,
  HeartPulse,
  DollarSign,
  Search,
  Swords,
  FileText,
  Clock,
  ArrowRight,
  Shield,
  ChevronRight,
} from 'lucide-react';

export default function InboxPage() {
  const {
    inboxMessages,
    markMessageAsRead,
    deleteMessage,
    userClub,
    managerContract,
    respondToManagerContractOffer,
    isCareerHydrated,
    isInitialized,
    seasonYear,
  } = useGame();

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    inboxMessages.length > 0 ? inboxMessages[0].id : null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!isCareerHydrated || !isInitialized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-[#65F56B] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#65F56B] font-bold">Gelen kutusu yükleniyor...</span>
      </div>
    );
  }

  const selectedMessage = inboxMessages.find((m) => m.id === selectedMessageId) || null;

  const filteredMessages = inboxMessages.filter((m) => {
    if (selectedCategory !== 'ALL' && m.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'BOARD':
        return <Building className="w-4 h-4 text-amber-400" />;
      case 'INJURY':
        return <HeartPulse className="w-4 h-4 text-rose-400" />;
      case 'TRANSFER':
        return <DollarSign className="w-4 h-4 text-[#65F56B]" />;
      case 'SCOUT':
        return <Search className="w-4 h-4 text-[#30D8CE]" />;
      case 'MATCH':
        return <Swords className="w-4 h-4 text-sky-400" />;
      case 'CONTRACT':
        return <FileText className="w-4 h-4 text-purple-400" />;
      default:
        return <Mail className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'BOARD':
        return 'Yönetim';
      case 'INJURY':
        return 'Sağlık';
      case 'TRANSFER':
        return 'Transfer';
      case 'SCOUT':
        return 'Gözlemci';
      case 'MATCH':
        return 'Maç';
      case 'CONTRACT':
        return 'Sözleşme';
      default:
        return 'Genel';
    }
  };

  const handleSelectMessage = (msg: InboxMessage) => {
    setSelectedMessageId(msg.id);
    if (!msg.isRead) {
      markMessageAsRead(msg.id);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* 1. HERO CLUB BANNER */}
      <CareerClubHero
        clubName={userClub.name}
        clubCode={userClub.code}
        primaryColor={userClub.primaryColor}
        secondaryColor={userClub.secondaryColor}
        tagline="Resmi Yazışmalar, Yönetim Kurulu Bildirimleri ve Kulüp Haberleşmesi"
        leagueName="Süper Lig"
        seasonLabel={`Sezon ${seasonYear || '2026/27'}`}
        foundedYear="2024"
        location={`${userClub.city}, Türkiye`}
        stadiumName={userClub.stadium || 'Kartepe Stadyumu'}
        capacity={userClub.stadiumCapacity || '32.000'}
        reputation={userClub.reputation || 82}
      />

      {/* 2. CATEGORY PILLS */}
      <div className="flex items-center gap-2 border-b border-[rgba(125,160,175,0.14)] pb-3 overflow-x-auto select-none">
        {[
          { id: 'ALL', label: 'Tüm Mesajlar' },
          { id: 'BOARD', label: 'Yönetim' },
          { id: 'TRANSFER', label: 'Transfer' },
          { id: 'SCOUT', label: 'Gözlemci' },
          { id: 'INJURY', label: 'Sağlık' },
          { id: 'MATCH', label: 'Maçlar' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-[#65F56B] text-black font-black shadow-[0_0_10px_rgba(101,245,107,0.3)]'
                : 'bg-[#09141B] text-zinc-400 hover:text-white border border-[rgba(125,160,175,0.14)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3. SPLIT PANE: INBOX LIST (LEFT) + MESSAGE DETAIL (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* MESSAGE LIST (5 COLS) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 shadow-xl space-y-2">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,175,0.14)]">
            <span className="text-xs font-black uppercase text-white font-sans flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[#65F56B]" />
              Gelen Mesajlar ({filteredMessages.length})
            </span>
          </div>

          <div className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((msg) => {
                const isSelected = msg.id === selectedMessageId;
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#65F56B]/15 border-[#65F56B]/50 shadow-[0_0_12px_rgba(101,245,107,0.1)]'
                        : msg.isRead
                        ? 'bg-[#0D1C26]/60 border-[rgba(125,160,175,0.1)] hover:bg-[#0D1C26]'
                        : 'bg-[#0D1C26] border-[#65F56B]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 truncate">
                        {getCategoryIcon(msg.category)}
                        <span className="text-[10px] font-mono font-bold text-zinc-400">
                          {getCategoryLabel(msg.category)}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                        {msg.date || 'Bugün'}
                      </span>
                    </div>

                    <h4 className={`text-xs uppercase font-sans truncate ${isSelected || !msg.isRead ? 'font-black text-white' : 'font-bold text-zinc-300'}`}>
                      {msg.subject}
                    </h4>

                    <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5 font-sans">
                      {msg.body}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-zinc-500 font-mono">
                Bu kategoride mesaj bulunmuyor.
              </div>
            )}
          </div>
        </div>

        {/* MESSAGE DETAIL (7 COLS) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-6 shadow-xl flex flex-col justify-between min-h-[450px]">
          {selectedMessage ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,175,0.14)]">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(selectedMessage.category)}
                  <span className="text-xs font-mono font-bold text-zinc-400">
                    {getCategoryLabel(selectedMessage.category)} • {selectedMessage.senderName || selectedMessage.senderRole || 'Kulüp Yönetimi'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-zinc-500">
                    {selectedMessage.date || 'Bugün'}
                  </span>
                  <button
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition"
                    title="Mesajı Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h2 className="text-lg font-black uppercase text-white font-sans">
                {selectedMessage.subject}
              </h2>

              <div className="text-xs text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap bg-[#070D14] p-4 rounded-xl border border-zinc-850">
                {selectedMessage.body}
              </div>

              {selectedMessage.actionable && selectedMessage.actionType && (
                <div className="pt-2">
                  <Link
                    href={
                      selectedMessage.actionType === 'REPLY_TRANSFER' ? '/transfers' :
                      selectedMessage.actionType === 'VIEW_TACTICS' ? '/tactics' :
                      selectedMessage.actionType === 'VIEW_ACADEMY' ? '/academy' :
                      selectedMessage.actionType === 'VIEW_SCOUTING' ? '/scouting' : '/squad'
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#65F56B] to-[#7BFF70] hover:brightness-110 text-black font-black text-xs uppercase tracking-wider transition shadow-md active:scale-95"
                  >
                    <span>İlgili Sayfaya Git</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-zinc-500 font-mono">
              Görüntülemek için soldaki listeden bir mesaj seçin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
