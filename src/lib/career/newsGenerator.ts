import { NewsItem } from './types';
import { Club, Player, Fixture, LeagueStanding } from '@/types/game';

export function generateDailyNews(
  currentDate: string,
  clubs: Club[],
  standings: LeagueStanding[],
  completedFixtures: Fixture[]
): NewsItem[] {
  const news: NewsItem[] = [];

  // 1. If fixtures were played on this date
  const todayFinishedMatches = completedFixtures.filter((f) => f.date === currentDate && f.status === 'FINISHED');
  if (todayFinishedMatches.length > 0) {
    const leaderStanding = standings.find((s) => s.rank === 1);
    const leaderClub = clubs.find((c) => c.id === leaderStanding?.clubId);

    news.push({
      id: `news-m-${Date.now()}`,
      date: currentDate,
      headline: `Alveria Elit Ligi'nde ${todayFinishedMatches.length} Karşılaşma Tamamlandı!`,
      content: `Günün maçları nefes kesti. Puan tablosunda liderlik koltuğunda ${leaderClub?.name || 'Zirve Takımı'} yer alıyor.`,
      category: 'MATCH_RESULTS',
      importance: 'HIGH',
    });
  }

  // 2. Periodic Title race news (e.g. day 15 of every month)
  if (currentDate.endsWith('-15')) {
    const leader = standings.find((s) => s.rank === 1);
    const runnerUp = standings.find((s) => s.rank === 2);
    const club1 = clubs.find((c) => c.id === leader?.clubId);
    const club2 = clubs.find((c) => c.id === runnerUp?.clubId);

    if (club1 && club2) {
      news.push({
        id: `news-title-${Date.now()}`,
        date: currentDate,
        headline: `Şampiyonluk Yarışında Büyük Çekişme: ${club1.name} ve ${club2.name}!`,
        content: `Ligde ${club1.name} ${leader?.points} puanla liderliğini sürdürürken, hemen arkasından ${club2.name} ${runnerUp?.points} puanla takibini sürdürüyor.`,
        category: 'TITLE_RACE',
        importance: 'NORMAL',
      });
    }
  }

  return news;
}
