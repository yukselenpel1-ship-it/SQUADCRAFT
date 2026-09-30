import {
  Player,
  PlayerPosition,
  PreferredFoot,
  PlayerAttributes,
  PlayerArchetype,
  DevelopmentCurve,
  HiddenPlayerAttributes,
  ScoutingReport,
} from '@/types/game';

// ============================================================================
// SQUADCRAFT PLAYER DATABASE 2.0 — CONSTANTS & REGIONAL NAME GENERATORS
// ============================================================================

export const PLAYER_POOL_TOTAL = 2000;

export interface RegionalNameSet {
  region: string;
  nationalities: string[];
  firstNames: string[];
  lastNames: string[];
}

export const REGIONAL_NAME_SETS: RegionalNameSet[] = [
  {
    region: 'Turkish',
    nationalities: ['Türkiye', 'Kalyon', 'Marmaris', 'Poyraz', 'Enderun', 'Vadi'],
    firstNames: [
      'Aras', 'Doruk', 'Poyraz', 'Mert', 'Bora', 'Emir', 'Kaan', 'Taylan', 'Sarp', 'Kerem',
      'Batu', 'Görkem', 'Volkan', 'Çağlar', 'Devrim', 'Serkan', 'Levent', 'Ulaş', 'Koray', 'Selim',
      'Tarkan', 'Eren', 'Can', 'Burak', 'Onur', 'Barış', 'Deniz', 'Tolga', 'Cenk', 'Sinan',
      'Umut', 'Rıza', 'Tarık', 'İlker', 'Alper', 'Bilal', 'Erdem', 'Berke', 'Ferdi', 'Melih',
      'Oğuz', 'Alp', 'Cem', 'Kaya', 'Baran', 'Yalçın', 'Barlas', 'Zafer', 'Korkut', 'Ayberk'
    ],
    lastNames: [
      'Bozkurt', 'Sancaktar', 'Taşdemir', 'Kılıçarslan', 'Karadağ', 'Albayrak', 'Gündoğdu', 'Yılmazer', 'Akkaya', 'Demirtaş',
      'Karakaya', 'Özkan', 'Çelik', 'Kayaalp', 'Öztürk', 'Koçyiğit', 'Serter', 'Serbest', 'Aksoy', 'Uludağ',
      'Ertekin', 'Keskin', 'Şimşek', 'Bayraktar', 'Demirhan', 'Ateş', 'Soylu', 'Çetin', 'Yavuz', 'Kandemir',
      'Gökmen', 'Duran', 'Toprak', 'Akıncı', 'Pehlivan', 'Özdemir', 'Kartal', 'Sezgin', 'Korkmaz', 'Esen'
    ],
  },
  {
    region: 'Balkan',
    nationalities: ['Balkanica', 'Hırvatistan', 'Sırbistan', 'Bosna', 'Slovenya', 'Karadağ'],
    firstNames: [
      'Mateo', 'Dario', 'Luka', 'Stefan', 'Karlo', 'Nikola', 'Milan', 'Goran', 'Marko', 'Dejan',
      'Petar', 'Dragan', 'Bojan', 'Zoran', 'Filip', 'Ivan', 'Ante', 'Danijel', 'Tomislav', 'Borna',
      'Lovro', 'Josip', 'Mislav', 'Marin', 'Domagoj', 'Stipe', 'Andrej', 'Dusan', 'Aleksandar', 'Vuk',
      'Nemanja', 'Branko', 'Igor', 'Miroslav', 'Toni', 'Nenad', 'Sinisa', 'Vlado', 'Davor', 'Damir'
    ],
    lastNames: [
      'Vukovic', 'Horvat', 'Kovacevic', 'Novak', 'Kolar', 'Petrovic', 'Juric', 'Babic', 'Pavlovic', 'Markovic',
      'Jankovic', 'Stojanovic', 'Nikolic', 'Simic', 'Lazarevic', 'Bozic', 'Radic', 'Peric', 'Lovric', 'Vidovic',
      'Maric', 'Tomic', 'Knezevic', 'Popovic', 'Blagojevic', 'Ilic', 'Savic', 'Djukic', 'Cvetkovic', 'Obradovic',
      'Vasiljevic', 'Bogdanovic', 'Milosevic', 'Lukic', 'Gajic', 'Jovanovic', 'Antic', 'Mitic', 'Tosic', 'Subotic'
    ],
  },
  {
    region: 'Western Europe',
    nationalities: ['Alveria', 'Almanya', 'Fransa', 'Hollanda', 'Belçika', 'İngiltere', 'Caledonia'],
    firstNames: [
      'Florian', 'Lucas', 'Mathis', 'Jonas', 'Felix', 'Leon', 'Julian', 'Maxime', 'Gabriel', 'Callum',
      'Mason', 'Liam', 'Arthur', 'Hugo', 'Robin', 'Finn', 'Theo', 'Elias', 'Noah', 'Hendrik',
      'Maarten', 'Lars', 'Bram', 'Thijs', 'Ruben', 'Simon', 'Daan', 'Jesse', 'Stijn', 'Lennart',
      'Valentin', 'Arno', 'Clement', 'Adrien', 'Corentin', 'Tristan', 'Baptiste', 'Guillaume', 'Moritz', 'Fabian'
    ],
    lastNames: [
      'Lindner', 'Vogel', 'Schneider', 'Zimmermann', 'Fletcher', 'Brooks', 'Mercer', 'Langley', 'Sterling', 'Hartmann',
      'Weber', 'Becker', 'Hoffmann', 'Wagner', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schroder', 'Neumann',
      'Schwarz', 'Ziegler', 'Fischer', 'Meyer', 'Schulz', 'Kramer', 'Lefebvre', 'Mercier', 'Dupont', 'Lambert',
      'Fontaine', 'Rousseau', 'Garnier', 'Chevalier', 'Vermeulen', 'De Jong', 'Bakker', 'Visser', 'Smit', 'Bosch'
    ],
  },
  {
    region: 'Southern Europe',
    nationalities: ['Iberia', 'İtalya', 'İspanya', 'Portekiz', 'Adriatika'],
    firstNames: [
      'Gianluca', 'Matteo', 'Marco', 'Alessio', 'Lorenzo', 'Davide', 'Simone', 'Andrea', 'Federico', 'Leonardo',
      'Diego', 'Alvaro', 'Sergio', 'Pablo', 'Marcos', 'Adrian', 'Javier', 'Raul', 'Bruno', 'Tiago',
      'Rafael', 'Diogo', 'Rodrigo', 'Duarte', 'Goncalo', 'Luciano', 'Enzo', 'Fabio', 'Vincenzo', 'Daniele',
      'Stefano', 'Riccardo', 'Jacopo', 'Manuel', 'Guillermo', 'Ruben', 'Inigo', 'Cesar', 'Aitor', 'Borja'
    ],
    lastNames: [
      'Conti', 'Riva', 'Fontana', 'Marini', 'Galli', 'Lombardi', 'Moretti', 'Esposito', 'De Luca', 'Costantini',
      'Navarro', 'Morales', 'Serrano', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Silveira', 'Fontes', 'Medeiros',
      'Barros', 'Vasconcelos', 'Pinto', 'Carvalho', 'Figueiredo', 'Cardoso', 'Santoro', 'Romano', 'Colombo', 'Ricci',
      'Marino', 'Greco', 'Bruno', 'Ferrara', 'Garrido', 'Cano', 'Molina', 'Valero', 'Pacheco', 'Montero'
    ],
  },
  {
    region: 'Northern Europe',
    nationalities: ['Nordia', 'Danimarka', 'İsveç', 'Norveç', 'Finlandiya'],
    firstNames: [
      'Soren', 'Mikkel', 'Elias', 'Kasper', 'Magnus', 'Emil', 'Oliver', 'Christian', 'Victor', 'Rasmus',
      'Tobias', 'Mathias', 'Henrik', 'Aksel', 'Gustav', 'Filip', 'Anton', 'Oskar', 'Arvid', 'Linus',
      'Isak', 'Albin', 'Ludvig', 'Melker', 'Hampus', 'Sander', 'Sindre', 'Havard', 'Erlend', 'Marius',
      'Jesper', 'Nikolaj', 'Lasse', 'Troels', 'Torstein', 'Bjorn', 'Kalle', 'Eetu', 'Onni', 'Aleksi'
    ],
    lastNames: [
      'Lindholm', 'Bergstrom', 'Vestergaard', 'Nystrom', 'Kristensen', 'Holm', 'Nygaard', 'Moller', 'Lund', 'Dahl',
      'Hansen', 'Olsen', 'Larsen', 'Rasmussen', 'Thomsen', 'Mortensen', 'Simonsen', 'Hedlund', 'Sandstrom', 'Aas',
      'Haugen', 'Solberg', 'Strom', 'Halvorsen', 'Moen', 'Gundersen', 'Laine', 'Heikkinen', 'Virtanen', 'Korhonen',
      'Jarvinen', 'Kallio', 'Lehtonen', 'Saari', 'Hakala', 'Nordqvist', 'Ekstrom', 'Lofgren', 'Svensson', 'Nilsson'
    ],
  },
  {
    region: 'Eastern Europe',
    nationalities: ['Doğu Avrupa', 'Polonya', 'Ukrayna', 'Çekya', 'Romanya'],
    firstNames: [
      'Dmitri', 'Andrei', 'Anton', 'Nikolai', 'Ilya', 'Maxim', 'Roman', 'Sergei', 'Mikhail', 'Pavel',
      'Artem', 'Danila', 'Vladislav', 'Yaroslav', 'Boris', 'Kirill', 'Oleg', 'Vadim', 'Stanislav', 'Denis',
      'Piotr', 'Kamil', 'Jakub', 'Michal', 'Tomasz', 'Bartosz', 'Lukasz', 'Pawel', 'Wojciech', 'Mateusz',
      'Bohdan', 'Taras', 'Vitaliy', 'Rostyslav', 'Maksym', 'Yevhen', 'Radu', 'Florin', 'Ciprian', 'Cosmin'
    ],
    lastNames: [
      'Morozov', 'Sokolov', 'Popov', 'Kovalenko', 'Ilyin', 'Smirnov', 'Vasiliev', 'Gusev', 'Kuznetsov', 'Belov',
      'Fedorov', 'Novikov', 'Moroz', 'Kozlov', 'Lebedev', 'Semenov', 'Egorov', 'Pavlov', 'Golubev', 'Vinogradov',
      'Wisniewski', 'Kaminski', 'Szymanski', 'Wojcik', 'Kowalski', 'Kozlowski', 'Jankowski', 'Mazur',
      'Boyko', 'Tkachenko', 'Kravchenko', 'Oliynyk', 'Popescu', 'Ionescu', 'Dumitru', 'Stoica', 'Stan', 'Gheorghe'
    ],
  },
  {
    region: 'South America',
    nationalities: ['Brezilya', 'Arjantin', 'Uruguay', 'Kolombiya', 'Şili'],
    firstNames: [
      'Thiago', 'Leandro', 'Gabriel', 'Caio', 'Rodrigo', 'Felipe', 'Franco', 'Agustin', 'Nicolas', 'Facundo',
      'Lautaro', 'Joaquin', 'Tomas', 'Matias', 'Santiago', 'Renato', 'Danilo', 'Murilo', 'Everton', 'Otavio',
      'Breno', 'Igor', 'Wendel', 'Fabricio', 'Darlan', 'Gonzalo', 'Sebastian', 'Ignacio', 'Patricio', 'Esteban',
      'Camilo', 'Duvan', 'Brayan', 'Jhon', 'Yerry', 'Alvaro', 'Darwin', 'Gaston', 'Nahuel', 'Valentin'
    ],
    lastNames: [
      'Belmonte', 'Almiron', 'Ferreyra', 'Benitez', 'Santoro', 'Cardozo', 'Dominguez', 'Barreto', 'Villalba', 'Medina',
      'Lucero', 'Peralta', 'Gimenez', 'Acosta', 'Farias', 'Coronel', 'Godoy', 'Vera', 'Caceres', 'Cabrera',
      'Albuquerque', 'Teixeira', 'Ferreira', 'Batista', 'Guimaraes', 'Nogueira', 'Pacheco', 'Carneiro', 'Brandao', 'Magalhaes',
      'Rios', 'Sarmiento', 'Bustos', 'Quiroga', 'Montoya', 'Mosquera', 'Palacios', 'Arboleda', 'Valencia', 'Murillo'
    ],
  },
  {
    region: 'Africa',
    nationalities: ['Nijerya', 'Senegal', 'Fas', 'Fildişi Sahili', 'Gana', 'Kamerun', 'Mali'],
    firstNames: [
      'Tariq', 'Idris', 'Malik', 'Faris', 'Nabil', 'Hamza', 'Sami', 'Zaid', 'Kareem', 'Amine',
      'Sofiane', 'Yassine', 'Oumar', 'Bakary', 'Cheick', 'Sadio', 'Keita', 'Sekou', 'Moussa', 'Mamadou',
      'Ibrahima', 'Lamin', 'Abdoulaye', 'Kwesi', 'Kofi', 'Ayo', 'Chidi', 'Emeka', 'Babajide', 'Femi',
      'Samuel', 'Kalu', 'Tunde', 'Koffi', 'Yao', 'Franck', 'Serge', 'Wilfried', 'Junior', 'Cedric'
    ],
    lastNames: [
      'Kouyate', 'Diallo', 'Benlamri', 'Adebayo', 'Traore', 'Camara', 'Toure', 'Diarra', 'Kone', 'Sangare',
      'Cisse', 'Coulibaly', 'Diop', 'Fall', 'Ndiaye', 'Mensah', 'Owusu', 'Boateng', 'Appiah', 'Okafor',
      'Balogun', 'Eze', 'Okeke', 'Amadi', 'Chukwu', 'Kassir', 'Tawfiq', 'Najjar', 'Haddad', 'Zahran',
      'Chahine', 'Mansour', 'Moussaoui', 'Benali', 'Boussaid', 'Kome', 'Bassong', 'Tchani', 'Mbia', 'Bong'
    ],
  },
  {
    region: 'North America',
    nationalities: ['ABD', 'Kanada', 'Meksika', 'Atlantis', 'Solvanya'],
    firstNames: [
      'Julian', 'Adrian', 'Cole', 'Mason', 'Chase', 'Tyler', 'Austin', 'Trevor', 'Connor', 'Logan',
      'Dylan', 'Ethan', 'Wyatt', 'Nolan', 'Gavin', 'Tristan', 'Caleb', 'Garrett', 'Blake', 'Brody',
      'Mateo', 'Emilio', 'Diego', 'Sebastian', 'Santiago', 'Dante', 'Marco', 'Damian', 'Cruz', 'Javier',
      'Carter', 'Owen', 'Hunter', 'Landon', 'Colton', 'Easton', 'Ryder', 'Bennett', 'Sawyer', 'Weston'
    ],
    lastNames: [
      'Vance', 'Sterling', 'MacIntyre', 'Brooks', 'Callaghan', 'Prescott', 'Gallagher', 'Donovan', 'Mercer', 'Thornton',
      'Dalton', 'Hayes', 'Montgomery', 'Fletcher', 'Carver', 'Sinclair', 'Bradford', 'Monroe', 'Palmer', 'Garza',
      'Castaneda', 'Aguilar', 'Salas', 'Juarez', 'Campos', 'Rendon', 'Pena', 'Gallegos', 'Sandoval', 'Esquivel',
      'Vaughn', 'Mercado', 'Gentry', 'Holloway', 'Stafford', 'Bauer', 'Kaufman', 'Hendrix', 'Blackwood', 'Frost'
    ],
  },
  {
    region: 'Asia',
    nationalities: ['Japonya', 'Güney Kore', 'Avustralya', 'Zirve', 'Demirvadi'],
    firstNames: [
      'Kenji', 'Daiki', 'Sora', 'Kaito', 'Yuto', 'Ren', 'Hiroshi', 'Riku', 'Taiga', 'Kazuki',
      'Min-jun', 'Seo-jun', 'Do-yun', 'Ye-jun', 'Si-woo', 'Ha-jun', 'Ji-ho', 'Joon-woo', 'Hyun-woo', 'Dong-hyun',
      'Wei', 'Chen', 'Jun', 'Lin', 'Tao', 'Bao', 'Hao', 'Lei', 'Jian', 'Feng',
      'Liam', 'Jack', 'Oliver', 'Noah', 'William', 'Thomas', 'James', 'Lucas', 'Ethan', 'Alexander'
    ],
    lastNames: [
      'Takahashi', 'Watanabe', 'Nakamura', 'Kobayashi', 'Yamamoto', 'Kondo', 'Matsumoto', 'Inoue', 'Kimura', 'Shimizu',
      'Sato', 'Suzuki', 'Tanaka', 'Ito', 'Saito', 'Park', 'Kim', 'Lee', 'Choi', 'Jung',
      'Kang', 'Zhang', 'Wang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou',
      'OConnor', 'Kelly', 'Murphy', 'Smith', 'Jones', 'Taylor', 'Brown', 'Wilson', 'Evans', 'Walker'
    ],
  },
];

