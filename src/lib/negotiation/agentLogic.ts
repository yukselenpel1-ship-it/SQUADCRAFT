import { AgentStyle, PlayerAgent } from './types';
import { Player } from '@/types/game';

const FICTIONAL_AGENT_FIRST_NAMES = [
  'Mert', 'Levent', 'Koray', 'Sedat', 'Taner', 'Alper', 'Volkan', 'Gökhan',
  'Barış', 'Kemal', 'Tayfun', 'Erkan', 'Cemil', 'Nihat', 'Tufan', 'Serhat'
];

const FICTIONAL_AGENT_LAST_NAMES = [
  'Yıldırım', 'Demirbağ', 'Karasu', 'Esen', 'Vural', 'Soner', 'Öztuna', 'Çetin',
  'Bozer', 'Pekcan', 'Uçar', 'Akkaya', 'Soylu', 'Gündoğan', 'Ertem', 'Albayrak'
];

const AGENT_STYLES: AgentStyle[] = [
  'Kolaycı',
  'Dengeli',
  'Sert',
  'Maksimum Kazanç Odaklı',
  'Kariyer Odaklı'
];

/**
 * Deterministically generates an agent for a player based on player properties
 * so the same player always has a consistent representative throughout their career.
 */
export function getPlayerAgent(player: Player): PlayerAgent {
  if (player.agent) {
    return player.agent;
  }

  // Hash player ID or name
  let hash = 0;
  const str = player.id + player.lastName + player.nationality;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const firstName = FICTIONAL_AGENT_FIRST_NAMES[absHash % FICTIONAL_AGENT_FIRST_NAMES.length];
  const lastName = FICTIONAL_AGENT_LAST_NAMES[(absHash >> 3) % FICTIONAL_AGENT_LAST_NAMES.length];
  const style = AGENT_STYLES[(absHash >> 5) % AGENT_STYLES.length];
  const reputation = 40 + (absHash % 55);

  return {
    name: `${firstName} ${lastName}`,
    style,
    reputation,
  };
}

export function getAgentStyleDescription(style: AgentStyle): string {
  switch (style) {
    case 'Kolaycı':
      return 'Uzlaşmacı bir tutuma sahiptir. Görüşmelerde daha sabırlıdır ve kulübün bütçesini zorlamamaya özen gösterir.';
    case 'Dengeli':
      return 'Profesyonel ve rasyoneldir. Oyuncusunun piyasa değerine uygun standart sözleşme şartları talep eder.';
    case 'Sert':
      return 'Taviz vermeyen ve inatçı bir müzakerecidir. Düşük tekliflerde sabrı hızla tükenir ve masadan kalkabilir.';
    case 'Maksimum Kazanç Odaklı':
      return 'Yüksek maaş, dolgun imza parası ve maç başı primler konusunda son derece ısrarcıdır.';
    case 'Kariyer Odaklı':
      return 'Maaştan ziyade oyuncusunun vadedilen kadro rolü ve kulübün sportif hedefleriyle ilgilenir.';
  }
}
