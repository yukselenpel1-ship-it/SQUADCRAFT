import { MatchEngineEvent } from './types';
import { matchRandom } from './random';

export interface CommentaryTemplateParams {
  player?: string;
  assister?: string;
  goalkeeper?: string;
  team?: string;
  opponent?: string;
  minute?: number;
}

const TEMPLATES = {
  KICKOFF: [
    "Hakem düdüğünü çaldı ve {team} - {opponent} karşılaşması başladı!",
    "Santra yapıldı ve maç başladı! İki takıma da başarılar.",
    "İlk düdük çaldı! Heyecan dolu 90 dakika başlıyor.",
  ],
  HALFTIME: [
    "Hakem ilk yarının son düdüğünü çalıyor. Takımlar soyunma odasına gidiyor.",
    "İlk 45 dakika tamamlandı. Taktiksel mücadelenin yüksek olduğu bir ilk yarı geride kaldı.",
    "İlk yarı sona erdi.",
  ],
  FULLTIME: [
    "VE MAÇIN SON DÜDÜĞÜ ÇALDI! Karşılaşma tamamlandı.",
    "90 dakikalık mücadele sona eriyor. Hakem son düdüğünü çaldı.",
    "Maç bitti! Muazzam bir mücadeleye sahne olan karşılaşma noktalandı.",
  ],
  GOAL: [
    "GOOOOOLLLL! {player} topu ağlara gönderiyor! {team} skoru değiştiriyor!",
    "GOOOL! Harika bir vuruş! {player}, {goalkeeper}'ı çaresiz bırakıyor!",
    "TOP AĞLARDA! {assister} nefis kesti, {player} ceza alanında dokundu ve GOL!",
    "İNANILMAZ BİR GOL! {player} ceza sahası dışından köşeye muhteşem vurdu!",
    "GOOOL! {player} kaleci ile karşı karşıya pozisyonda soğukkanlılıkla bitiriyor!",
    "VE GOL! Köşe vuruşunda iyi yükselen {player} kafayla topu filelere yolladı!",
  ],
  SAVE: [
    "MÜTHİŞ KURTARIŞ! {goalkeeper} uzandı ve {player}'ın şutunu kornere çeldi!",
    "{goalkeeper} gole izin vermiyor! {player}'ın sert vuruşunda harika bir refleks.",
    "{player} kaleyi yokladı ancak kaleci {goalkeeper} pozisyonda başarılı.",
    "Kaleci {goalkeeper} kalesinde devleşti! Net bir gol şansını engelledi.",
  ],
  POST: [
    "DİREK! {player}'ın vuruşunda top direkten döndü! İnanılmaz bir an!",
    "DİREKTEN DÖNDÜ! {player} vurdu, top üst direğe çarpıp oyun alanına geri geldi!",
  ],
  BLOCKED_SHOT: [
    "{player} sert vurdu ancak savunma araya girerek topu engelledi.",
    "{player}'ın şutunda savunma etten duvar ördü, top kornere çıktı.",
  ],
  SHOT: [
    "{player} ceza sahası önünden şansını denedi, top az farkla auta gitti.",
    "{player} kaleyi düşündü ancak vuruşu üstten dışarı çıktı.",
    "{player}'ın vuruşunda top çerçeveyi bulmadı, aut.",
    "Gelişen {team} atağında {player} vurdu, top yandan auta gitti.",
  ],
  CORNER: [
    "{team} köşe vuruşu kullanacak. Tüm uzun oyuncular ceza sahasına hareketlendi.",
    "Kritik bir köşe vuruşu fırsatı! {team} korner kazanıyor.",
  ],
  FOUL: [
    "{player} orta alanda rakibini faulle durdurdu. Hakem düdüğünü çalıyor.",
    "Orta alanda sert ikili mücadele, hakem serbest vuruşu işaret etti.",
  ],
  YELLOW_CARD: [
    "SARI KART! {player} yaptığı kontrolsüz müdahale sonrasında sarı kartla cezalandırılıyor.",
    "Hakem kartına başvuruyor. {player} rakibini taktik faulle kestiği için sarı kart gördü.",
  ],
  RED_CARD: [
    "KIRMIZI KART! {player} oyundan ihraç edildi! {team} sahada 10 kişi kalıyor!",
    "HAKEMDEN KIRMIZI KART! {player} doğrudan oyun dışı bırakıldı! Sahada büyük şok!",
  ],
  INJURY: [
    "Sağlık görevlileri sahaya davet edildi. {player} yerde acı içinde kıvranıyor.",
    "{player} sakatlık geçiriyor, kenar yönetimi oyuncunun durumunu endişeyle takip ediyor.",
  ],
  SUBSTITUTION: [
    "{team} takımında oyuncu değişikliği gerçekleşiyor. {player} oyuna dahil oldu.",
    "Taktiksel değişiklik! {team} yedek kulübesinden {player} sahaya giriyor.",
  ],
  BIG_CHANCE: [
    "ÇOK NET BİR FIRSAT! {player} ceza alanında bomboş kaldı!",
    "İNANILMAZ BİR TEHLİKE! {team} gole çok yaklaştı!",
  ],
};

export function generateCommentary(
  type: keyof typeof TEMPLATES,
  params: CommentaryTemplateParams
): string {
  const list = TEMPLATES[type] || TEMPLATES.SHOT;
  const template = list[Math.floor(matchRandom() * list.length)];

  return template
    .replace('{player}', params.player || 'Oyuncu')
    .replace('{assister}', params.assister || 'Takım arkadaşı')
    .replace('{goalkeeper}', params.goalkeeper || 'Kaleci')
    .replace('{team}', params.team || 'Takım')
    .replace('{opponent}', params.opponent || 'Rakip')
    .replace('{minute}', String(params.minute || ''));
}