// Famous real-life player blacklist to guarantee zero collisions (IP & licensing safety)
export const REAL_LIFE_STAR_BLACKLIST = new Set([
  'lionel messi', 'cristiano ronaldo', 'kylian mbappe', 'erling haaland', 'luka modric',
  'kevin de bruyne', 'harry kane', 'robert lewandowski', 'mohamed salah', 'neymar jr',
  'karim benzema', 'vinicius junior', 'jude bellingham', 'rodri hernandez', 'bukayo saka',
  'florian wirtz', 'jamal musiala', 'pedri gonzalez', 'gavi paez', 'arda guler',
  'hakan calhanoglu', 'kerem akturkoglu', 'baris alper yilmaz', 'ferdi kadioglu', 'semih kilicsoy',
  'kenan yildiz', 'alisson becker', 'thibaut courtois', 'virgil van dijk', 'ruben dias',
  'bernardo silva', 'bruno fernandes', 'antoine griezmann', 'lautaro martinez', 'victor osimhen',
  'son heung-min', 'federico valverde', 'eduardo camavinga', 'aurelien tchouameni', 'william saliba'
]);

// Positional allocations totaling exactly 2000 players
export interface PositionAllocation {
  pos: PlayerPosition;
  secondaries: PlayerPosition[];
  count: number;
  archetypes: PlayerArchetype[];
}

