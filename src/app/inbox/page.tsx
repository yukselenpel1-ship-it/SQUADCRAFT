'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGame } from '@/lib/context/GameContext';
import { InboxMessage } from '@/types/game';
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
  } = useGame();

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    inboxMessages.length > 0 ? inboxMessages[0].id : null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!isCareerHydrated || !isInitialized) {
    return (
      <div className="min-h-screen bg-[#04060A] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-[#00F5A0] border-t-transparent rounded-full animate-spin" />
        <span>Kariyer yükleniyor...</span>
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
        return <DollarSign className="w-4 h-4 text-[#00F5A0]" />;
      case 'SCOUT':
        return <Search className="w-4 h-4 text-[#00D4FF]" />;
      case 'MATCH':
        return <Swords className="w-4 h-4 text-blue-400" />;
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
        return 'Sağlık / Sakatlık';
      case 'TRANSFER':
        return 'Transfer';
      case 'SCOUT':
        return 'Gözlemci';
      case 'MATCH':
        return 'Maç Analizi';
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
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Broadcast Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30">
              // INBOX & COMMUNICATIONS
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              {userClub.name.toUpperCase()} MENAJER MESAJ MERKEZİ
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Inbox className="w-7 h-7 text-[#00F5A0]" />
            Gelen Kutusu
          </h1>
        </div>

        {/* Unread Counter HUD */}
        <div className="flex items-center gap-3 bg-[#080D1A] p-2.5 border border-zinc-800 text-xs font-mono">
          <Mail className="w-4 h-4 text-[#00F5A0]" />
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block font-bold">Okunmamış Bildirim</span>
            <span className="text-base font-black text-white">
              {inboxMessages.filter((m) => !m.isRead).length} <span className="text-xs text-zinc-400 font-normal">MESAJ</span>
            </span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-[#080D1A] p-1.5 border border-zinc-800">
        {[
          { id: 'ALL', label: 'Tüm Mesajlar' },
          { id: 'BOARD', label: 'Yönetim' },
          { id: 'INJURY', label: 'Sağlık' },
          { id: 'TRANSFER', label: 'Transfer' },
          { id: 'SCOUT', label: 'Gözlemci' },
          { id: 'MATCH', label: 'Maç' },
          { id: 'CONTRACT', label: 'Sözleşme' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all ${
              selectedCategory === cat.id
                ? 'bg-[#00F5A0] text-black border border-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Split Inbox Layout: Left List + Right Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Left Message List (5 Cols) */}
        <div className="lg:col-span-5 space-y-2 max-h-[650px] overflow-y-auto pr-1">
          {filteredMessages.length === 0 ? (
            <div className="p-8 bg-[#080D1A] border border-zinc-800 text-center text-zinc-500 font-mono text-xs">
              Bu kategoride mesaj bulunmuyor.
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isSelected = selectedMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`p-3.5 border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#0E1528] border-2 border-[#00F5A0] shadow-xl'
                      : !msg.isRead
                      ? 'bg-[#080D1A] border-zinc-700 hover:border-zinc-600'
                      : 'bg-[#040711] border-zinc-850 hover:border-zinc-700 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 font-mono">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(msg.category)}
                      <span className="text-xs font-bold text-white truncate max-w-[170px] uppercase">
                        {msg.senderName}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 shrink-0">
                      {msg.date}
                    </span>
                  </div>

                  <h3 className={`text-xs font-bold truncate ${!msg.isRead ? 'text-[#00F5A0]' : 'text-zinc-200'}`}>
                    {msg.subject}
                  </h3>

                  <p className="text-[11px] font-mono text-zinc-400 truncate mt-1">
                    {msg.preview}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono">
                    <span className="px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold uppercase">
                      {getCategoryLabel(msg.category)}
                    </span>

                    {!msg.isRead && (
                      <span className="flex items-center gap-1 font-black text-[#00F5A0]">
                        <span className="w-1.5 h-1.5 bg-[#00F5A0] animate-pulse" />
                        YENİ
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Message Reader (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedMessage ? (
            <div className="p-5 sm:p-6 bg-[#080D1A] border border-zinc-800 shadow-2xl flex flex-col justify-between h-full space-y-6">
              <div>
                {/* Header */}
                <div className="pb-4 border-b border-zinc-800 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-black uppercase bg-[#040711] text-[#00F5A0] border border-zinc-800 flex items-center gap-1.5">
                        {getCategoryIcon(selectedMessage.category)}
                        {getCategoryLabel(selectedMessage.category)}
                      </span>
                      <span className="text-xs font-mono text-zinc-500">
                        {selectedMessage.date}
                      </span>
                    </div>

                    <h2 className="text-xl font-black text-white uppercase tracking-tight mt-2">
                      {selectedMessage.subject}
                    </h2>

                    <div className="text-xs font-mono text-zinc-400 mt-1">
                      Gönderen: <strong className="text-zinc-200">{selectedMessage.senderName}</strong> ({selectedMessage.senderRole})
                    </div>
                  </div>

                  <button
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="p-2 bg-[#040711] text-zinc-400 hover:text-rose-400 border border-zinc-800 transition-colors"
                    title="Mesajı Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Content */}
                <div className="py-6 text-sm text-zinc-300 font-mono leading-relaxed whitespace-pre-line">
                  {selectedMessage.body}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 font-mono">
                <div className="flex items-center gap-2">
                  {selectedMessage.actionType === 'REPLY_TRANSFER' && (
                    <Link
                      href="/transfers"
                      className="px-3.5 py-1.5 bg-[#00F5A0] text-black font-bold text-xs uppercase hover:bg-[#00D68B] transition-colors flex items-center gap-1.5 border border-white"
                    >
                      <DollarSign className="w-4 h-4" />
                      Teklife Git & Yanıtla
                    </Link>
                  )}

                  {selectedMessage.actionType === 'VIEW_SQUAD' && (
                    <Link
                      href="/squad"
                      className="px-3.5 py-1.5 bg-[#00F5A0] text-black font-bold text-xs uppercase hover:bg-[#00D68B] transition-colors flex items-center gap-1.5 border border-white"
                    >
                      <HeartPulse className="w-4 h-4" />
                      Sağlık & Kadro Durumunu İncele
                    </Link>
                  )}

                  {selectedMessage.actionType === 'VIEW_TACTICS' && (
                    <Link
                      href="/tactics"
                      className="px-3.5 py-1.5 bg-[#00F5A0] text-black font-bold text-xs uppercase hover:bg-[#00D68B] transition-colors flex items-center gap-1.5 border border-white"
                    >
                      <Swords className="w-4 h-4" />
                      Taktik Masasına Git
                    </Link>
                  )}

                  {selectedMessage.actionType === 'RENEW_CONTRACT' && (
                    <Link
                      href="/squad"
                      className="px-3.5 py-1.5 bg-[#00F5A0] text-black font-bold text-xs uppercase hover:bg-[#00D68B] transition-colors flex items-center gap-1.5 border border-white"
                    >
                      <FileText className="w-4 h-4" />
                      Sözleşme Görüşmesi Başlat
                    </Link>
                  )}

                  {selectedMessage.category === 'BOARD' && managerContract.status === 'OFFERED' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => respondToManagerContractOffer(true)}
                        className="px-3.5 py-1.5 bg-[#00F5A0] text-black font-bold text-xs uppercase hover:bg-[#00D68B] transition-colors border border-white"
                      >
                        Sözleşmeyi Kabul Et
                      </button>
                      <button
                        onClick={() => respondToManagerContractOffer(false)}
                        className="px-3.5 py-1.5 bg-zinc-900 text-zinc-300 font-bold text-xs uppercase hover:bg-zinc-800 transition-colors border border-zinc-750"
                      >
                        Teklifi Reddet
                      </button>
                    </div>
                  )}
                </div>

                <span className="text-[11px] text-zinc-500 font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#00F5A0]" />
                  SquadCraft Kulüp İletişim Sistemi
                </span>
              </div>
            </div>
          ) : (
            <div className="p-12 bg-[#080D1A] border border-zinc-800 text-center text-zinc-500 font-mono text-sm h-full flex flex-col items-center justify-center gap-2">
              <MailOpen className="w-10 h-10 text-zinc-600" />
              <span>Görüntülemek için sol listeden bir mesaj seçin.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
