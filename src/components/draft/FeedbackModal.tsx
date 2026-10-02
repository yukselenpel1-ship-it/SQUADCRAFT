import React, { useState } from 'react';
import { APP_VERSION } from '@/lib/version';
import { submitMultiplayerFeedback } from '@/lib/draft/feedback';
import { submitBugReport } from '@/lib/draft/logger';
import { getMultiplayerSessionId } from '@/lib/draft/sessionManager';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  route?: string;
  gamePhase?: string;
  stateVersion?: number;
}

type ModalMode = 'feedback' | 'bug_report';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  roomId,
  route = '/draft',
  gamePhase = 'Lobby / Draft',
  stateVersion = 1,
}) => {
  const [mode, setMode] = useState<ModalMode>('feedback');
  const [submitted, setSubmitted] = useState(false);

  // 9 Rating Categories (1-5)
  const [ratings, setRatings] = useState<Record<string, number>>({
    'Draft Eğlencesi': 5,
    'Draft Dengesi': 4,
    'Oyuncu Seçme Ekranı': 5,
    'Kadro Yönetimi': 4,
    'Taktik Ekranı': 4,
    'Maç Gerçekçiliği': 4,
    'Maç Hızı': 5,
    'Mobil Kullanım': 4,
    'Genel Deneyim': 5,
  });

  // 4 Text Questions
  const [mostFrustrating, setMostFrustrating] = useState('');
  const [mostEnjoyable, setMostEnjoyable] = useState('');
  const [missingFeature, setMissingFeature] = useState('');
  const [singleChange, setSingleChange] = useState('');

  // Bug Report Form
  const [errorType, setErrorType] = useState('Görsel / UI Hatası');
  const [bugDescription, setBugDescription] = useState('');

  if (!isOpen) return null;

  const handleRatingChange = (category: string, value: number) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    const sessionId = getMultiplayerSessionId();
    const compiledComment = JSON.stringify({
      ratings,
      textAnswers: {
        mostFrustrating,
        mostEnjoyable,
        missingFeature,
        singleChange,
      },
    });

    submitMultiplayerFeedback('Denge', compiledComment, sessionId, roomId, route);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  const handleSubmitBug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugDescription.trim()) return;

    submitBugReport(errorType, bugDescription, route, gamePhase, roomId, stateVersion);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setBugDescription('');
      onClose();
    }, 1800);
  };

  return (
    <div role="dialog" aria-modal="true" className="arena-modal fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-6 text-white my-8 max-h-[90vh] overflow-y-auto">
        {/* Header & Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('feedback')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                mode === 'feedback'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ⭐ Kapalı Alfa Anketi
            </button>
            <button
              onClick={() => setMode('bug_report')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                mode === 'bug_report'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>🐛</span> Hızlı Hata Bildir
            </button>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-3">
            <div className="text-4xl">🎉</div>
            <h3 className="text-lg font-bold text-emerald-400">
              {mode === 'feedback' ? 'Geri Bildiriminiz Kaydedildi!' : 'Hata Raporu Başarıyla İletildi!'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              SquadCraft Kapalı Alfa Testi Round 1 geliştirmelerine sağladığınız değerli katkı için teşekkür ederiz.
            </p>
          </div>
        ) : mode === 'feedback' ? (
          /* ==================================================================== */
          /* 1. DETAILED CLOSED ALPHA FEEDBACK FORM */
          /* ==================================================================== */
          <form onSubmit={handleSubmitFeedback} className="space-y-5">
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                1. Kategori Değerlendirmeleri (1 - 5 Yıldız)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                {Object.entries(ratings).map(([cat, val]) => (
                  <div key={cat} className="flex items-center justify-between p-1.5 border-b border-slate-800/40">
                    <span className="text-slate-300">{cat}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(cat, star)}
                          className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[11px] transition ${
                            star <= val
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                          }`}
                        >
                          {star}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                2. Açık Uçlu Değerlendirme
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">En sinir bozucu şey neydi?</label>
                  <input
                    type="text"
                    value={mostFrustrating}
                    onChange={(e) => setMostFrustrating(e.target.value)}
                    placeholder="Örn: Mobilde oyuncu arama butonu küçüktü..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">En eğlenceli şey neydi?</label>
                  <input
                    type="text"
                    value={mostEnjoyable}
                    onChange={(e) => setMostEnjoyable(e.target.value)}
                    placeholder="Örn: Son saniyede gol kralı transfer etmek..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Hangi özellik eksik hissettirdi?</label>
                  <input
                    type="text"
                    value={missingFeature}
                    onChange={(e) => setMissingFeature(e.target.value)}
                    placeholder="Örn: Maç esnasında canlı taktik değişikliği..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Tek bir şeyi değiştirecek olsan neyi değiştirirdin?</label>
                  <input
                    type="text"
                    value={singleChange}
                    onChange={(e) => setSingleChange(e.target.value)}
                    placeholder="Örn: Seçim süresi 60sn yerine 45sn olmalı..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                ✓ Değerlendirmeyi Gönder
              </button>
            </div>
          </form>
        ) : (
          /* ==================================================================== */
          /* 2. SCREENSHOT-FREE QUICK BUG REPORT FORM */
          /* ==================================================================== */
          <form onSubmit={handleSubmitBug} className="space-y-4">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
              <div className="font-semibold text-slate-300">Otomatik Eklenen Teşhis Bilgileri:</div>
              <div className="text-[11px] text-slate-500 font-mono">
                Sürüm: {APP_VERSION} • Sayfa: {route} • Faz: {gamePhase} • Durum: v{stateVersion}
              </div>
              <div className="text-[10px] text-emerald-400">
                ✓ Son 20 çok oyunculu işlem günlüğü rapora otomatik iliştirilecektir.
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Hata Türü</label>
              <select
                value={errorType}
                onChange={(e) => setErrorType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Senkronizasyon / Desync Hatası">Senkronizasyon / Desync Hatası</option>
                <option value="Draft Sırası / Oyuncu Seçim Hatası">Draft Sırası / Oyuncu Seçim Hatası</option>
                <option value="Maç Simülasyonu / Skor Hatası">Maç Simülasyonu / Skor Hatası</option>
                <option value="Bağlantı Kopması / Reconnect Sorunu">Bağlantı Kopması / Reconnect Sorunu</option>
                <option value="Görsel / UI / Mobil Yerleşim Hatası">Görsel / UI / Mobil Yerleşim Hatası</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Hata Açıklaması</label>
              <textarea
                value={bugDescription}
                onChange={(e) => setBugDescription(e.target.value)}
                rows={4}
                required
                placeholder="Ne yaparken hata oluştu? Ekranda hangi mesaj belirdi? Adımları kısaca açıklayın..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={!bugDescription.trim()}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                🚀 Hata Raporunu İlet
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