export const POSITION_ALLOCATIONS: PositionAllocation[] = [
  { pos: 'GK', secondaries: [], count: 200, archetypes: ['Süpürücü Kaleci', 'Çizgi Kalecisi'] },
  { pos: 'DC', secondaries: ['DR', 'DL', 'DMC'], count: 340, archetypes: ['Pasör Stoper', 'Fiziksel Stoper'] },
  { pos: 'DL', secondaries: ['ML', 'DC'], count: 160, archetypes: ['Hücumcu Bek', 'Savunmacı Bek'] },
  { pos: 'DR', secondaries: ['MR', 'DC'], count: 160, archetypes: ['Hücumcu Bek', 'Savunmacı Bek'] },
  { pos: 'DMC', secondaries: ['MC', 'DC'], count: 200, archetypes: ['Defansif Orta Saha', 'Box-to-Box'] },
  { pos: 'MC', secondaries: ['DMC', 'AMC', 'MR', 'ML'], count: 280, archetypes: ['Oyun Kurucu', 'Box-to-Box'] },
  { pos: 'AMC', secondaries: ['MC', 'AML', 'AMR', 'ST'], count: 150, archetypes: ['Oyun Kurucu', 'Oyun Kurucu Kanat'] },
  { pos: 'AML', secondaries: ['ML', 'AMR', 'AMC', 'ST'], count: 130, archetypes: ['Hızlı Kanat', 'Oyun Kurucu Kanat'] },
  { pos: 'AMR', secondaries: ['MR', 'AML', 'AMC', 'ST'], count: 130, archetypes: ['Hızlı Kanat', 'Oyun Kurucu Kanat'] },
  { pos: 'ST', secondaries: ['AMC', 'AML', 'AMR'], count: 250, archetypes: ['Bitirici Forvet', 'Pres Forvet', 'Hedef Santrfor'] },
];

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ============================================================================
// REBALANCED RATING GENERATOR (OVR CURVE)
// ============================================================================
export function generateTargetOverall(seed: number): number {
  const r = pseudoRandom(seed * 7.91);
  if (r < 0.010) {
    // 90-94: Ultra-rare elite (~1.0% -> 20 players)
    return 90 + Math.floor(pseudoRandom(seed * 13.1) * 5); // 90..94 (strictly <= 94)
  } else if (r < 0.045) {
    // 85-89: Top tier stars (~3.5% -> 70 players)
    return 85 + Math.floor(pseudoRandom(seed * 13.1) * 5); // 85..89
  } else if (r < 0.160) {
    // 80-84: High quality first XI (~11.5% -> 230 players)
    return 80 + Math.floor(pseudoRandom(seed * 13.1) * 5); // 80..84
  } else if (r < 0.425) {
    // 75-79: Solid professionals (~26.5% -> 530 players)
    return 75 + Math.floor(pseudoRandom(seed * 13.1) * 5); // 75..79
  } else if (r < 0.725) {
    // 70-74: Mid-tier league players (~30.0% -> 600 players)
    return 70 + Math.floor(pseudoRandom(seed * 13.1) * 5); // 70..74
  } else if (r < 0.900) {
    // 65-69: Rotation / development (~17.5% -> 350 players)
    return 65 + Math.floor(pseudoRandom(seed * 13.1) * 5); // 65..69
  } else if (r < 0.970) {
    // 60-64: Lower-tier professionals (~7.0% -> 140 players)
    return 60 + Math.floor(pseudoRandom(seed * 13.1) * 5); // 60..64
  } else if (r < 0.9925) {
    // 55-59: Young raw players (~2.25% -> 45 players)
    return 55 + Math.floor(pseudoRandom(seed * 13.1) * 5); // 55..59
  } else {
    // 50-54: Very raw prospects (~0.75% -> 15 players)
    return 50 + Math.floor(pseudoRandom(seed * 13.1) * 5); // 50..54
  }
}

