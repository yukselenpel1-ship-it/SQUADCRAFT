'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { DraftMultiplayerStore, getRecentRoomCodes } from '@/lib/draft/multiplayerStore';
import {
  getMultiplayerSessionId,
  getStoredMultiplayerUsername,
  setStoredMultiplayerUsername,
} from '@/lib/draft/sessionManager';
import { PRESET_4_MANAGERS, PRESET_6_MANAGERS, PRESET_8_MANAGERS } from '@/lib/draft/types';
import { APP_VERSION } from '@/lib/version';
import { FeedbackModal } from '@/components/draft/FeedbackModal';
import {
  Trophy,
  Shield,
  Users,
  Zap,
  ArrowRight,
  ArrowLeft,
  Settings,
  MessageSquare,
  Radio,
  KeyRound,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const PRESET_CONFIGS = {
  4: {
    label: '4 Menajer',
    badge: '4 KİŞİLİK ALFA LİGİ',
    cardDesc: 'Özel bir canlı draft odası kur, arkadaşlarına oda kodunu ilet ve 4 kişilik rekabetçi ligi başlat.',
    summaryTitle: 'LİG AYARLARI // 4 KİŞİLİK ALFA',
    summaryManagers: '4 Menajer (İnsan/Bot)',
    format: '6 Hafta (Çift Devre)',
    tickerText: '4 KİŞİLİK REKABETÇİ KAPALI ALFA LİGİ',
    preset: PRESET_4_MANAGERS,
  },
  6: {
    label: '6 Menajer',
    badge: '6 KİŞİLİK ALFA LİGİ',
    cardDesc: 'Özel bir canlı draft odası kur, arkadaşlarına oda kodunu ilet ve 6 kişilik rekabetçi ligi başlat.',
    summaryTitle: 'LİG AYARLARI // 6 KİŞİLİK ALFA',
    summaryManagers: '6 Menajer (İnsan/Bot)',
    format: '10 Hafta (Çift Devre)',
    tickerText: '6 KİŞİLİK REKABETÇİ KAPALI ALFA LİGİ',
    preset: PRESET_6_MANAGERS,
  },
  8: {
    label: '8 Menajer',
    badge: '8 KİŞİLİK ALFA LİGİ',
    cardDesc: 'Özel bir canlı draft odası kur, arkadaşlarına oda kodunu ilet ve 8 kişilik rekabetçi ligi başlat.',
    summaryTitle: 'LİG AYARLARI // 8 KİŞİLİK ALFA',
    summaryManagers: '8 Menajer (İnsan/Bot)',
    format: '7 Hafta (Tek Devre)',
    tickerText: '8 KİŞİLİK REKABETÇİ KAPALI ALFA LİGİ',
    preset: PRESET_8_MANAGERS,
  },
} as const;

export default function DraftHomePage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [managerCount, setManagerCount] = useState<4 | 6 | 8>(4);
  const currentPreset = PRESET_CONFIGS[managerCount];
  const [isSpectator, setIsSpectator] = useState(false);
  const [recentRooms, setRecentRooms] = useState<string[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createProgressText, setCreateProgressText] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const createInFlightRef = useRef(false);

  useEffect(() => {
    setUsername(getStoredMultiplayerUsername());
    setRecentRooms(getRecentRoomCodes());
    DraftMultiplayerStore.warmupConnection();
    return () => {
      createInFlightRef.current = false;
    };
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createInFlightRef.current || isCreating) return;

    if (!username.trim()) {
      setCreateError('Lütfen bir menajer ismi girin.');
      return;
    }

    createInFlightRef.current = true;
    setCreateError(null);
    setCreateProgressText(null);
    setIsCreating(true);

    try {
      setStoredMultiplayerUsername(username.trim());
      const sessionId = getMultiplayerSessionId();
      const selectedPreset = currentPreset.preset;

      const res = await DraftMultiplayerStore.createRoomAsync(
        username.trim(),
        sessionId,
        selectedPreset,
        roomName.trim() || undefined,
        (_attempt, _max, statusText) => {
          setCreateProgressText(statusText);
        }
      );

      if (!res.success || !res.state) {
        setCreateError(
          `[${res.errorCode || 'SC-MP-011'}] ${res.error || 'Oda oluşturulamadı.'}${
            res.details ? ` (${res.details})` : ''
          }`
        );
        createInFlightRef.current = false;
        setIsCreating(false);
        setCreateProgressText(null);
        return;
      }

      setCreateProgressText('Odaya yönlendiriliyor...');
      router.push(`/draft/room/${res.state.room.roomCode}`);
    } catch (err: any) {
      console.error('Create room error:', err);
      setCreateError(`[SC-MP-011] Oda oluşturulurken beklenmeyen bir hata oluştu: ${err?.message || ''}`);
      createInFlightRef.current = false;
      setIsCreating(false);
      setCreateProgressText(null);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setJoinError('Lütfen bir menajer ismi girin.');
      return;
    }
    if (!joinCode.trim()) {
      setJoinError('Lütfen oda kodunu girin.');
      return;
    }

    setJoinError(null);
    setIsJoining(true);

    try {
      setStoredMultiplayerUsername(username.trim());
      const sessionId = getMultiplayerSessionId();
      const cleanCode = joinCode.trim().toUpperCase();

      const res = await DraftMultiplayerStore.joinRoomAsync(
        cleanCode,
        username.trim(),
        sessionId,
        isSpectator
      );

      if (!res.success) {
        setJoinError(`[${res.errorCode || 'SC-MP-001'}] ${res.error || 'Odaya katılınamadı.'}`);
        setIsJoining(false);
        return;
      }

      router.push(`/draft/room/${cleanCode}`);
    } catch (err: any) {
      console.error('Join room error:', err);
      setJoinError(`[SC-MP-001] Odaya bağlanırken bir hata oluştu: ${err?.message || ''}`);
      setIsJoining(false);
    }
  };

  const handleJoinRecent = (code: string) => {
    setJoinCode(code);
    router.push(`/draft/room/${code}`);
  };

  return (
    <main className="min-h-screen bg-[#f2ede3] text-[#262320] font-inter selection:bg-[#a3262c] selection:text-white">
      <header className="border-b-2 border-[#262320] bg-[#f2ede3]">
        <div className="max-w-[1640px] mx-auto px-5 sm:px-10 py-5 flex flex-wrap gap-4 items-center justify-between">
          <Link href="/" className="font-barlow font-black tracking-tight text-2xl">SQUAD<span className="text-[#a3262c]">CRAFT</span></Link>
          <nav className="flex flex-wrap items-center gap-5 font-barlow font-extrabold uppercase text-sm tracking-wide" aria-label="Oyun menüsü">
            <Link href="/" className="hover:text-[#a3262c]">ANA SAYFA</Link>
            <Link href="/dashboard" className="hover:text-[#a3262c]">KARİYER</Link>
            <span className="border-b-[3px] border-[#a3262c]">DRAFT LEAGUE</span>
          </nav>
          <span className="font-ibm text-[10px] tracking-[0.18em] text-[#776b65]">SQUADCRAFT / COMPETITION SERIES</span>
        </div>
      </header>

      <div className="max-w-[1640px] mx-auto px-5 sm:px-10 pb-20">
        <section className="border-b-2 border-[#262320] grid lg:grid-cols-[1.3fr_0.7fr]">
          <div className="pt-10 pb-12 lg:pr-12">
            <p className="font-ibm text-[11px] tracking-[0.2em] uppercase text-[#a3262c]">01 / ÇEVRİMİÇİ REKABET</p>
            <h1 className="font-barlow font-black uppercase tracking-[-0.06em] leading-[0.8] text-[clamp(5rem,13vw,13rem)] mt-5">DRAFT<span className="text-[#a3262c] block">LEAGUE.</span></h1>
            <p className="font-serif italic text-2xl sm:text-3xl mt-8 max-w-lg">Takımını seçme. Takımını kur. Rakiplerine karşı kendi hikâyeni yaz.</p>
            <div className="flex flex-wrap gap-3 mt-8 font-ibm text-[11px] uppercase tracking-wider">
              <span className="border border-[#2d2925] px-3 py-2">GERÇEK OYUNCULAR</span>
              <span className="border border-[#2d2925] px-3 py-2">ÖZEL ODALAR</span>
              <span className="border border-[#2d2925] px-3 py-2">CANLI DRAFT</span>
            </div>
          </div>
          <div className="relative overflow-hidden min-h-[320px] bg-[#a3262c] text-[#fff6ea] p-8 lg:p-12 flex flex-col justify-between">
            <div aria-hidden className="absolute inset-0 opacity-15" style={{backgroundImage:'repeating-linear-gradient(135deg, transparent 0px, transparent 22px, white 23px, transparent 24px)'}}/>
            <span className="relative font-ibm text-[11px] tracking-[0.2em]">THE SELECTION / 2026</span>
            <div className="relative"><span className="block font-barlow font-black leading-[0.8] tracking-tight text-[clamp(6rem,10vw,11rem)]">01—08</span><p className="font-serif italic text-3xl mt-5">Her seçim bir karar.<br/>Her karar bir rekabet.</p></div>
            <span className="relative font-ibm text-[11px] tracking-[0.15em]">SQUADCRAFT / FOOTBALL PEOPLE</span>
          </div>
        </section>

        <section className="py-8 border-b border-[#262320]/30">
          <div className="flex justify-between flex-wrap items-end gap-4 mb-5"><h2 className="font-barlow font-black uppercase text-4xl sm:text-5xl">OYUNA GİRİŞ</h2><span className="font-ibm text-xs uppercase tracking-[0.15em] text-[#776b65]">MENAJER KİMLİĞİ</span></div>
          <label htmlFor="draft-manager" className="block max-w-xl font-barlow font-bold uppercase text-sm mb-2">MENAJER ADIN</label>
          <input id="draft-manager" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Menajer adını yaz" maxLength={32} className="w-full max-w-xl px-5 py-4 bg-white/50 border-2 border-[#262320] focus:outline-none focus:border-[#a3262c] text-lg" />
        </section>

        <div className="grid lg:grid-cols-2 gap-0 lg:gap-12">
          <section className="py-10 border-b lg:border-b-0 border-[#262320]/30">
            <p className="font-ibm text-[11px] text-[#a3262c] tracking-[0.2em]">01 / HOST</p>
            <h2 className="font-barlow font-black uppercase tracking-tight text-[clamp(3rem,6vw,6rem)] leading-none mt-2">ODA KUR.</h2>
            <p className="font-serif italic text-xl text-[#625a53] mt-2 mb-8">Kendi liginin kurallarını sen belirle.</p>
            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div><label htmlFor="draft-room-name" className="block font-barlow font-extrabold uppercase mb-2">ODA ADI <span className="font-normal text-xs text-[#756d65]">(İSTEĞE BAĞLI)</span></label><input id="draft-room-name" value={roomName} onChange={e=>setRoomName(e.target.value)} placeholder="Örn. Hafta Sonu Ligi" className="w-full border-b-2 border-[#262320] bg-transparent px-1 py-3 focus:outline-none focus:border-[#a3262c]"/></div>
              <fieldset><legend className="font-barlow font-extrabold uppercase mb-3">MENAJER SAYISI</legend><div className="grid grid-cols-3 gap-2">{([4,6,8] as const).map(n=><button key={n} type="button" onClick={()=>setManagerCount(n)} aria-pressed={managerCount===n} className={`border-2 py-4 font-barlow font-black text-3xl ${managerCount===n ? 'bg-[#a3262c] border-[#a3262c] text-white' : 'border-[#262320] hover:bg-[#e4d8cc]'}`}>{n}</button>)}</div></fieldset>
              <div className="border-t border-[#262320]/30 py-4 text-sm"><p className="font-bold">{currentPreset.label}</p><p className="text-[#625a53] mt-1">{currentPreset.cardDesc}</p><p className="text-[#a3262c] mt-2 font-bold">{currentPreset.format}</p></div>
              {createError && <p role="alert" className="text-[#a3262c] font-bold text-sm">{createError}</p>}
              {createProgressText && <p role="status" className="text-sm">{createProgressText}</p>}
              <button type="submit" disabled={isCreating || !username.trim()} className="w-full flex justify-between items-center bg-[#a3262c] text-white p-5 font-barlow font-black uppercase text-xl hover:bg-[#7a1a20] disabled:opacity-50">{isCreating ? 'ODA OLUŞTURULUYOR...' : 'YENİ ODA OLUŞTUR'} <ArrowRight/></button>
            </form>
          </section>
          <section className="py-10 lg:border-l border-[#262320]/30 lg:pl-12">
            <p className="font-ibm text-[11px] text-[#a3262c] tracking-[0.2em]">02 / JOIN</p>
            <h2 className="font-barlow font-black uppercase tracking-tight text-[clamp(3rem,6vw,6rem)] leading-none mt-2">LİGE KATIL.</h2>
            <p className="font-serif italic text-xl text-[#625a53] mt-2 mb-8">Oda kodunu gir. Rakiplerin seni bekliyor.</p>
            <form onSubmit={handleJoinRoom} className="space-y-6">
              <div><label htmlFor="draft-join-code" className="block font-barlow font-extrabold uppercase mb-2">ODA KODU</label><input id="draft-join-code" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} placeholder="ABC123" autoCapitalize="characters" className="w-full border-b-2 border-[#262320] bg-transparent px-1 py-3 font-ibm text-2xl uppercase tracking-[0.2em] focus:outline-none focus:border-[#a3262c]"/></div>
              <label className="flex items-center gap-3 font-barlow font-bold uppercase cursor-pointer"><input type="checkbox" checked={isSpectator} onChange={e=>setIsSpectator(e.target.checked)} className="accent-[#a3262c] h-5 w-5"/> İZLEYİCİ OLARAK KATIL</label>
              {joinError && <p role="alert" className="text-[#a3262c] font-bold text-sm">{joinError}</p>}
              <button disabled={isJoining || !username.trim() || !joinCode.trim()} type="submit" className="w-full flex justify-between items-center border-2 border-[#262320] p-5 font-barlow font-black uppercase text-xl hover:bg-[#262320] hover:text-white disabled:opacity-50">{isJoining ? 'BAĞLANILIYOR...' : 'ODAYA KATIL'} <ArrowRight/></button>
            </form>
            <div className="border-t border-[#262320]/30 mt-12 pt-6"><h3 className="font-barlow font-black text-2xl uppercase mb-4">SON ODALARIN</h3>{recentRooms.length ? <div className="space-y-2">{recentRooms.map(code=><button key={code} type="button" onClick={()=>handleJoinRecent(code)} className="w-full flex justify-between items-center text-left border-b border-[#262320]/20 px-1 py-3 hover:text-[#a3262c] font-ibm tracking-widest">{code}<ArrowRight size={18}/></button>)}</div>:<p className="text-[#766c66] font-serif italic">Henüz katıldığın bir oda yok.</p>}</div>
          </section>
        </div>
        <footer className="border-t-2 border-[#262320] py-6 flex gap-4 flex-wrap justify-between font-ibm text-[10px] tracking-wider uppercase"><span>SQUADCRAFT / DRAFT LEAGUE</span><button type="button" className="underline hover:text-[#a3262c]" onClick={()=>setIsFeedbackOpen(true)}>GERİ BİLDİRİM</button><span>VERSION {APP_VERSION}</span></footer>
      </div>
      <FeedbackModal isOpen={isFeedbackOpen} onClose={()=>setIsFeedbackOpen(false)} />
    </main>
  );
}
