'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { useGame } from '@/lib/context/GameContext';
import { loadCareerMetadata, loadCareerState } from '@/lib/career';
import { FeedbackModal } from '@/components/draft/FeedbackModal';
import SquadCraftHome from '@/components/theme/SquadCraftHome';

type CareerPreview = { userClub: { id?: string; name: string }; seasonYear: number | string; currentDate?: string };

export default function MainMenuPage() {
  const router = useRouter();
  const { loadExistingCareer, isCareerHydrated, hasCareerSave, savedCareerPreview, resetEntireCareer } = useGame();
  const [savedData, setSavedData] = useState<CareerPreview | null>(null);
  const [isNewCareerConfirmOpen, setIsNewCareerConfirmOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    const meta = loadCareerMetadata();
    if (meta?.exists) {
      setSavedData({
        userClub: { id: meta.userClubId, name: meta.clubName },
        seasonYear: meta.seasonYear,
        currentDate: meta.currentDate,
      });
    }

    if (isCareerHydrated) {
      if (hasCareerSave && savedCareerPreview) {
        setSavedData(savedCareerPreview);
      } else if (!meta) {
        try {
          const direct = loadCareerState();
          if (direct?.clubs && direct.userClubId) {
            const userClub = direct.clubs.find((club) => club.id === direct.userClubId) || direct.clubs[0];
            setSavedData({ userClub, seasonYear: direct.seasonYear || '2026/27', currentDate: direct.currentDate });
          } else {
            setSavedData(null);
          }
        } catch {
          setSavedData(null);
        }
      }
    }
  }, [isCareerHydrated, hasCareerSave, savedCareerPreview]);

  const handleContinueCareer = useCallback(async () => {
    const success = await loadExistingCareer();
    router.push(success ? '/dashboard' : '/career/new');
  }, [loadExistingCareer, router]);

  const handleNewCareerRequest = useCallback(() => {
    if (savedData) setIsNewCareerConfirmOpen(true);
    else router.push('/career/new');
  }, [savedData, router]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isFeedbackOpen || isNewCareerConfirmOpen || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key.toLowerCase() === 'd') router.push('/draft');
      else if (event.key.toLowerCase() === 'k') handleNewCareerRequest();
      else if (event.key.toLowerCase() === 'm' || event.key === 'F1') {
        event.preventDefault();
        setIsFeedbackOpen(true);
      } else if (event.key.toLowerCase() === 'c' && savedData) handleContinueCareer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFeedbackOpen, isNewCareerConfirmOpen, savedData, router, handleContinueCareer, handleNewCareerRequest]);

  return (
    <>
      <SquadCraftHome
        hasCareer={Boolean(savedData)}
        careerClubName={savedData?.userClub.name}
        onContinueCareer={handleContinueCareer}
        onNewCareer={handleNewCareerRequest}
        onFeedback={() => setIsFeedbackOpen(true)}
      />

      {isNewCareerConfirmOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="new-career-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#14233A] bg-[#07101C] p-6 text-zinc-200 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400">DİKKAT // MEVCUT KAYIT</div>
                <h3 id="new-career-title" className="text-base font-black uppercase text-white">Yeni Kariyer Başlatılsın mı?</h3>
              </div>
            </div>
            <p className="mb-6 text-xs leading-relaxed text-zinc-300">Mevcut kariyer kaydınız silinecek. Yeni kariyer başlatmak istiyor musunuz?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsNewCareerConfirmOpen(false)} className="rounded-xl border border-[#14233A] bg-[#081325] px-4 py-2 text-xs font-bold text-zinc-300">İPTAL</button>
              <button onClick={async () => { setIsNewCareerConfirmOpen(false); await resetEntireCareer(); setSavedData(null); router.push('/career/new'); }} className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-black text-white">YENİ KARİYER BAŞLAT</button>
            </div>
          </div>
        </div>
      )}

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} route="/" gamePhase="Ana Menü" />
    </>
  );
}