// ============================================================================
// VALUATION ENGINE (DRAFT ECONOMY & VALUE FORMULA)
// ============================================================================
export function calculatePlayerDraftValue(player: {
  overall: number;
  potential: number;
  age: number;
  position: PlayerPosition;
  archetype?: PlayerArchetype;
  form?: number;
}): number {
  const { overall, potential, age } = player;

  // 1. Base value curve exponential with OVR
  let baseValue = 0;
  if (overall >= 90) {
    baseValue = 46_000_000 + (overall - 90) * 3_500_000;
  } else if (overall >= 85) {
    baseValue = 26_000_000 + (overall - 85) * 4_000_000;
  } else if (overall >= 80) {
    baseValue = 13_000_000 + (overall - 80) * 2_600_000;
  } else if (overall >= 75) {
    baseValue = 6_000_000 + (overall - 75) * 1_400_000;
  } else if (overall >= 70) {
    baseValue = 2_200_000 + (overall - 70) * 760_000;
  } else if (overall >= 65) {
    baseValue = 900_000 + (overall - 65) * 260_000;
  } else if (overall >= 62) {
    baseValue = 400_000 + (overall - 62) * 120_000;
  } else if (overall >= 58) {
    baseValue = 200_000 + (overall - 58) * 40_000;
  } else {
    baseValue = 150_000;
  }

  // 2. Potential & Youth Multiplier (Growth Room)
  const growthRoom = Math.max(0, potential - overall);
  let youthBonus = 0;

  if (age <= 21 && potential >= 76) {
    // Youth multiplier: Only young players with genuine professional POT gain substantial value
    youthBonus = growthRoom * (age <= 19 ? 550_000 : 400_000);
    if (potential >= 88) youthBonus += 6_000_000;
    else if (potential >= 85) youthBonus += 3_500_000;
    else if (potential >= 80) youthBonus += 1_000_000;

    // Scale youth bonus relative to current ability (raw prospects shouldn't cost as much as established stars)
    const ovrScale = Math.max(0.18, Math.min(1.0, (overall - 54) / 22));
    youthBonus *= ovrScale;
  } else if (age <= 24 && potential >= 80) {
    youthBonus = growthRoom * 250_000;
    if (potential >= 88) youthBonus += 2_000_000;
    const ovrScale = Math.max(0.25, Math.min(1.0, (overall - 58) / 18));
    youthBonus *= ovrScale;
  } else if (age >= 30) {
    // Veteran discount: Milder discount (max 22%) so top veterans cannot be hoarded cheaply
    const penaltyYears = age - 29;
    const discountFactor = Math.max(0.78, 1 - penaltyYears * 0.045);
    baseValue *= discountFactor;
  }

  // 3. Positional premium
  let posMultiplier = 1.0;
  if (player.position === 'ST' || player.position === 'AML' || player.position === 'AMR') {
    posMultiplier = 1.08;
  } else if (player.position === 'GK') {
    posMultiplier = 0.92;
  }

  // 4. Form adjustment
  const formMultiplier = player.form ? 0.9 + (player.form / 10) * 0.2 : 1.0;
  if (overall <= 57 && potential < 76) {
    return 150_000;
  }

  const totalValue = (baseValue + youthBonus) * posMultiplier * formMultiplier;

  // Round to clean €100K steps with strict minimum €150K
  return Math.max(150_000, Math.round(totalValue / 100_000) * 100_000);
}

