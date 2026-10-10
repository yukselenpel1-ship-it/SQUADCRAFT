'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGame } from '@/lib/context/GameContext';
import { InboxMessage } from '@/types/game';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { formatDateTurkish } from '@/lib/career';
import { CareerLoadingState } from '@/components/career/CareerLoadingState';
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
  Flame,
  Check,
  Compass,
} from 'lucide-react';

export default function InboxPage() {
  const {
    inboxMessages,
    markMessageAsRead,
    deleteMessage,
    userClub,
    managerContract,
    respondToManagerContractOffer,
    currentDate,
    isCareerHydrated,
    isInitialized,
  } = useGame();

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    inboxMessages.length > 0 ? inboxMessages[0].id : null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isCareerHydrated || !isInitialized) {
    return (
      <CareerLoadingState
        title="GELEN KUTUSU YÜKLENİYOR"
        message="Yönetim mesajları, scout bildirimleri ve sağlık raporları senkronize ediliyor..."
      />
    );
  }

  const selectedMessage = inboxMessages.find((m) => m.id === selectedMessageId) || (inboxMessages.length > 0 ? inboxMessages[0] : null);

  const filteredMessages = inboxMessages.filter((m) => {
    if (selectedCategory !== 'ALL' && m.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const unreadCount = inboxMessages.filter((m) => !m.isRead).length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'BOARD':
        return <Building className="w-4 h-4 text-[#ffd34f]" />;
      case 'INJURY':
        return <HeartPulse className="w-4 h-4 text-[#ff5365]" />;
      case 'TRANSFER':
        return <DollarSign className="w-4 h-4 text-[#b8ff3d]" />;
      case 'SCOUT':
      case 'SCOUTING':
        return <Compass className="w-4 h-4 text-[#21dfbd]" />;
      case 'MATCH':
        return <Swords className="w-4 h-4 text-[#4FE4FF]" />;
      case 'CONTRACT':
        return <FileText className="w-4 h-4 text-purple-400" />;
      default:
        return <Mail className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'BOARD':
        return 'YÖNETİM';
      case 'INJURY':
        return 'SAĞLIK';
      case 'TRANSFER':
        return 'TRANSFER';
      case 'SCOUT':
      case 'SCOUTING':
        return 'GÖZLEMCİ';
      case 'MATCH':
        return 'MAÇ ANALİZİ';
      case 'CONTRACT':
        return 'SÖZLEŞME';
      default:
        return 'GENEL';
    }
  };

  const handleSelectMessage = (msg: InboxMessage) => {
    setSelectedMessageId(msg.id);
    if (!msg.isRead) {
      markMessageAsRead(msg.id);
    }
  };

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="sc-editorial-restyle sc-inbox-editorial space-y-5 px-4 sm:px-8 lg:px-12 py-6 pb-20 max-w-[1500px] mx-auto animate-in fade-in duration-300">
      {/* 1. BROADCAST INBOX HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#090d0a] via-[#0d130f] to-[#090d0a] border border-white/10 p-5 md:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#b8ff3d]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-40 bg-[#4FE4FF]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Title */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest bg-[#b8ff3d]/15 text-[#b8ff3d] border border-[#b8ff3d]/30">
                // OPERATIONS INBOX & COMMUNICATIONS
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#eee4d8] text-[#453b33] border border-[#d3c5b6]">
                {formatDateTurkish(currentDate, false)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#b8ff3d]/10 border border-[#b8ff3d]/20 flex items-center justify-center text-[#b8ff3d]">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#211e1a] tracking-tight uppercase font-barlow">
                  MENAJER GELEN KUTUSU
                </h1>
                <p className="text-xs text-zinc-400 font-mono">
                  {userClub.name.toUpperCase()} • YÖNETİM, SAĞLIK HEYETİ, TRANSFER VE GÖZLEMCİ BİLDİRİMLERİ
                </p>
              </div>
            </div>
          </div>

          {/* Right Unread HUD */}
          <div className="flex items-center gap-4 bg-[#050706]/90 rounded-2xl border border-white/10 p-4 shadow-xl shrink-0 font-mono">
            <div className="w-12 h-12 rounded-xl bg-[#b8ff3d]/10 border border-[#b8ff3d]/30 flex items-center justify-center text-[#b8ff3d]">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                OKUNMAMIŞ BİLDİRİMLER
              </span>
              <div className="text-xl font-black text-[#211e1a] mt-0.5 flex items-center gap-2">
                <span className={unreadCount > 0 ? 'text-[#b8ff3d]' : 'text-zinc-500'}>
                  {unreadCount} MESAJ
                </span>
                {unreadCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#b8ff3d] animate-ping" />
                )}
              </div>
              <span className="text-[10px] text-zinc-500 block">
                Toplam {inboxMessages.length} kayıtlı yazışma
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-[#b8ff3d]/10 border border-[#b8ff3d]/40 rounded-xl text-xs font-mono text-[#b8ff3d] font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. CATEGORY FILTERS */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#fffaf2] rounded-2xl border border-[#d2c5b7] overflow-x-auto scrollbar-none font-mono text-xs">
        {[
          { id: 'ALL', label: 'TÜMÜ' },
          { id: 'BOARD', label: 'YÖNETİM KURULU' },
          { id: 'TRANSFER', label: 'TRANSFERLER' },
          { id: 'SCOUT', label: 'GÖZLEM RAPORLARI' },
          { id: 'INJURY', label: 'SAĞLIK & REVİR' },
          { id: 'MATCH', label: 'MAÇ ANALİZİ' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl font-bold uppercase transition-all shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-[#9b2529] text-white font-black shadow-[0_0_12px_rgba(184,255,61,0.3)]'
                : 'text-[#62564b] hover:text-[#211e1a] hover:bg-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3. SPLIT INBOX LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[440px] items-start">
        {/* Left Message Cards List (5 Cols) */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
          {filteredMessages.length === 0 ? (
            <div className="p-12 bg-[#fffaf2] rounded-2xl border border-[#d2c5b7] text-center text-[#74675c] font-mono text-xs">
              Bu kategoride herhangi bir bildirim bulunmuyor.
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isSelected = selectedMessage?.id === msg.id;

              return (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#f3e8dc] border-2 border-[#9b2529]'
                      : !msg.isRead
                      ? 'bg-[#fffaf2] border-[#cdbfb1] hover:border-white/30'
                      : 'bg-[#eee4d8]/80 border-[#dfd3c7] opacity-70 hover:opacity-100 hover:border-[#d2c5b7]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#eee4d8] border border-[#d2c5b7] flex items-center justify-center shrink-0">
                        {getCategoryIcon(msg.category)}
                      </div>
                      <span className="text-xs font-bold text-[#211e1a] truncate max-w-[170px] uppercase">
                        {msg.senderName}
                      </span>
                    </div>

                    <span className="text-[10px] text-[#74675c] font-mono shrink-0">
                      {msg.date}
                    </span>
                  </div>

                  <h3 className={`text-sm font-bold leading-snug mt-1 line-clamp-2 ${!msg.isRead ? 'text-[#8f2830]' : 'text-[#332b25]'}`}>
                    {msg.subject}
                  </h3>

                  <p className="text-xs font-inter text-[#62564b] line-clamp-2 mt-1">
                    {msg.preview}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono pt-2 border-t border-[#dfd3c7]">
                    <span className="px-2 py-0.5 bg-[#eee4d8] border border-[#d2c5b7] text-[#62564b] font-bold uppercase rounded">
                      {getCategoryLabel(msg.category)}
                    </span>

                    {!msg.isRead && (
                      <span className="flex items-center gap-1 font-black text-[#8f2830]">
                        <span className="w-1.5 h-1.5 bg-[#9b2529] rounded-full animate-pulse" />
                        OKUNMADI
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Reader (Official Club Letterhead) (7 Cols) */}
        <div className="lg:col-span-7 sticky top-6">
          {selectedMessage ? (
            <div className="bg-[#fffaf2] rounded-2xl border border-[#d2c5b7] shadow-2xl overflow-hidden flex flex-col justify-between min-h-[440px]">
              {/* Official Letterhead Header */}
              <div className="relative p-6 bg-[#e9dfd3] border-b border-[#d2c5b7]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ClubBadge
                      code={userClub.code}
                      primaryColor={userClub.primaryColor}
                      secondaryColor={userClub.secondaryColor}
                      size="md"
                    />
                    <div>
                      <div className="text-xs font-inter text-[#8f2830] font-bold uppercase tracking-wide">
                        // RESMİ KULÜP YAZIŞMASI • İÇ İLETİŞİM
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-[#211e1a] uppercase tracking-tight font-barlow mt-1">
                        {userClub.name.toUpperCase()} FUTBOL KULÜBÜ
                      </h2>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      deleteMessage(selectedMessage.id);
                      showToast('Mesaj silindi.');
                    }}
                    className="p-2.5 rounded-xl bg-[#eee4d8] text-[#62564b] hover:text-[#ff5365] border border-[#d2c5b7] hover:border-[#ff5365]/30 transition-colors"
                    title="Mesajı Arşivden Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sender & Subject Dossier */}
                <div className="mt-5 p-3.5 bg-[#eee4d8] rounded-xl border border-[#dfd3c7] space-y-1 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#74675c]">KİMDEN:</span>
                    <strong className="text-[#211e1a] font-bold">{selectedMessage.senderName} ({selectedMessage.senderRole})</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#74675c]">KONU:</span>
                    <span className="text-[#8f2830] font-bold">{selectedMessage.subject}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#74675c]">TARİH / SAAT:</span>
                    <span className="text-[#62564b]">{selectedMessage.date}</span>
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <div className="p-6 md:p-8 flex-1 text-[15px] sm:text-base text-[#29231e] font-inter leading-7 whitespace-pre-line">
                {selectedMessage.body}
              </div>

              {/* Contextual Action Buttons Footer */}
              <div className="p-5 bg-[#eee4d8] border-t border-[#d2c5b7] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                <div className="flex items-center gap-2">
                  {selectedMessage.actionType === 'REPLY_TRANSFER' && (
                    <Link
                      href="/transfers"
                      className="px-4 py-2.5 bg-[#9b2529] hover:bg-[#741d23] text-white font-black uppercase rounded-xl transition-all shadow-[0_0_12px_rgba(184,255,61,0.3)] flex items-center gap-1.5"
                    >
                      <DollarSign className="w-4 h-4" />
                      Teklife Git & Yanıtla
                    </Link>
                  )}

                  {selectedMessage.actionType === 'VIEW_SQUAD' && (
                    <Link
                      href="/squad"
                      className="px-4 py-2.5 bg-[#9b2529] hover:bg-[#741d23] text-white font-black uppercase rounded-xl transition-all shadow-[0_0_12px_rgba(184,255,61,0.3)] flex items-center gap-1.5"
                    >
                      <HeartPulse className="w-4 h-4" />
                      Kadro & Sağlık Durumunu İncele
                    </Link>
                  )}

                  {selectedMessage.actionType === 'VIEW_TACTICS' && (
                    <Link
                      href="/tactics"
                      className="px-4 py-2.5 bg-[#9b2529] hover:bg-[#741d23] text-white font-black uppercase rounded-xl transition-all shadow-[0_0_12px_rgba(184,255,61,0.3)] flex items-center gap-1.5"
                    >
                      <Swords className="w-4 h-4" />
                      Taktik Tahtasına Git
                    </Link>
                  )}

                  {selectedMessage.category === 'BOARD' && managerContract.status === 'OFFERED' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          respondToManagerContractOffer(true);
                          showToast('Yeni sözleşme imzalandı!');
                        }}
                        className="px-4 py-2.5 bg-[#9b2529] hover:bg-[#741d23] text-white font-black uppercase rounded-xl transition-all shadow-[0_0_12px_rgba(184,255,61,0.3)] flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        Sözleşmeyi İmzala
                      </button>
                      <button
                        onClick={() => {
                          respondToManagerContractOffer(false);
                          showToast('Sözleşme teklifi reddedildi.');
                        }}
                        className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-[#453c34] font-bold uppercase rounded-xl border border-[#d2c5b7]"
                      >
                        Reddet
                      </button>
                    </div>
                  )}

                  {(selectedMessage.category === 'SCOUT' || selectedMessage.category === 'SCOUTING') && (
                    <Link
                      href="/scouting"
                      className="px-4 py-2.5 bg-[#9b2529] hover:bg-[#741d23] text-white font-black uppercase rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Compass className="w-4 h-4" />
                      Gözlem Raporlarına Git
                    </Link>
                  )}
                </div>

                <div className="text-[11px] text-[#74675c] font-bold flex items-center gap-1.5 ml-auto">
                  <Shield className="w-3.5 h-3.5 text-[#8f2830]" />
                  <span>SQUADCRAFT 26 // RESMİ İLETİŞİM PROTOKOLÜ</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 bg-[#fffaf2] rounded-2xl border border-[#d2c5b7] text-center text-[#74675c] font-mono text-sm h-full flex flex-col items-center justify-center gap-2.5 min-h-[400px]">
              <MailOpen className="w-12 h-12 text-zinc-600" />
              <span>Görüntülemek için sol listeden bir mesaj seçin.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
