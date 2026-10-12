export type Experience = 'Начинающий' | 'Любитель' | 'Опытный' | 'Профи';
export type City = string;
export type Role = 'Вокалист' | 'Гитарист' | 'Барабанщик' | 'Басист' | 'Клавишник' | 'Продюсер' | 'Звукорежиссёр' | 'Битмейкер' | 'Композитор' | 'Автор текстов' | 'Аранжировщик';

export type ProfileType = 'musician' | 'group' | 'specialist';

export type MediaItem = {
  id: string;
  title: string;
  description: string;
  type: 'audio' | 'video' | 'image';
  url: string;
  duration?: string;
};

export type UserProfile = {
  id: string;
  type: ProfileType;
  name: string;
  city: City;
  genres: string[];
  role: string;
  roleLabel?: string;
  description: string;
  experience: Experience;
  lookingFor?: string;
  openToProjects?: boolean;
  status?: string;
  availability?: string;
  goals?: string[];
  instruments?: string[];
  favoriteInfluences?: string[];
  links?: string[];
  portfolio: MediaItem[];
  photo: string;
  cover: string;
  isOnline?: boolean;
};

export type GroupProfile = {
  id: string;
  type: 'group';
  name: string;
  city: City;
  genres: string[];
  description: string;
  cover: string;
  photo?: string;
  members: { name: string; role: string }[];
  openPositions: string[];
  rehearsalSchedule: string;
  collaboration: string;
  portfolio: MediaItem[];
};

export const cities: City[] = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Нур-Султан', 'Павлодар'];
export const genresList = ['Rock', 'Indie', 'Jazz', 'Electronic', 'Funk', 'Hip-Hop', 'Metal', 'Pop', 'Soul', 'Punk', 'Acoustic', 'Alternative'];
export const rolesList: Role[] = ['Вокалист', 'Гитарист', 'Барабанщик', 'Басист', 'Клавишник', 'Продюсер', 'Звукорежиссёр', 'Битмейкер', 'Композитор', 'Автор текстов', 'Аранжировщик'];

export function getAccentForName(name: string) {
  const gradients = [
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #8b5cf6, #ec4899)',
    'linear-gradient(135deg, #22c55e, #14b8a6)',
    'linear-gradient(135deg, #06b6d4, #3b82f6)',
    'linear-gradient(135deg, #f472b6, #a855f7)',
    'linear-gradient(135deg, #2dd4bf, #0ea5e9)',
    'linear-gradient(135deg, #f97316, #fb7185)',
  ];

  const index = name.split('').reduce((total, char) => total + char.charCodeAt(0), 0) % gradients.length;
  return gradients[index];
}