// ============================================================================
// ARCHETYPE-AWARE ATTRIBUTE GENERATION
// ============================================================================
export function generateArchetypeAttributes(
  pos: PlayerPosition,
  archetype: PlayerArchetype,
  overall: number,
  seed: number
): PlayerAttributes {
  const rand = (offset: number) => pseudoRandom(seed + offset);
  const clamp = (val: number) => Math.max(35, Math.min(99, Math.round(val)));
  const jitter = (range: number, offset: number) => Math.round((rand(offset) - 0.5) * range);

  const isGK = pos === 'GK';

  if (isGK) {
    const isSweeper = archetype === 'Süpürücü Kaleci';
    return {
      pace: clamp(overall * (isSweeper ? 0.65 : 0.45) + jitter(8, 1)),
      acceleration: clamp(overall * (isSweeper ? 0.65 : 0.45) + jitter(8, 2)),
      strength: clamp(overall * 0.85 + jitter(10, 3)),
      stamina: clamp(overall * 0.80 + jitter(10, 4)),
      finishing: clamp(overall * 0.20 + jitter(8, 5)),
      longShots: clamp(overall * 0.20 + jitter(8, 6)),
      passing: clamp(overall * (isSweeper ? 0.75 : 0.55) + jitter(10, 7)),
      vision: clamp(overall * (isSweeper ? 0.72 : 0.52) + jitter(10, 8)),
      crossing: clamp(overall * 0.25 + jitter(8, 9)),
      dribbling: clamp(overall * 0.40 + jitter(10, 10)),
      technique: clamp(overall * 0.50 + jitter(10, 11)),
      heading: clamp(overall * 0.45 + jitter(10, 12)),
      tackling: clamp(overall * 0.40 + jitter(10, 13)),
      marking: clamp(overall * 0.40 + jitter(10, 14)),
      positioning: clamp(overall * 0.85 + jitter(8, 15)),
      aggression: clamp(overall * (isSweeper ? 0.75 : 0.60) + jitter(10, 16)),
      composure: clamp(overall * 0.82 + jitter(10, 17)),
      decisions: clamp(overall * 0.82 + jitter(8, 18)),
      teamwork: clamp(overall * 0.80 + jitter(10, 19)),
      leadership: clamp(overall * 0.75 + jitter(12, 20)),
      handling: clamp(overall + (isSweeper ? 0 : 2) + jitter(6, 21)),
      reflexes: clamp(overall + (isSweeper ? 1 : 3) + jitter(6, 22)),
      positioningGK: clamp(overall + (isSweeper ? 1 : 2) + jitter(6, 23)),
      kicking: clamp(overall * (isSweeper ? 0.95 : 0.80) + jitter(8, 24)),
    };
  }

  // Position & Archetype attribute weighting
  let paceBias = 0;
  let shootingBias = 0;
  let passingBias = 0;
  let dribblingBias = 0;
  let defendingBias = 0;
  let physicalBias = 0;

  switch (archetype) {
    case 'Hızlı Kanat':
      paceBias = 7;
      dribblingBias = 4;
      shootingBias = 2;
      defendingBias = -14;
      break;
    case 'Oyun Kurucu Kanat':
      passingBias = 5;
      visionBias: 5;
      dribblingBias = 4;
      paceBias = 2;
      defendingBias = -10;
      break;
    case 'Oyun Kurucu':
      passingBias = 7;
      dribblingBias = 4;
      physicalBias = -3;
      defendingBias = -6;
      paceBias = -2;
      break;
    case 'Bitirici Forvet':
      shootingBias = 7;
      paceBias = 3;
      defendingBias = -16;
      passingBias = -4;
      break;
    case 'Pres Forvet':
      physicalBias = 4;
      paceBias = 4;
      shootingBias = 3;
      defendingBias = -4;
      break;
    case 'Hedef Santrfor':
      physicalBias = 7;
      shootingBias = 5;
      paceBias = -4;
      defendingBias = -12;
      break;
    case 'Box-to-Box':
      physicalBias = 5;
      defendingBias = 3;
      passingBias = 3;
      shootingBias = 1;
      break;
    case 'Defansif Orta Saha':
      defendingBias = 7;
      physicalBias = 5;
      passingBias = 2;
      shootingBias = -8;
      paceBias = -2;
      break;
    case 'Pasör Stoper':
      defendingBias = 6;
      physicalBias = 4;
      passingBias = 4;
      shootingBias = -12;
      break;
    case 'Fiziksel Stoper':
      defendingBias = 7;
      physicalBias = 7;
      passingBias = -4;
      shootingBias = -14;
      paceBias = -3;
      break;
    case 'Hücumcu Bek':
      paceBias = 6;
      passingBias = 3;
      defendingBias = 2;
      physicalBias = 3;
      break;
    case 'Savunmacı Bek':
      defendingBias = 6;
      physicalBias = 5;
      paceBias = 2;
      passingBias = -2;
      break;
    default:
      break;
  }

  return {
    pace: clamp(overall + paceBias + jitter(8, 25)),
    acceleration: clamp(overall + paceBias + jitter(8, 26)),
    strength: clamp(overall + physicalBias + jitter(8, 27)),
    stamina: clamp(overall + physicalBias + jitter(8, 28)),
    finishing: clamp(overall + shootingBias + jitter(8, 29)),
    longShots: clamp(overall + shootingBias + jitter(8, 30)),
    passing: clamp(overall + passingBias + jitter(8, 31)),
    vision: clamp(overall + passingBias + jitter(8, 32)),
    crossing: clamp(overall + (pos === 'DL' || pos === 'DR' || pos === 'AML' || pos === 'AMR' ? 5 : -5) + jitter(8, 33)),
    dribbling: clamp(overall + dribblingBias + jitter(8, 34)),
    technique: clamp(overall + dribblingBias + jitter(8, 35)),
    heading: clamp(overall + (pos === 'DC' || pos === 'ST' ? 6 : -6) + jitter(8, 36)),
    tackling: clamp(overall + defendingBias + jitter(8, 37)),
    marking: clamp(overall + defendingBias + jitter(8, 38)),
    positioning: clamp(overall + jitter(8, 39)),
    aggression: clamp(overall + jitter(10, 40)),
    composure: clamp(overall + jitter(8, 41)),
    decisions: clamp(overall + jitter(8, 42)),
    teamwork: clamp(overall + jitter(8, 43)),
    leadership: clamp(overall + jitter(10, 44)),
    handling: 15,
    reflexes: 15,
    positioningGK: 15,
    kicking: 20,
  };
}

