import { NewsItem } from './types';
import { Club, Player, Fixture, LeagueStanding, FinanceSummary } from '@/types/game';

/**
 * Procedural Living News Engine.
 * Generates dynamic, context-aware news across 4 core categories:
 * 1. TEAM_NEWS (Sakatlıklar, form patlamaları, antrenman, altyapı gençleri)
 * 2. CLUB_NEWS (Yönetim hedefleri, mali raporlar, sponsorluklar, taraftar tepkileri)
 * 3. TRANSFER (Resmileşenler, teklifler, dedikodular, sözleşmesi bitenler, serbestler)
 * 4. LEAGUE_NEWS (Derbiler, maç sonuçları, zirve & küme hattı, gol krallığı)
 */
export function generateDailyNews(
  currentDate: string,
  clubs: Club[],
  standings: LeagueStanding[],
  fixtures: Fixture[],
  players: Player[] = [],
  userClubId: string = 'kalyon-doruk',
  finances?: FinanceSummary
): NewsItem[] {
  const news: NewsItem[] = [];
  const dateObj = new Date(currentDate);
  const day = dateObj.getDate();

  const userClub = clubs.find((c) => c.id === userClubId) || clubs[0];
  const userStanding = standings.find((s) => s.clubId === userClubId);
  const userPlayers = players.filter((p) => p.clubId === userClubId);
  const leaderStanding = standings.find((s) => s.rank === 1);
  const leaderClub = clubs.find((c) => c.id === leaderStanding?.clubId);

  // ============================================================================
  // 1. LEAGUE NEWS & MATCH RESULTS
  // ============================================================================
  const todayFinishedMatches = fixtures.filter(
    (f) => f.date === currentDate && f.status === 'FINISHED'
  );

  if (todayFinishedMatches.length > 0) {
    // Find the highest scoring or most exciting match today
    const topMatch = [...todayFinishedMatches].sort(
      (a, b) => ((b.homeScore || 0) + (b.awayScore || 0)) - ((a.homeScore || 0) + (a.awayScore || 0))
    )[0];

    const homeClub = clubs.find((c) => c.id === topMatch.homeClubId);
    const awayClub = clubs.find((c) => c.id === topMatch.awayClubId);

    if (homeClub && awayClub) {
      const totalGoals = (topMatch.homeScore || 0) + (topMatch.awayScore || 0);
      let headline = `Ligde Günün Maçı: ${homeClub.name} ${topMatch.homeScore} - ${topMatch.awayScore} ${awayClub.name}`;
      let content = `Alveria Ligi'nde bugün oynanan ${todayFinishedMatches.length} karşılaşma nefes kesti. Zirve yarışında ${leaderClub?.name || 'Lider'} ${leaderStanding?.points || 0} puanla ilk sıradaki yerini koruyor.`;

      if (totalGoals >= 4) {
        headline = `Gol Düellosu! ${homeClub.name} ${topMatch.homeScore} - ${topMatch.awayScore} ${awayClub.name}`;
        content = `Tribünlerin coştuğu karşılaşmada tam ${totalGoals} gol kaydedildi. İki ekip de sahadan bol pozisyonla ayrıldı.`;
      } else if (topMatch.homeScore === 0 && topMatch.awayScore === 0) {
        headline = `Taktik Savaşı: ${homeClub.name} ve ${awayClub.name} Yenişemedi (0-0)`;
        content = `Savunmaların kusursuz işlediği mücadelede iki takım da birer puanla yetinmek zorunda kaldı.`;
      }

      news.push({
        id: `news-m-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        date: currentDate,
        headline,
        content,
        category: 'MATCH_RESULTS',
        importance: 'HIGH',
      });
    }
  }

  // Top Scorer Race (every 7th and 21st of month)
  if (day === 7 || day === 21) {
    const topScorers = [...players]
      .filter((p) => (p.seasonStats?.goals || 0) > 0)
      .sort((a, b) => (b.seasonStats?.goals || 0) - (a.seasonStats?.goals || 0));

    if (topScorers.length > 0) {
      const leader = topScorers[0];
      const club = clubs.find((c) => c.id === leader.clubId);
      news.push({
        id: `news-scorer-${Date.now()}`,
        date: currentDate,
        headline: `Gol Krallığı Zirvesi: ${leader.firstName} ${leader.lastName} Durdurulamıyor!`,
        content: `${club?.name || 'Takımında'} forma giyen ${leader.firstName} ${leader.lastName}, ligde kaydettiği ${leader.seasonStats?.goals} golle krallık yarışında zirvede yer alıyor.`,
        category: 'LEAGUE_NEWS',
        importance: 'NORMAL',
        playerId: leader.id,
      });
    }
  }

  // Title Race & Standings Tension (around day 14 and 28 of month)
  if (day === 14 || day === 28) {
    const runnerUp = standings.find((s) => s.rank === 2);
    const club2 = clubs.find((c) => c.id === runnerUp?.clubId);

    if (leaderClub && club2) {
      const ptDiff = (leaderStanding?.points || 0) - (runnerUp?.points || 0);
      news.push({
        id: `news-title-${Date.now()}`,
        date: currentDate,
        headline: `Şampiyonluk Virajı: ${leaderClub.name} (${leaderStanding?.points}P) vs ${club2.name} (${runnerUp?.points}P)`,
        content: `Zirvedeki puan farkı ${ptDiff === 0 ? 'tamamen kapandı! Averajla liderlik el değiştiriyor.' : `${ptDiff} puana indi. Her maç final havasında geçiyor.`}`,
        category: 'LEAGUE_NEWS',
        importance: 'HIGH',
      });
    }
  }

  // ============================================================================
  // 2. TEAM NEWS (Takım İçi Durumlar)
  // ============================================================================
  // Form explosions or slump in user club
  const hotPlayer = userPlayers.find((p) => (p.form || 7.0) >= 8.0 && (p.seasonStats?.appearances || 0) >= 2);
  if (hotPlayer && day % 9 === 0) {
    news.push({
      id: `news-hot-${Date.now()}`,
      date: currentDate,
      headline: `Form Patlaması: ${hotPlayer.firstName} ${hotPlayer.lastName} Taraftarı Büyülüyor`,
      content: `${userClub.name} formasıyla son maçlarda harikalar yaratan ${hotPlayer.position} oyuncusu, teknik heyetin ve taraftarların en güvendiği isim haline geldi.`,
      category: 'TEAM_NEWS',
      importance: 'NORMAL',
      clubId: userClub.id,
      playerId: hotPlayer.id,
    });
  }

  // Injury recovery / report
  const injuredUserPlayer = userPlayers.find((p) => p.isInjured);
  if (injuredUserPlayer && day % 11 === 0) {
    const daysLeft = injuredUserPlayer.injuryDetails?.daysRemaining || 7;
    news.push({
      id: `news-inj-${Date.now()}`,
      date: currentDate,
      headline: `Sağlık Raporu: ${injuredUserPlayer.firstName} ${injuredUserPlayer.lastName} Tedavi Altında`,
      content: `${userClub.name} sağlık heyeti, ${injuredUserPlayer.injuryDetails?.type || 'adalesinde zorlanma'} yaşayan tecrübeli futbolcunun ${daysLeft} gün içinde takımla çalışmalara başlayacağını açıkladı.`,
      category: 'TEAM_NEWS',
      importance: 'NORMAL',
      clubId: userClub.id,
      playerId: injuredUserPlayer.id,
    });
  }

  // Rising youth talent spotted
  const wonderkid = userPlayers.find((p) => p.age <= 21 && p.potential >= 82);
  if (wonderkid && day === 18) {
    news.push({
      id: `news-wonder-${Date.now()}`,
      date: currentDate,
      headline: `Geleceğin Yıldızı: ${wonderkid.firstName} ${wonderkid.lastName} Göz Dolduruyor`,
      content: `${userClub.name} altyapısından A takıma adapte olan 21 yaşındaki genç yetenek, antrenmanlardaki hırsı ve potansiyeliyle Avrupa gözlemcilerinin de radarına girdi.`,
      category: 'TEAM_NEWS',
      importance: 'NORMAL',
      clubId: userClub.id,
      playerId: wonderkid.id,
    });
  }

  // ============================================================================
  // 3. CLUB NEWS (Yönetim & Mali Durum)
  // ============================================================================
  if (day === 1) {
    const rank = userStanding?.rank || 5;
    let boardConfidence = 'tam destek veriyor';
    if (rank <= 3) boardConfidence = 'şampiyonluk yürüyüşünden son derece memnun';
    else if (rank >= 8) boardConfidence = 'alınan sonuçlar nedeniyle menajere toparlanma uyarısında bulundu';

    news.push({
      id: `news-board-${Date.now()}`,
      date: currentDate,
      headline: `${userClub.name} Yönetim Kurulu Aylık Değerlendirmesini Tamamladı`,
      content: `Kulüp yönetimi ve başkanlık makamı takımın ligdeki ${rank}. sıradaki konumunu değerlendirdi. Yönetim kurulu teknik heyete ${boardConfidence}.`,
      category: 'CLUB_NEWS',
      importance: rank >= 8 ? 'HIGH' : 'NORMAL',
      clubId: userClub.id,
    });
  }

  if (finances && day === 16) {
    const balanceM = (finances.clubBalance / 1_000_000).toFixed(1);
    news.push({
      id: `news-fin-${Date.now()}`,
      date: currentDate,
      headline: `Mali Rapor: ${userClub.name} Kasasında €${balanceM}M Rezerv`,
      content: `Kulübün bilet satışları, lisanslı ürün gelirleri ve sponsorluk anlaşmalarıyla bütçe disiplinini koruduğu açıklandı.`,
      category: 'CLUB_NEWS',
      importance: 'NORMAL',
      clubId: userClub.id,
    });
  }

  // ============================================================================
  // 4. TRANSFER NEWS & RUMORS
  // ============================================================================
  // Contract expiration alert (< 6 months)
  if (day === 5 || day === 23) {
    const expiringPlayer = players.find(
      (p) => (p.contractYearsLeft === 1 || p.contractEnd?.startsWith('2027')) && p.overall >= 78 && p.clubId !== 'FREE_AGENT'
    );
    if (expiringPlayer) {
      const club = clubs.find((c) => c.id === expiringPlayer.clubId);
      news.push({
        id: `news-trans-exp-${Date.now()}`,
        date: currentDate,
        headline: `Sözleşme Krizi: ${expiringPlayer.firstName} ${expiringPlayer.lastName} Bedelsiz Ayrılabilir mi?`,
        content: `${club?.name || 'Kulübüyle'} sözleşmesinin son dönemine giren 78+ yetenekli futbolcu için yeni sözleşme görüşmeleri tıkandı. Birçok dev kulüp oyuncuyu takibe aldı.`,
        category: 'TRANSFER',
        importance: 'NORMAL',
        playerId: expiringPlayer.id,
      });
    }
  }

  // Free agent market activity
  if (day === 12 || day === 26) {
    const prominentFreeAgent = players.find(
      (p) => p.clubId === 'FREE_AGENT' && p.overall >= 74
    );
    if (prominentFreeAgent) {
      news.push({
        id: `news-free-${Date.now()}`,
        date: currentDate,
        headline: `Serbest Piyasa Fırsatı: ${prominentFreeAgent.firstName} ${prominentFreeAgent.lastName} İmza Bekliyor`,
        content: `Bonservisi elinde bulunan ${prominentFreeAgent.age} yaşındaki ${prominentFreeAgent.position} oyuncusu, haftalık makul maaş beklentisiyle transfer masasında kulüplerin gözdesi.`,
        category: 'TRANSFER',
        importance: 'NORMAL',
        playerId: prominentFreeAgent.id,
      });
    }
  }

  return news;
}