export const demoProfiles: UserProfile[] = [
  {
    id: 'm1',
    type: 'musician',
    name: 'Арсений Ковалёв',
    city: 'Алматы',
    genres: ['Rock', 'Alternative'],
    role: 'Вокалист',
    roleLabel: 'Рок-вокалист',
    description: 'Ищу группу для живых выступлений и записи EP. Люблю драйвовые рифы, атмосферные припевы и сильную сценическую энергию.',
    experience: 'Опытный',
    lookingFor: 'Ищу группу',
    openToProjects: true,
    status: 'Открыт к проектам',
    availability: 'Готов к репетициям 2–3 раза в неделю',
    goals: ['Концерты', 'Запись', 'Коммерческий проект'],
    instruments: ['Вокал', 'Фортепиано'],
    favoriteInfluences: ['The Black Keys', 'Muse', 'Radiohead'],
    links: ['https://soundcloud.com', 'https://instagram.com'],
    portfolio: [
      { id: 'a1', title: 'Live session — Вспышка', description: 'Акустическая демо-версия', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: '02:36' },
      { id: 'v1', title: 'Сцена на репетиции', description: 'Короткое видео с концерта', type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    ],
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    cover: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
    isOnline: true,
  },
  {
    id: 'm2',
    type: 'musician',
    name: 'Алия Нурбекова',
    city: 'Астана',
    genres: ['Jazz', 'Soul'],
    role: 'Вокалист',
    roleLabel: 'Джазовая вокалистка',
    description: 'Работаю в стиле джаз, соул и современный поп. Поддерживаю как сольные проекты, так и группу с интересной аранжировкой.',
    experience: 'Профи',
    lookingFor: 'Ищу группу',
    openToProjects: true,
    status: 'Открыта к сотрудничеству',
    availability: 'Можно в онлайн-репетиции',
    goals: ['Джем', 'Запись', 'Концерты'],
    instruments: ['Вокал'],
    favoriteInfluences: ['Etta James', 'Norah Jones', 'Carmen McRae'],
    links: ['https://bandcamp.com', 'https://spotify.com'],
    portfolio: [
      { id: 'a2', title: 'Jazzy room demo', description: 'Песня в живом составе', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: '03:21' },
    ],
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
    cover: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
    isOnline: true,
  },
  {
    id: 'm3',
    type: 'musician',
    name: 'Данил Миронов',
    city: 'Шымкент',
    genres: ['Rock', 'Metal'],
    role: 'Барабанщик',
    roleLabel: 'Барабанщик',
    description: 'Ищу группу с мощным звуком и понятной сценической динамикой. Работаю в стиле метал и альтернативный рок.',
    experience: 'Опытный',
    lookingFor: 'Ищу группу',
    openToProjects: true,
    status: 'Ищу группу',
    availability: 'Репетиции по выходным',
    goals: ['Группа', 'Концерты'],
    instruments: ['Ударные', 'Перкуссия'],
    favoriteInfluences: ['Tool', 'Rammstein', 'System of a Down'],
    links: ['https://youtube.com'],
    portfolio: [
      { id: 'a3', title: 'Drum sample', description: 'Демка для рок-группы', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: '02:02' },
    ],
    photo: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80',
    cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'm4',
    type: 'musician',
    name: 'Елена Ким',
    city: 'Алматы',
    genres: ['Electronic', 'Pop'],
    role: 'Клавишник',
    roleLabel: 'Клавишник',
    description: 'Создаю атмосферную электронную музыку, люблю синтезаторы, живые партии и органичный саунд.',
    experience: 'Профи',
    status: 'Открыт к проектам',
    availability: 'Возможна онлайн работа',
    goals: ['Запись', 'Коммерческий проект'],
    instruments: ['Клавишные', 'Синтезаторы'],
    favoriteInfluences: ['Daft Punk', 'Kiasmos', 'Bicep'],
    links: ['https://soundcloud.com'],
    portfolio: [
      { id: 'a4', title: 'Synth loop', description: 'Звуковая идея для трека', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: '01:58' },
    ],
    photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
    cover: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=1200&q=80',
    isOnline: true,
  },
  {
    id: 'm5',
    type: 'musician',
    name: 'Нурлан Сариев',
    city: 'Караганда',
    genres: ['Rock', 'Punk'],
    role: 'Гитарист',
    roleLabel: 'Рок-гитарист',
    description: 'Сочетаю агрессивный ритм и мелодичные партии. Ищу группу с интересным концертным материалом.',
    experience: 'Опытный',
    lookingFor: 'Ищу группу',
    openToProjects: false,
    status: 'Ищет группу',
    availability: 'Готов к выездам',
    goals: ['Группа', 'Концерты'],
    instruments: ['Электрогитара', 'Акустика'],
    favoriteInfluences: ['The Stooges', 'Sonic Youth', 'The Hives'],
    portfolio: [],
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    cover: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'm6',
    type: 'musician',
    name: 'София Григорьева',
    city: 'Нур-Султан',
    genres: ['Acoustic', 'Folk'],
    role: 'Вокалист',
    roleLabel: 'Фолк-вокалист',
    description: 'Пишу слова и исполняю песни в живом акустическом формате. Люблю тёплый вокал и камерный звук.',
    experience: 'Любитель',
    openToProjects: true,
    status: 'Открыта к проектам',
    availability: 'Работа онлайн и офлайн',
    goals: ['Запись', 'Джем'],
    instruments: ['Вокал', 'Гитара'],
    favoriteInfluences: ['Mitski', 'Sofia Isella', 'Joni Mitchell'],
    portfolio: [],
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'm7',
    type: 'musician',
    name: 'Андрей Плотников',
    city: 'Павлодар',
    genres: ['Hip-Hop', 'Electronic'],
    role: 'Битмейкер',
    roleLabel: 'Битмейкер',
    description: 'Собираю лупы и ритмические основы для рэпа, электроники и экспериментов с атмосферой.',
    experience: 'Профи',
    openToProjects: true,
    status: 'Открыт к проектам',
    availability: 'Онлайн согласование',
    goals: ['Коммерческий проект', 'Запись'],
    instruments: ['DAW', 'Сэмплы', 'Производство'],
    favoriteInfluences: ['Kendrick Lamar', 'Kanye West', 'Lorde'],
    portfolio: [],
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'm8',
    type: 'musician',
    name: 'Марина Трофимова',
    city: 'Алматы',
    genres: ['Pop', 'Electronic'],
    role: 'Композитор',
    roleLabel: 'Композитор',
    description: 'Пишу синкопированные мелодии и продюсирую саунд для поп- и синт-проектов.',
    experience: 'Опытный',
    status: 'Открыта к проектам',
    availability: 'Онлайн',
    goals: ['Коммерческий проект', 'Запись'],
    instruments: ['Синтезатор', 'Пианино'],
    favoriteInfluences: ['Katy Perry', 'Beyoncé', 'Daft Punk'],
    portfolio: [],
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80',
    isOnline: true,
  },
  {
    id: 'm9',
    type: 'musician',
    name: 'Виктор Данышев',
    city: 'Астана',
    genres: ['Jazz', 'Funk'],
    role: 'Басист',
    roleLabel: 'Басист',
    description: 'Фокус на groove, ритм и уверенность в живом и записанном исполнении.',
    experience: 'Опытный',
    openToProjects: true,
    status: 'Открыт к проектам',
    availability: 'Доступен к репетициям',
    goals: ['Джем', 'Группа', 'Концерты'],
    instruments: ['Бас-гитара', 'Ударные'],
    favoriteInfluences: ['Funkadelic', 'Jaco Pastorius', 'Marcus Miller'],
    portfolio: [],
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    cover: 'https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'm10',
    type: 'musician',
    name: 'Динара Мусина',
    city: 'Шымкент',
    genres: ['R&B', 'Soul'],
    role: 'Автор текстов',
    roleLabel: 'Автор текстов',
    description: 'Пишу тексты и мелодии для разных жанров, увлекаюсь эмоциональными и живыми историями.',
    experience: 'Любитель',
    openToProjects: true,
    status: 'Открыта к проектам',
    availability: 'Можно онлайн',
    goals: ['Коммерческий проект', 'Запись'],
    instruments: ['Пианино', 'Вокал'],
    favoriteInfluences: ['Adele', 'Sabrina Claudio', 'Amy Winehouse'],
    portfolio: [],
    photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
    cover: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'm11',
    type: 'musician',
    name: 'Тимур Жемчужников',
    city: 'Алматы',
    genres: ['Alternative', 'Indie'],
    role: 'Гитарист',
    roleLabel: 'Инди-гитарист',
    description: 'Работаю над атмосферными композициями и живыми сетами, люблю гитары с пространственным звуком.',
    experience: 'Опытный',
    openToProjects: true,
    status: 'Открыт к проектам',
    availability: 'Онлайн + репетиции',
    goals: ['Группа', 'Запись'],
    instruments: ['Электрогитара', 'Педали'],
    favoriteInfluences: ['The National', 'Arcade Fire', 'The xx'],
    portfolio: [],
    photo: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80',
    cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    isOnline: true,
  },
  {
    id: 'm12',
    type: 'musician',
    name: 'Дарья Лебедева',
    city: 'Караганда',
    genres: ['Jazz', 'Soul'],
    role: 'Вокалист',
    roleLabel: 'Джазовая вокалистка',
    description: 'Исполнение в жанрах соул, джаз и ритм-н-блюз. Люблю ансамбль и артистичную импровизацию.',
    experience: 'Начинающий',
    status: 'Готова к джему',
    availability: 'Онлайн-сотрудничество',
    goals: ['Джем', 'Группа'],
    instruments: ['Вокал', 'Пианино'],
    favoriteInfluences: ['Ella Fitzgerald', 'Ariana Grande', 'Esperanza Spalding'],
    portfolio: [],
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
    cover: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
    isOnline: true,
  },
];

export const demoGroups: GroupProfile[] = [
  {
    id: 'g1',
    type: 'group',
    name: 'Midnight Echo',
    city: 'Алматы',
    genres: ['Rock', 'Alternative'],
    description: 'Группа ищет басиста и клавишника для записи нового материала и концертной программы.',
    cover: 'https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=1200&q=80',
    members: [
      { name: 'Роман', role: 'Вокал' },
      { name: 'Илья', role: 'Гитара' },
      { name: 'Кирилл', role: 'Барабаны' },
    ],
    openPositions: ['Басист', 'Клавишник'],
    rehearsalSchedule: '2 раза в неделю',
    collaboration: 'Рассматриваем сценические и запись',
    portfolio: [
      { id: 'grp1', title: 'Midnight Echo — demo', description: 'Черновая версия трека', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', duration: '03:42' },
    ],
  },
  {
    id: 'g2',
    type: 'group',
    name: 'Плечи Солнца',
    city: 'Астана',
    genres: ['Indie', 'Pop'],
    description: 'Лёгкая, чуть лиричная группа. Ищем аранжировщика и продюсера для нового EP.',
    cover: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
    members: [
      { name: 'Амина', role: 'Вокал' },
      { name: 'Бек', role: 'Гитара' },
      { name: 'Леон', role: 'Барабаны' },
    ],
    openPositions: ['Аранжировщик', 'Продюсер'],
    rehearsalSchedule: '1 раз в неделю',
    collaboration: 'Онлайн и офлайн',
    portfolio: [],
  },
  {
    id: 'g3',
    type: 'group',
    name: 'Блокировка',
    city: 'Шымкент',
    genres: ['Punk', 'Rock'],
    description: 'Команда для живых выступлений, коротких туров и быстрых репетиций. Ищем опытного басиста.',
    cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    members: [
      { name: 'Жан', role: 'Вокал' },
      { name: 'Комар', role: 'Гитара' },
      { name: 'Саша', role: 'Барабаны' },
    ],
    openPositions: ['Басист'],
    rehearsalSchedule: '3 раза в неделю',
    collaboration: 'Концерты и репетиции',
    portfolio: [],
  },
  {
    id: 'g4',
    type: 'group',
    name: 'Ночной Дорожный',
    city: 'Караганда',
    genres: ['Jazz', 'Funk'],
    description: 'Инструментальный квартет с живой импровизацией и сильным groove. Ищем вокалиста и саксофониста.',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
    members: [
      { name: 'Костя', role: 'Гитара' },
      { name: 'Михаил', role: 'Бас' },
      { name: 'Али', role: 'Барабаны' },
    ],
    openPositions: ['Вокалист', 'Саксофонист'],
    rehearsalSchedule: 'Раз в неделю с джемом',
    collaboration: 'Онлайн + офлайн',
    portfolio: [],
  },
  {
    id: 'g5',
    type: 'group',
    name: 'Лазерная Трава',
    city: 'Алматы',
    genres: ['Electronic', 'Alternative'],
    description: 'Группа для синт-поп и электронных эффектов. Нужен звукорежиссёр и продюсер для записи EP.',
    cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80',
    members: [
      { name: 'Света', role: 'Вокал' },
      { name: 'Антон', role: 'Клавиши' },
      { name: 'Расул', role: 'Синтезаторы' },
    ],
    openPositions: ['Звукорежиссёр', 'Продюсер'],
    rehearsalSchedule: '1–2 раза в неделю',
    collaboration: 'Онлайн',
    portfolio: [],
  },
];

export const demoSpecialists: UserProfile[] = [
  {
    id: 's1',
    type: 'specialist',
    name: 'Егор Лапин',
    city: 'Алматы',
    genres: ['Electronic', 'Hip-Hop'],
    role: 'Продюсер',
    roleLabel: 'Продюсер для электронной музыки',
    description: 'Помогаю артистам доводить треки до качественного коммерческого звучания и формировать концепцию релизов.',
    experience: 'Профи',
    status: 'Работаю онлайн',
    availability: 'Готов к проектам с августа',
    goals: ['Коммерческий проект', 'Запись'],
    instruments: ['DAW', 'Сведение'],
    favoriteInfluences: ['Bicep', 'Tyler', 'The Weeknd'],
    portfolio: [
      { id: 'sp1', title: 'Лонг-плей демо', description: 'Пример продюсирования', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', duration: '04:05' },
    ],
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    cover: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
    isOnline: true,
  },
  {
    id: 's2',
    type: 'specialist',
    name: 'Айнур Жанбосын',
    city: 'Астана',
    genres: ['Rock', 'Pop'],
    role: 'Звукорежиссёр',
    roleLabel: 'Специалист по сведению и мастерингу',
    description: 'Сведение и мастеринг для рок-, инди- и поп-проектов. Работаю отдельно и с группами.',
    experience: 'Профи',
    status: 'Работаю online',
    availability: 'Можно сотрудничество удаленно',
    goals: ['Запись', 'Коммерческий проект'],
    instruments: ['Pro Tools', 'Ableton', 'Logic Pro'],
    favoriteInfluences: ['Radiohead', 'The 1975', 'Tame Impala'],
    portfolio: [
      { id: 'sp2', title: 'Mastering sample', description: 'Образец мастеринга', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', duration: '02:51' },
    ],
    photo: 'https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=800&q=80',
    cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    isOnline: true,
  },
  {
    id: 's3',
    type: 'specialist',
    name: 'Иван Шарипов',
    city: 'Шымкент',
    genres: ['Hip-Hop', 'Electronic'],
    role: 'Битмейкер',
    roleLabel: 'Битмейкер',
    description: 'Делаю лупы для рэперов, музыкантов и креативных команд. Подхожу под конкретный посыл трека.',
    experience: 'Опытный',
    status: 'Открыт к сотрудничеству',
    availability: 'Сроки по проектам',
    goals: ['Коммерческий проект', 'Запись'],
    instruments: ['FL Studio', 'Ableton'],
    favoriteInfluences: ['Travis Scott', 'Metro Boomin', 'Kendrick Lamar'],
    portfolio: [],
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 's4',
    type: 'specialist',
    name: 'Лиза Жильцова',
    city: 'Алматы',
    genres: ['Pop', 'Electronic'],
    role: 'Композитор',
    roleLabel: 'Композитор',
    description: 'Создаю мелодии, гармонии, аккомпанемент и музыкальные идеи под кампании, клипы и проекты.',
    experience: 'Профи',
    status: 'Работаю онлайн',
    availability: 'Принимаю заказы по расписанию',
    goals: ['Коммерческий проект'],
    instruments: ['Пианино', 'DAW'],
    favoriteInfluences: ['Lorde', 'Kimbra', 'Julia Jacklin'],
    portfolio: [],
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    cover: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=1200&q=80',
    isOnline: true,
  },
  {
    id: 's5',
    type: 'specialist',
    name: 'Марат Абдрахманов',
    city: 'Нур-Султан',
    genres: ['Jazz', 'Acoustic'],
    role: 'Аранжировщик',
    roleLabel: 'Аранжировщик',
    description: 'Управляю аранжировкой для живых составов, делаю партии для песни и записи.',
    experience: 'Опытный',
    status: 'Свободен на несколько проектов',
    availability: 'Онлайн и офлайн',
    goals: ['Запись', 'Концерты'],
    instruments: ['Пианино', 'DAW', 'Струнные'],
    favoriteInfluences: ['Bill Evans', 'Snarky Puppy', 'Pat Metheny'],
    portfolio: [],
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80',
  },
];

export const demoMessages = [
  { id: 'c1', channel: 'general', name: 'Джулия', author: 'Джулия', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', accent: 'linear-gradient(135deg, #f59e0b, #ef4444)', text: 'Ищу вокалистку для джем-сессии в Алматы на выходных.', time: '09:15', tags: ['вокал', 'джем'] },
  { id: 'c2', channel: 'general', name: 'Тимур', author: 'Тимур', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', accent: 'linear-gradient(135deg, #22c55e, #14b8a6)', text: 'У меня есть студия в центре, можно репетировать по вечерам.', time: '09:22', tags: ['студия', 'репетиции'] },
  { id: 'c3', channel: 'search-group', name: 'Рина', author: 'Рина', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=80', accent: 'linear-gradient(135deg, #8b5cf6, #ec4899)', text: 'Нужен басист в инди-группу с репетициями 2 раза в неделю.', time: '10:10', tags: ['группа', 'бас'] },
  { id: 'c4', channel: 'rehearsals', name: 'Саша', author: 'Саша', avatar: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80', accent: 'linear-gradient(135deg, #06b6d4, #3b82f6)', text: 'У кого есть свободный зал на субботу вечером?', time: '11:20', tags: ['зал', 'репетиции'] },
  { id: 'c5', channel: 'production', name: 'Мирослава', author: 'Мирослава', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', accent: 'linear-gradient(135deg, #f472b6, #a855f7)', text: 'Есть опыт мастеринга для поп- и электронных проектов, пишите.', time: '12:05', tags: ['мастеринг', 'электроника'] },
  { id: 'c6', channel: 'almaty', name: 'Никита', author: 'Никита', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80', accent: 'linear-gradient(135deg, #2dd4bf, #0ea5e9)', text: 'Кто знаком с местными площадками для живых выступлений?', time: '13:40', tags: ['концерты', 'алматы'] },
  { id: 'c7', channel: 'astana', name: 'Ева', author: 'Ева', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80', accent: 'linear-gradient(135deg, #fb7185, #f97316)', text: 'Нужен звукорежиссёр для записи демо в студии в районе Есиля.', time: '14:08', tags: ['звук', 'студия'] },
];

export const demoUser = {
  id: 'me',
  type: 'musician',
  name: 'Вы',
  city: 'Алматы',
  genres: ['Rock', 'Alternative'],
  role: 'Вокалист',
  description: 'Ищу вдохновляющую команду для новых песен и живых выступлений.',
  experience: 'Опытный',
  instruments: ['Вокал', 'Гитара'],
  availability: 'Открыт к онлайн-диалогу',
  photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  cover: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
  portfolio: [],
  links: ['https://soundcloud.com'],
};

export const listingsSeed = [
  {
    id: 'ad1',
    type: 'musician',
    title: 'Ищу гитариста для инди-рок проекта',
    city: 'Алматы',
    description: 'Нужен гитарист с чувством ритма и готовностью к репетициям 2 раза в неделю.',
    genres: ['Rock', 'Indie'],
    role: 'Гитарист',
    format: 'офлайн',
    payment: 'обсуждается',
  },
  {
    id: 'ad2',
    type: 'group',
    title: 'Нужен вокалист для фанк-группы',
    city: 'Астана',
    description: 'Репетиции по средам и воскресеньям, хочется живой энергии и уверенного выступления.',
    genres: ['Funk', 'Soul'],
    role: 'Вокалист',
    format: 'онлайн/офлайн',
    payment: 'оплачиваемое',
  },
  {
    id: 'ad3',
    type: 'specialist',
    title: 'Нужен продюсер для электронного EP',
    city: 'Онлайн',
    description: 'Ищем продюсера для создания 3–5 треков в электронном и синт-поп направлении.',
    genres: ['Electronic', 'Pop'],
    role: 'Продюсер',
    format: 'онлайн',
    payment: 'по договорённости',
  },
];

export const demoListings = listingsSeed;