// ============================================================================
// MASTER PLAYER POOL GENERATOR (EXACTLY 2,000 UNIQUE PLAYERS)
// ============================================================================
export function generateDraftPlayerPool(): Player[] {
  const pool: Player[] = [];
  const usedNameCombos = new Set<string>();
  let seedCounter = 20260001;

  for (const alloc of POSITION_ALLOCATIONS) {
    for (let i = 0; i < alloc.count; i++) {
      seedCounter++;
      const overall = generateTargetOverall(seedCounter);

      // Realistic age curve
      const ageRand = pseudoRandom(seedCounter * 17.3);
      let age: number;
      if (ageRand < 0.15) {
        age = 17 + Math.floor(pseudoRandom(seedCounter * 19.1) * 4); // 17-20
      } else if (ageRand < 0.45) {
        age = 21 + Math.floor(pseudoRandom(seedCounter * 19.1) * 4); // 21-24
      } else if (ageRand < 0.80) {
        age = 25 + Math.floor(pseudoRandom(seedCounter * 19.1) * 4); // 25-28
      } else if (ageRand < 0.93) {
        age = 29 + Math.floor(pseudoRandom(seedCounter * 19.1) * 3); // 29-31
      } else {
        age = 32 + Math.floor(pseudoRandom(seedCounter * 19.1) * 3); // 32-34
      }

      // Potential ceiling (strictly clamped to max 94)
      let potential = overall;
      if (age <= 20) {
        potential = Math.min(94, overall + Math.floor(pseudoRandom(seedCounter * 23.3) * 12) + 4);
      } else if (age <= 23) {
        potential = Math.min(94, overall + Math.floor(pseudoRandom(seedCounter * 23.3) * 8) + 2);
      } else if (age <= 26) {
        potential = Math.min(94, overall + Math.floor(pseudoRandom(seedCounter * 23.3) * 4));
      }

      // Cultural region assignment
      const regionIdx = Math.floor(pseudoRandom(seedCounter * 29.7) * REGIONAL_NAME_SETS.length);
      const regSet = REGIONAL_NAME_SETS[regionIdx];

      let firstName = '';
      let lastName = '';
      let combo = '';
      let tries = 0;

      while (tries < 60) {
        tries++;
        const fIdx = Math.floor(pseudoRandom(seedCounter * 31.1 + tries * 7) * regSet.firstNames.length);
        const lIdx = Math.floor(pseudoRandom(seedCounter * 37.3 + tries * 11) * regSet.lastNames.length);
        firstName = regSet.firstNames[fIdx];
        lastName = regSet.lastNames[lIdx];
        combo = `${firstName} ${lastName}`;

        if (!usedNameCombos.has(combo) && !REAL_LIFE_STAR_BLACKLIST.has(combo.toLowerCase())) {
          usedNameCombos.add(combo);
          break;
        }
      }

      const natIdx = Math.floor(pseudoRandom(seedCounter * 41.9) * regSet.nationalities.length);
      const nationality = regSet.nationalities[natIdx];

      // Foot preference
      const footR = pseudoRandom(seedCounter * 43.1);
      const preferredFoot: PreferredFoot = footR < 0.65 ? 'Sağ' : footR < 0.90 ? 'Sol' : 'Her İkisi';

      // Height / Weight
      const height = alloc.pos === 'GK'
        ? 188 + Math.floor(pseudoRandom(seedCounter * 47.1) * 11)
        : alloc.pos === 'DC'
        ? 185 + Math.floor(pseudoRandom(seedCounter * 47.1) * 11)
        : 173 + Math.floor(pseudoRandom(seedCounter * 47.1) * 17);
      const weight = Math.round(height * 0.42 + pseudoRandom(seedCounter * 49.3) * 9);

      // Archetype
      const archIdx = Math.floor(pseudoRandom(seedCounter * 53.7) * alloc.archetypes.length);
      const archetype = alloc.archetypes[archIdx];

      // Development Curve
      const dcRand = pseudoRandom(seedCounter * 59.9);
      const developmentCurve: DevelopmentCurve =
        dcRand < 0.25 ? 'EARLY_PEAK' : dcRand < 0.75 ? 'BALANCED' : 'LATE_BLOOMER';

      // Hidden attributes (Consistency, big match, injury proneness, etc.)
      const consistency = 50 + Math.floor(pseudoRandom(seedCounter * 61.1) * 45);
      const bigMatchPerformance = 50 + Math.floor(pseudoRandom(seedCounter * 67.3) * 45);
      const injuryProneness = 15 + Math.floor(pseudoRandom(seedCounter * 71.9) * 45);
      const professionalism = 50 + Math.floor(pseudoRandom(seedCounter * 73.1) * 45);
      const workEthic = 50 + Math.floor(pseudoRandom(seedCounter * 79.7) * 45);

      const hiddenAttributes: HiddenPlayerAttributes = {
        consistency,
        bigMatchPerformance,
        injuryProneness,
        professionalism,
        workEthic,
        developmentCurve,
      };

      // "YÜKSELEN YETENEK" Badge criteria: Age <= 21, POT >= 84, growth >= 6
      const isRisingTalent = age <= 21 && potential >= 84 && (potential - overall) >= 6;

      // Draft & Market Value
      const draftValue = calculatePlayerDraftValue({
        overall,
        potential,
        age,
        position: alloc.pos,
        archetype,
        form: 7.0,
      });

      // Realistic Attributes
      const attributes = generateArchetypeAttributes(alloc.pos, archetype, overall, seedCounter * 100);

      const player: Player = {
        id: `sc-p-${String(pool.length + 1).padStart(4, '0')}`,
        clubId: 'DRAFT_POOL',
        firstName,
        lastName,
        nationality,
        age,
        birthDate: `200${Math.max(0, 8 - (age - 17))}-05-15`,
        position: alloc.pos,
        secondaryPositions: alloc.secondaries,
        preferredFoot,
        height,
        weight,
        attributes,
        overall,
        potential,
        morale: 80,
        fitness: 100,
        matchSharpness: 90,
        form: 7.0,
        marketValue: draftValue,
        draftValue,
        wage: Math.round(overall * 450),
        contractStart: '2026-08-01',
        contractEnd: '2028-06-30',
        squadRole: overall >= 85 ? 'Yıldız Oyuncu' : overall >= 80 ? 'Önemli Oyuncu' : overall >= 74 ? 'İlk 11' : 'Rotasyon',
        archetype,
        isRisingTalent,
        hiddenAttributes,
        scoutingReport: {
          isFullyScouted: false,
          scoutedLevel: 50,
          estimatedOvrMin: Math.max(50, overall - 3),
          estimatedOvrMax: Math.min(94, overall + 3),
          estimatedPotMin: Math.max(50, potential - 4),
          estimatedPotMax: Math.min(94, potential + 4),
        },
      };

      pool.push(player);
    }
  }

  return pool;
}

// Singleton pool instance for consistent fast access in memory (<1ms cached retrieval)
let cachedDraftPool: Player[] | null = null;

export function getCachedDraftPlayerPool(): Player[] {
  if (!cachedDraftPool) {
    cachedDraftPool = generateDraftPlayerPool();
  }
  return cachedDraftPool;
}

export function resetCachedDraftPlayerPool(): void {
  cachedDraftPool = null;
}
