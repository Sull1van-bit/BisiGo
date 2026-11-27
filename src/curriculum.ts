import type {
  UnitData,
  SignData,
  LevelData,
  ExerciseStep,
  PatuliModelCategory,
  SentenceData,
} from './types.ts';
import { buildWordBankOptions } from './utils/sentenceExercise.ts';

export const WORD_MODEL_LABELS = [
  'Kiri',
  'Kanan',
  'Atas',
  'Bawah',
  'Kamu',
  'Saya',
  'Siapa',
  'Mana',
  'Menulis',
  'Terima Kasih',
  'Sama-sama',
  'Apa',
  'Betul',
  'Salah',
  'Lagi',
  'Laki-laki',
  'Perempuan',
  'Sahabat',
  'Hubungan',
  'Cinta',
  'Kuat',
  'Waktu',
  'Ingin',
] as const;

function makeSign(
  modelCategory: PatuliModelCategory,
  unitId: string,
  roboflowClass: string,
  wordId: string,
  wordEn: string,
  hintId: string,
  hintEn: string,
  scenarioId: string,
  scenarioEn: string
): SignData {
  return {
    roboflowClass,
    modelCategory,
    unitId,
    wordId,
    wordEn,
    hintId,
    hintEn,
    scenarioId,
    scenarioEn,
  };
}

export const CURRICULUM: UnitData[] = [
  {
    id: 'unit-1',
    modelCategory: 'kata',
    theme: 'emerald',
    title: {
      id: 'Unit 1: Perkenalan & Identitas Diri',
      en: 'Unit 1: Introductions & Identity',
    },
    description: {
      id: 'Pelajari kata ganti & identitas diri lalu rangkai menjadi kalimat perkenalan BISINDO',
      en: 'Learn pronouns & identity signs, then chain them into BISINDO introduction sentences',
    },
    levels: [
      {
        id: '1.1',
        title: { id: 'Kata Ganti & Tanya Siapa', en: 'Pronouns & Who' },
        signs: [
          makeSign(
            'kata',
            'unit-1',
            'Saya',
            'Saya',
            'I / Me',
            'Arahkan jari telunjuk atau telapak tangan menyentuh bagian tengah dada sendiri.',
            'Point your index finger or palm inward toward the center of your own chest.',
            'Saat memperkenalkan diri sendiri kepada teman baru:',
            'When introducing yourself to a new friend:'
          ),
          makeSign(
            'kata',
            'unit-1',
            'Kamu',
            'Kamu',
            'You',
            'Arahkan jari telunjuk lurus menunjuk ke arah lawan bicara (ke depan kamera).',
            'Point your index finger straight forward toward the person you are talking to (the camera).',
            'Menunjuk atau menyapa lawan bicara secara langsung:',
            'Directly addressing the person in front of you:'
          ),
          makeSign(
            'kata',
            'unit-1',
            'Siapa',
            'Siapa',
            'Who',
            'Letakkan kepalan tangan dengan ibu jari/jari di samping dagu atau pipi sesuai isyarat tanya "Siapa".',
            'Hold your hand near the side of your chin or cheek in the BISINDO question gesture for "Who".',
            'Menanyakan identitas seseorang yang baru datang:',
            'Asking who just arrived or asking someone’s name:'
          ),
        ],
      },
      {
        id: '1.2',
        title: { id: 'Identitas & Sahabat', en: 'Identity & Close Friend' },
        signs: [
          makeSign(
            'kata',
            'unit-1',
            'Laki-laki',
            'Laki-laki',
            'Man / Male',
            'Angkat tangan terbuka di dekat pelipis/dahi kanan seperti memegang tepi topi.',
            'Raise your open hand near your right temple/forehead like touching the brim of a cap.',
            'Menyebutkan saudara atau teman laki-laki:',
            'Referring to a male friend or brother:'
          ),
          makeSign(
            'kata',
            'unit-1',
            'Perempuan',
            'Perempuan',
            'Woman / Female',
            'Sentuhkan tangan/ibu jari di sisi pipi bawah atau cuping telinga (seperti anting) dengan lembut.',
            'Hold your hand lightly beside your lower cheek/earlobe area.',
            'Menyebutkan teman atau anggota keluarga perempuan:',
            'Referring to a female friend or family member:'
          ),
          makeSign(
            'kata',
            'unit-1',
            'Sahabat',
            'Sahabat',
            'Close Friend',
            'Kaitkan jari telunjuk kedua tangan atau rapatkan kedua tangan melambangkan keakraban sahabat.',
            'Hook your index fingers or join hands together symbolizing close friendship.',
            'Memperkenalkan teman akrab yang selalu mendukung:',
            'Introducing a close friend:'
          ),
        ],
      },
      {
        id: '1.3',
        title: { id: 'Rangkai Kalimat Perkenalan', en: 'Build Intro Sentences' },
        signs: [],
        sentences: [
          {
            id: 'u1-s1',
            signs: ['Kamu', 'Siapa'],
            meaningId: 'Siapa kamu?',
            meaningEn: 'Who are you?',
            hintId: 'Tunjuk lawan bicara (Kamu), lalu isyaratkan kata tanya (Siapa).',
            hintEn: 'Point forward (Kamu), then perform the question sign (Siapa).',
          },
          {
            id: 'u1-s2',
            signs: ['Kamu', 'Laki-laki'],
            meaningId: 'Kamu laki-laki.',
            meaningEn: 'You are a man.',
            hintId: 'Mulai dengan menunjuk ke depan (Kamu), dilanjutkan isyarat di dekat dahi (Laki-laki).',
            hintEn: 'Start by pointing forward (Kamu), followed by the forehead sign (Laki-laki).',
          },
          {
            id: 'u1-s3',
            signs: ['Saya', 'Perempuan'],
            meaningId: 'Saya perempuan.',
            meaningEn: 'I am a woman.',
            hintId: 'Tunjuk dada sendiri (Saya), lalu sentuhkan jari di samping pipi (Perempuan).',
            hintEn: 'Point to your chest (Saya), then touch beside your cheek (Perempuan).',
          },
          {
            id: 'u1-s4',
            signs: ['Kamu', 'Sahabat', 'Saya'],
            meaningId: 'Kamu sahabat saya.',
            meaningEn: 'You are my close friend.',
            hintId: 'Rangkai tiga isyarat berurutan: Kamu → Sahabat → Saya.',
            hintEn: 'Chain three signs in sequence: Kamu → Sahabat → Saya.',
          },
        ],
      },
      {
        id: '1.4',
        title: { id: 'Ujian Unit Perkenalan', en: 'Introductions Unit Review' },
        isUnitReview: true,
        signs: [],
      },
    ],
  },
  {
    id: 'unit-2',
    modelCategory: 'kata',
    theme: 'blue',
    title: {
      id: 'Unit 2: Sopan Santun & Konfirmasi',
      en: 'Unit 2: Courtesy & Confirmation',
    },
    description: {
      id: 'Ungkapkan terima kasih, balasan sopan, pertanyaan, dan konfirmasi benar/salah',
      en: 'Express thanks, polite replies, questions, and true/false confirmation in sentences',
    },
    levels: [
      {
        id: '2.1',
        title: { id: 'Terima Kasih & Pertanyaan', en: 'Gratitude & What' },
        signs: [
          makeSign(
            'kata',
            'unit-2',
            'Terima Kasih',
            'Terima Kasih',
            'Thank You',
            'Sentuhkan ujung jari-jari tangan yang rapat di depan bibir/dagu lalu gerakkan sedikit ke depan.',
            'Bring your flat fingers to your chin/lips and extend slightly forward in gratitude.',
            'Mengucapkan apresiasi setelah dibantu seseorang:',
            'Expressing gratitude after receiving help:'
          ),
          makeSign(
            'kata',
            'unit-2',
            'Sama-sama',
            'Sama-sama',
            'You’re Welcome',
            'Peragakan isyarat tangan balasan "Sama-sama" di depan dada dengan hangat.',
            'Perform the BISINDO "You’re welcome" hand sign warmly in front of your chest.',
            'Membalas ucapan terima kasih dari teman:',
            'Replying to a friend who just thanked you:'
          ),
          makeSign(
            'kata',
            'unit-2',
            'Apa',
            'Apa',
            'What',
            'Buka telapak tangan atau gerakkan jari tanya setinggi dada dengan ekspresi bertanya.',
            'Hold your hand out at chest height in the BISINDO questioning gesture for "What".',
            'Saat ingin tahu benda atau hal yang sedang dibahas:',
            'When asking what something is:'
          ),
        ],
      },
      {
        id: '2.2',
        title: { id: 'Konfirmasi Betul & Salah', en: 'Correct & Wrong' },
        signs: [
          makeSign(
            'kata',
            'unit-2',
            'Betul',
            'Betul',
            'Correct / True',
            'Acungkan ibu jari ke atas (jempol) dengan empat jari lain mengepal rapat di depan dada.',
            'Give a clear thumbs-up gesture with the other four fingers curled in front of your chest.',
            'Membenarkan jawaban yang tepat:',
            'Confirming that an answer is right:'
          ),
          makeSign(
            'kata',
            'unit-2',
            'Salah',
            'Salah',
            'Wrong / Incorrect',
            'Bentuk huruf Y atau silangkan/goyangkan jari di depan dada yang menandakan "Salah".',
            'Show the BISINDO gesture for "Wrong / Mistake" clearly in front of your chest.',
            'Memberi tahu bahwa pilihan tersebut keliru:',
            'Indicating that a choice is incorrect:'
          ),
        ],
      },
      {
        id: '2.3',
        title: { id: 'Kalimat Sopan & Konfirmasi', en: 'Courtesy & Confirm Sentences' },
        signs: [],
        sentences: [
          {
            id: 'u2-s1',
            signs: ['Terima Kasih', 'Sahabat'],
            meaningId: 'Terima kasih, sahabat.',
            meaningEn: 'Thank you, close friend.',
            hintId: 'Ucapkan Terima Kasih terlebih dahulu, lalu sambung dengan isyarat Sahabat.',
            hintEn: 'Sign Terima Kasih first, then follow with Sahabat.',
          },
          {
            id: 'u2-s2',
            signs: ['Kamu', 'Betul'],
            meaningId: 'Kamu betul.',
            meaningEn: 'You are right.',
            hintId: 'Tunjuk lawan bicara (Kamu), lalu acungkan jempol (Betul).',
            hintEn: 'Point forward (Kamu), then show thumbs up (Betul).',
          },
          {
            id: 'u2-s3',
            signs: ['Saya', 'Salah'],
            meaningId: 'Saya salah.',
            meaningEn: 'I was wrong.',
            hintId: 'Tunjuk dada sendiri (Saya), dilanjutkan isyarat Salah.',
            hintEn: 'Point to your chest (Saya), followed by Salah.',
          },
          {
            id: 'u2-s4',
            signs: ['Kamu', 'Apa'],
            meaningId: 'Apa kabar kamu / ada apa denganmu?',
            meaningEn: 'What about you?',
            hintId: 'Gabungkan Kamu diikuti isyarat tanya Apa.',
            hintEn: 'Combine Kamu followed by the question sign Apa.',
          },
          {
            id: 'u2-s5',
            signs: ['Terima Kasih', 'Sama-sama'],
            meaningId: 'Terima kasih, sama-sama.',
            meaningEn: 'Thank you, you’re welcome.',
            hintId: 'Latih alur sapaan sopan: Terima Kasih lalu Sama-sama.',
            hintEn: 'Practice the polite exchange: Terima Kasih then Sama-sama.',
          },
        ],
      },
      {
        id: '2.4',
        title: { id: 'Ujian Unit Sopan Santun', en: 'Courtesy Unit Review' },
        isUnitReview: true,
        signs: [],
      },
    ],
  },
  {
    id: 'unit-3',
    modelCategory: 'kata',
    theme: 'gold',
    title: {
      id: 'Unit 3: Arah & Lokasi',
      en: 'Unit 3: Directions & Location',
    },
    description: {
      id: 'Tanyakan letak dan rangkai petunjuk arah kiri, kanan, atas, dan bawah',
      en: 'Ask where things are and chain left, right, up, and down direction signs',
    },
    levels: [
      {
        id: '3.1',
        title: { id: 'Mana, Kiri & Kanan', en: 'Where, Left & Right' },
        signs: [
          makeSign(
            'kata',
            'unit-3',
            'Mana',
            'Mana',
            'Where / Which',
            'Buka kedua atau satu telapak tangan menghadap ke atas sambil digoyangkan sedikit menanyakan lokasi/pilihan.',
            'Hold your open palm(s) up at chest height in the questioning gesture for "Where / Which".',
            'Menanyakan letak suatu tempat atau posisi seseorang:',
            'Asking where a person or place is located:'
          ),
          makeSign(
            'kata',
            'unit-3',
            'Kiri',
            'Kiri',
            'Left',
            'Arahkan jari telunjuk atau tangan menunjuk jelas ke arah samping kiri tubuh.',
            'Point your index finger or hand clearly toward your left side.',
            'Memberi petunjuk belok ke arah kiri:',
            'Giving directions to go left:'
          ),
          makeSign(
            'kata',
            'unit-3',
            'Kanan',
            'Kanan',
            'Right',
            'Arahkan jari telunjuk atau tangan menunjuk jelas ke arah samping kanan tubuh.',
            'Point your index finger or hand clearly toward your right side.',
            'Memberi petunjuk arah ke sebelah kanan:',
            'Directing someone toward the right side:'
          ),
        ],
      },
      {
        id: '3.2',
        title: { id: 'Posisi Atas & Bawah', en: 'Up & Down Positions' },
        signs: [
          makeSign(
            'kata',
            'unit-3',
            'Atas',
            'Atas',
            'Up / Above',
            'Acungkan jari telunjuk lurus menunjuk ke arah atas setinggi kepala/bahu.',
            'Point your index finger straight upward at head or shoulder level.',
            'Menunjuk lantai atas atau benda di posisi tinggi:',
            'Pointing upward to an upper floor or high shelf:'
          ),
          makeSign(
            'kata',
            'unit-3',
            'Bawah',
            'Bawah',
            'Down / Below',
            'Arahkan jari telunjuk menunjuk lurus ke arah bawah di depan dada.',
            'Point your index finger straight downward in front of your chest.',
            'Menunjuk benda yang berada di bawah:',
            'Indicating something located down below:'
          ),
        ],
      },
      {
        id: '3.3',
        title: { id: 'Rangkai Petunjuk Arah', en: 'Chain Direction Sentences' },
        signs: [],
        sentences: [
          {
            id: 'u3-s1',
            signs: ['Kamu', 'Mana'],
            meaningId: 'Di mana kamu?',
            meaningEn: 'Where are you?',
            hintId: 'Tunjuk lawan bicara (Kamu), lalu tampilkan isyarat tanya Mana.',
            hintEn: 'Point forward (Kamu), then show the question sign Mana.',
          },
          {
            id: 'u3-s2',
            signs: ['Kamu', 'Kanan'],
            meaningId: 'Kamu ke kanan.',
            meaningEn: 'You go right.',
            hintId: 'Mulai dengan Kamu, lalu tunjuk arah kanan (Kanan).',
            hintEn: 'Start with Kamu, then point right (Kanan).',
          },
          {
            id: 'u3-s3',
            signs: ['Saya', 'Kiri'],
            meaningId: 'Saya ke kiri.',
            meaningEn: 'I go left.',
            hintId: 'Tunjuk dada sendiri (Saya), lalu tunjuk arah kiri (Kiri).',
            hintEn: 'Point to yourself (Saya), then point left (Kiri).',
          },
          {
            id: 'u3-s4',
            signs: ['Kiri', 'Atas'],
            meaningId: 'Kiri lalu atas.',
            meaningEn: 'Left, then up.',
            hintId: 'Gabungkan dua arah berurutan: Kiri → Atas.',
            hintEn: 'Chain two directions in order: Kiri → Atas.',
          },
          {
            id: 'u3-s5',
            signs: ['Kanan', 'Bawah'],
            meaningId: 'Kanan lalu bawah.',
            meaningEn: 'Right, then down.',
            hintId: 'Gabungkan dua arah berurutan: Kanan → Bawah.',
            hintEn: 'Chain two directions in order: Kanan → Bawah.',
          },
        ],
      },
      {
        id: '3.4',
        title: { id: 'Ujian Unit Arah & Lokasi', en: 'Directions Unit Review' },
        isUnitReview: true,
        signs: [],
      },
    ],
  },
  {
    id: 'unit-4',
    modelCategory: 'kata',
    theme: 'violet',
    title: {
      id: 'Unit 4: Aktivitas, Keinginan & Perasaan',
      en: 'Unit 4: Actions, Desires & Feelings',
    },
    description: {
      id: 'Rangkai kalimat tentang menulis, waktu, keinginan, cinta, kekuatan, dan hubungan',
      en: 'Chain sentences about writing, time, desires, love, strength, and connection',
    },
    levels: [
      {
        id: '4.1',
        title: { id: 'Ingin, Menulis & Lagi', en: 'Want, Write & Again' },
        signs: [
          makeSign(
            'kata',
            'unit-4',
            'Ingin',
            'Ingin',
            'Want / Wish',
            'Letakkan tangan di depan dada lalu tarik sedikit ke arah tubuh menandakan keinginan.',
            'Place your hand in front of your chest and draw it slightly inward expressing desire/wanting.',
            'Menyampaikan keinginan untuk terus belajar:',
            'Expressing a desire to learn something new:'
          ),
          makeSign(
            'kata',
            'unit-4',
            'Menulis',
            'Menulis',
            'Write',
            'Rapatkan ibu jari dan telunjuk tangan kanan seolah memegang pena yang menulis di atas telapak tangan kiri.',
            'Pinch your right thumb and index finger as if holding a pen writing across your flat left palm.',
            'Mencatat materi pelajaran di buku catatan:',
            'Taking notes during a study session:'
          ),
          makeSign(
            'kata',
            'unit-4',
            'Lagi',
            'Lagi',
            'Again / More',
            'Tekuk jari telunjuk dan jari tengah mengarah ke samping bawah setinggi wajah untuk menyatakan pengulangan.',
            'Point your index and middle fingers sideways/downward near face height to express repeating an action.',
            'Meminta pengulangan gerakan sekali lagi:',
            'Asking to repeat an action one more time:'
          ),
        ],
      },
      {
        id: '4.2',
        title: { id: 'Waktu, Cinta, Kuat & Hubungan', en: 'Time, Love, Strong & Bond' },
        signs: [
          makeSign(
            'kata',
            'unit-4',
            'Waktu',
            'Waktu',
            'Time',
            'Sentuhkan jari telunjuk kanan ke pergelangan tangan kiri seperti menunjuk jam tangan.',
            'Tap your right index finger on the back of your left wrist as if pointing to a wristwatch.',
            'Mengingatkan jadwal atau waktu pertemuan:',
            'Reminding someone of the time or schedule:'
          ),
          makeSign(
            'kata',
            'unit-4',
            'Cinta',
            'Cinta',
            'Love',
            'Silangkan kedua tangan di depan dada atau bentuk simbol kasih sayang di depan dada.',
            'Cross both hands over your heart/chest or form the BISINDO love gesture.',
            'Mengungkapkan rasa sayang kepada keluarga dan sahabat:',
            'Expressing affection for family and close friends:'
          ),
          makeSign(
            'kata',
            'unit-4',
            'Kuat',
            'Kuat',
            'Strong',
            'Kepalkan tangan dengan tegas dan angkat lengan setinggi bahu menunjukkan kekuatan.',
            'Clench your fist firmly and raise your arm near shoulder height showing strength.',
            'Memberi semangat agar tetap tangguh dan kuat:',
            'Encouraging someone to stay strong:'
          ),
          makeSign(
            'kata',
            'unit-4',
            'Hubungan',
            'Hubungan',
            'Connection / Relation',
            'Tautkan lingkaran ibu jari dan telunjuk kedua tangan saling mengait di depan dada.',
            'Interlock the thumb-and-index rings of both hands together in front of your chest.',
            'Menjelaskan keterkaitan atau hubungan persahabatan:',
            'Describing a connection or relationship:'
          ),
        ],
      },
      {
        id: '4.3',
        title: { id: 'Rangkai Kalimat Ekspresif', en: 'Build Expressive Sentences' },
        signs: [],
        sentences: [
          {
            id: 'u4-s1',
            signs: ['Saya', 'Ingin', 'Menulis'],
            meaningId: 'Saya ingin menulis.',
            meaningEn: 'I want to write.',
            hintId: 'Rangkai berurutan: Saya → Ingin → Menulis.',
            hintEn: 'Chain in sequence: Saya → Ingin → Menulis.',
          },
          {
            id: 'u4-s2',
            signs: ['Menulis', 'Lagi'],
            meaningId: 'Menulis lagi.',
            meaningEn: 'Write again.',
            hintId: 'Peragakan isyarat Menulis, lalu lanjutkan dengan Lagi.',
            hintEn: 'Perform Menulis first, then follow with Lagi.',
          },
          {
            id: 'u4-s3',
            signs: ['Saya', 'Cinta', 'Sahabat'],
            meaningId: 'Saya cinta sahabat.',
            meaningEn: 'I love my close friend.',
            hintId: 'Rangkai tiga isyarat: Saya → Cinta → Sahabat.',
            hintEn: 'Chain three signs: Saya → Cinta → Sahabat.',
          },
          {
            id: 'u4-s4',
            signs: ['Kamu', 'Kuat'],
            meaningId: 'Kamu kuat.',
            meaningEn: 'You are strong.',
            hintId: 'Tunjuk ke depan (Kamu), lalu kepalkan lengan semangat (Kuat).',
            hintEn: 'Point forward (Kamu), then raise a strong fist (Kuat).',
          },
          {
            id: 'u4-s5',
            signs: ['Hubungan', 'Sahabat', 'Kuat'],
            meaningId: 'Hubungan sahabat yang kuat.',
            meaningEn: 'A strong friendship bond.',
            hintId: 'Rangkai tiga isyarat: Hubungan → Sahabat → Kuat.',
            hintEn: 'Chain three signs: Hubungan → Sahabat → Kuat.',
          },
          {
            id: 'u4-s6',
            signs: ['Ingin', 'Waktu', 'Lagi'],
            meaningId: 'Ingin waktu lagi.',
            meaningEn: 'Want more time.',
            hintId: 'Rangkai tiga isyarat: Ingin → Waktu → Lagi.',
            hintEn: 'Chain three signs: Ingin → Waktu → Lagi.',
          },
        ],
      },
      {
        id: '4.4',
        title: { id: 'Ujian Akhir Kata & Kalimat', en: 'Actions & Feelings Review' },
        isUnitReview: true,
        signs: [],
      },
    ],
  },
];

export const ABJAD_SIGNS: SignData[] = [
  makeSign('abjad', 'characters-abjad', 'A', 'Huruf A', 'Letter A', 'Pertemukan ujung jari kedua tangan membentuk segitiga puncak huruf A dengan kedua ibu jari menyatu mendatar di bawah.', 'Join fingertips of both hands to form an A-frame triangle with thumbs meeting horizontally at the base.', 'Mengeja huruf pertama nama atau kata yang diawali A:', 'Fingerspelling the first letter A:'),
  makeSign('abjad', 'characters-abjad', 'B', 'Huruf B', 'Letter B', 'Tegakkan jari tangan kiri sebagai garis vertikal dan tempelkan lengkungan jari tangan kanan membentuk perut huruf B.', 'Hold one hand upright as the stem while curving the other hand against it to form the loops of B.', 'Mengeja huruf B dalam kata BISINDO:', 'Fingerspelling the letter B:'),
  makeSign('abjad', 'characters-abjad', 'C', 'Huruf C', 'Letter C', 'Lengkungkan ibu jari dan keempat jari satu tangan membentuk busur terbuka menyerupai huruf C.', 'Curve your thumb and fingers of one hand into a clear open C arc.', 'Mengeja huruf C di depan kamera:', 'Showing the letter C to the camera:'),
  makeSign('abjad', 'characters-abjad', 'D', 'Huruf D', 'Letter D', 'Pertemukan ujung ibu jari dan jari membentuk lingkaran dengan jari lain terangkat membentuk siluet huruf D.', 'Touch thumb and fingertip to form a loop with upright fingers shaping the letter D.', 'Mengeja huruf D pada nama atau kata:', 'Fingerspelling the letter D:'),
  makeSign('abjad', 'characters-abjad', 'E', 'Huruf E', 'Letter E', 'Rentangkan tiga jari mendatar (telunjuk, tengah, manis) ke samping membentuk tiga garis horizontal huruf E.', 'Extend three fingers horizontally sideways forming the three bars of the letter E.', 'Mengeja huruf vokal E:', 'Fingerspelling the vowel E:'),
  makeSign('abjad', 'characters-abjad', 'F', 'Huruf F', 'Letter F', 'Tampilkan dua jari mendatar dengan penanda vertikal membentuk kepala huruf F di depan kamera.', 'Form the two horizontal upper bars of the letter F clearly at chest/face height.', 'Mengeja huruf F dalam ejaan jari:', 'Fingerspelling the letter F:'),
  makeSign('abjad', 'characters-abjad', 'G', 'Huruf G', 'Letter G', 'Bentuk lengkungan huruf G menggunakan perpaduan kepalan/lengkungan tangan sesuai abjad BISINDO.', 'Shape the curved contour of the letter G in front of your chest.', 'Mengeja huruf G pada nama tempat:', 'Fingerspelling the letter G:'),
  makeSign('abjad', 'characters-abjad', 'H', 'Huruf H', 'Letter H', 'Silangkan/tempelkan jari mendatar di antara tiang jari tegak membentuk palang huruf H.', 'Place horizontal finger(s) across upright finger posts to form the crossbar of H.', 'Mengeja huruf H dalam kata:', 'Fingerspelling the letter H:'),
  makeSign('abjad', 'characters-abjad', 'I', 'Huruf I', 'Letter I', 'Tegakkan satu jari kelingking (atau telunjuk) lurus ke atas sementara jari lainnya mengepal.', 'Raise your pinky (or single upright finger) straight up with remaining fingers curled.', 'Mengeja huruf vokal I:', 'Fingerspelling the vowel I:'),
  makeSign('abjad', 'characters-abjad', 'J', 'Huruf J', 'Letter J', 'Tegakkan jari kelingking lalu ayunkan membentuk lengkungan kail huruf J di udara.', 'Raise your pinky and trace a subtle J-hook curve in front of your chest.', 'Mengeja huruf J pada awal kata:', 'Fingerspelling the letter J:'),
  makeSign('abjad', 'characters-abjad', 'K', 'Huruf K', 'Letter K', 'Tegakkan jari telunjuk kiri lurus dan tempelkan dua jari kanan menyudut membentuk cabang huruf K.', 'Hold one index finger upright and angle two fingers of the other hand against it to form K.', 'Mengeja huruf K dalam percakapan:', 'Fingerspelling the letter K:'),
  makeSign('abjad', 'characters-abjad', 'L', 'Huruf L', 'Letter L', 'Rentangkan ibu jari ke samping dan jari telunjuk lurus ke atas membentuk sudut siku-siku huruf L.', 'Extend your thumb sideways and index finger straight up in a crisp 90-degree L shape.', 'Mengeja huruf L dengan satu tangan:', 'Fingerspelling the letter L:'),
  makeSign('abjad', 'characters-abjad', 'M', 'Huruf M', 'Letter M', 'Rapatkan tiga jari mengarah ke atas/bawah di atas telapak tangan penyangga membentuk tiga kaki huruf M.', 'Display three parallel fingers forming the three ridges of the letter M.', 'Mengeja huruf M pada nama:', 'Fingerspelling the letter M:'),
  makeSign('abjad', 'characters-abjad', 'N', 'Huruf N', 'Letter N', 'Tampilkan dua jari sejajar di atas tumpuan tangan membentuk dua kaki huruf N.', 'Display two parallel fingers forming the two ridges of the letter N.', 'Mengeja huruf N dalam kata:', 'Fingerspelling the letter N:'),
  makeSign('abjad', 'characters-abjad', 'O', 'Huruf O', 'Letter O', 'Pertemukan ujung jari telunjuk dan ibu jari membentuk lingkaran bulat huruf O.', 'Curve your fingers and thumb together so their tips meet in a round O circle.', 'Mengeja huruf vokal O:', 'Fingerspelling the vowel O:'),
  makeSign('abjad', 'characters-abjad', 'P', 'Huruf P', 'Letter P', 'Tegakkan jari kiri sebagai tiang dan tempelkan lengkungan jari kanan di bagian atas membentuk kepala huruf P.', 'Hold one finger upright as a stem and curve the other hand’s fingers at the top to form P.', 'Mengeja huruf P dengan dua tangan:', 'Fingerspelling the letter P:'),
  makeSign('abjad', 'characters-abjad', 'Q', 'Huruf Q', 'Letter Q', 'Bentuk lingkaran jari seperti huruf O lalu tambahkan jari penunjuk menyilang di bawahnya membentuk ekor huruf Q.', 'Form a circle with one hand and place an angled finger across the bottom corner for Q.', 'Mengeja huruf Q secara jelas:', 'Fingerspelling the letter Q:'),
  makeSign('abjad', 'characters-abjad', 'R', 'Huruf R', 'Letter R', 'Bentuk konfigurasi jari huruf R di depan wajah/dada dengan posisi jari jelas menghadap kamera.', 'Form the BISINDO letter R finger configuration clearly at chest or face height.', 'Mengeja huruf R pada nama:', 'Fingerspelling the letter R:'),
  makeSign('abjad', 'characters-abjad', 'S', 'Huruf S', 'Letter S', 'Kaitkan lengkungan jari kedua tangan secara berlawanan membentuk lekukan huruf S.', 'Curve both hands in opposite C-arcs stacked/hooked together to trace an S shape.', 'Mengeja huruf S dalam kata:', 'Fingerspelling the letter S:'),
  makeSign('abjad', 'characters-abjad', 'T', 'Huruf T', 'Letter T', 'Tegakkan jari telunjuk satu tangan dan letakkan jari telunjuk tangan lainnya melintang rata di puncaknya membentuk huruf T.', 'Hold one index finger vertically and rest the other index finger horizontally across its tip to form T.', 'Mengeja huruf T dengan dua jari:', 'Fingerspelling the letter T:'),
  makeSign('abjad', 'characters-abjad', 'U', 'Huruf U', 'Letter U', 'Acungkan dua jari/lengkungan ke atas membentuk cekungan huruf U menghadap kamera.', 'Raise your fingers upward forming a clear U curve facing the camera.', 'Mengeja huruf vokal U:', 'Fingerspelling the vowel U:'),
  makeSign('abjad', 'characters-abjad', 'V', 'Huruf V', 'Letter V', 'Acungkan jari telunjuk dan jari tengah terbuka membentuk sudut huruf V.', 'Extend your index and middle fingers apart in a clear V shape.', 'Mengeja huruf V di depan kamera:', 'Fingerspelling the letter V:'),
  makeSign('abjad', 'characters-abjad', 'W', 'Huruf W', 'Letter W', 'Pertemukan kedua tangan dengan ibu jari/telunjuk membentuk dua lembah tajam menyerupai huruf W.', 'Bring both hands together at chest level with angled fingers forming a wide W silhouette.', 'Mengeja huruf W dengan dua tangan:', 'Fingerspelling the letter W:'),
  makeSign('abjad', 'characters-abjad', 'X', 'Huruf X', 'Letter X', 'Silangkan kedua jari telunjuk di depan wajah/dada membentuk tanda silang huruf X.', 'Cross both index fingers perpendicularly in front of your face/chest to form an X.', 'Mengeja huruf X dengan menyilangkan telunjuk:', 'Fingerspelling the letter X:'),
  makeSign('abjad', 'characters-abjad', 'Y', 'Huruf Y', 'Letter Y', 'Bentuk cabang huruf Y menggunakan perpaduan jari telunjuk/tangan menyudut di atas satu tiang jari bawah.', 'Join one hand’s V-branch atop the other hand’s stem to form a full Y shape.', 'Mengeja huruf Y dengan dua tangan:', 'Fingerspelling the letter Y:'),
  makeSign('abjad', 'characters-abjad', 'Z', 'Huruf Z', 'Letter Z', 'Tekuk sudut lengan/tangan atau gariskan pola zig-zag membentuk sudut huruf Z di depan dada.', 'Angle your hands/fingers to outline the sharp diagonal corners of the letter Z.', 'Mengeja huruf terakhir Z:', 'Fingerspelling the final letter Z:'),
];

export const ANGKA_SIGNS: SignData[] = [
  makeSign('angka', 'characters-angka', 'Nol', 'Nol (0)', 'Zero (0)', 'Pertemukan ujung jari tangan dengan ibu jari membentuk lingkaran penuh menyerupai angka 0 di depan dada atau wajah.', 'Touch your fingertips to your thumb tip forming a clear round zero (0) ring in front of your chest or face.', 'Saat menyebutkan angka nol atau skor awal:', 'When signing zero or a starting score:'),
  makeSign('angka', 'characters-angka', 'Satu', 'Satu (1)', 'One (1)', 'Tegakkan jari telunjuk lurus ke atas sementara keempat jari lainnya mengepal rapat menghadap kamera (dekat dada/wajah).', 'Raise your index finger straight up while keeping the remaining fingers curled into your palm facing the camera.', 'Memesan satu porsi makanan atau menunjuk urutan pertama:', 'Ordering one item or indicating first place:'),
  makeSign('angka', 'characters-angka', 'Dua', 'Dua (2)', 'Two (2)', 'Acungkan jari telunjuk dan jari tengah membentuk huruf V menghadap ke kamera di depan dada, tiga jari lain ditekuk.', 'Extend your index and middle fingers in a V shape facing the camera in front of your chest, with other fingers folded.', 'Menunjukkan jumlah dua buah atau dua orang:', 'Indicating a quantity of two items or people:'),
  makeSign('angka', 'characters-angka', 'Tiga', 'Tiga (3)', 'Three (3)', 'Tegakkan tiga jari tengah (telunjuk, tengah, manis) lurus ke atas sementara ibu jari dan kelingking ditekuk di depan dada.', 'Extend three fingers (index, middle, ring) straight upward in front of your chest while folding thumb and pinky.', 'Menghitung langkah ketiga dalam latihan:', 'Counting the third step in an exercise:'),
  makeSign('angka', 'characters-angka', 'Empat', 'Empat (4)', 'Four (4)', 'Rentangkan empat jari (telunjuk hingga kelingking) lurus ke atas dengan ibu jari dilipat ke dalam telapak tangan.', 'Extend all four fingers (index through pinky) straight up with your thumb folded across your palm.', 'Menyebutkan empat kursi atau pukul empat sore:', 'Signing four chairs or four o’clock:'),
  makeSign('angka', 'characters-angka', 'Lima', 'Lima (5)', 'Five (5)', 'Buka kelima jari satu tangan lebar-lebar menghadap lurus ke arah kamera di depan dada.', 'Spread all five fingers of one hand wide open facing directly toward the camera in front of your chest.', 'Menunjukkan angka lima atau lima menit waktu istirahat:', 'Showing the number five or a five-minute break:'),
  makeSign('angka', 'characters-angka', 'Enam', 'Enam (6)', 'Six (6)', 'Gunakan dua tangan di depan dada: buka kelima jari satu tangan (5) dan acungkan ibu jari tangan lainnya (1) berdampingan.', 'Use both hands at chest level: open all 5 fingers on one hand and raise the thumb (1) on the other hand side by side.', 'Menunjukkan angka enam (5 + 1) dalam hitungan:', 'Indicating the number six (5 + 1) while counting:'),
  makeSign('angka', 'characters-angka', 'Tujuh', 'Tujuh (7)', 'Seven (7)', 'Gunakan dua tangan di depan dada: buka 5 jari satu tangan dan acungkan 2 jari (ibu jari + telunjuk) pada tangan sebelahnya.', 'Use both hands at chest level: show 5 open fingers on one hand and 2 fingers (thumb + index) on the other hand.', 'Menyebutkan tujuh hari dalam satu minggu:', 'Referring to the seven days in a week:'),
  makeSign('angka', 'characters-angka', 'Delapan', 'Delapan (8)', 'Eight (8)', 'Gunakan dua tangan di depan dada: buka 5 jari satu tangan dan acungkan 3 jari (ibu jari, telunjuk, tengah) pada tangan sebelahnya.', 'Use both hands at chest level: show 5 open fingers on one hand and 3 fingers on the other hand side by side.', 'Menunjukkan pukul delapan pagi saat mulai belajar:', 'Indicating eight o’clock in the morning:'),
  makeSign('angka', 'characters-angka', 'Sembilan', 'Sembilan (9)', 'Nine (9)', 'Gunakan dua tangan di depan dada: buka 5 jari pada satu tangan dan rentangkan 4 jari (tanpa ibu jari) pada tangan sebelahnya.', 'Use both hands at chest level: show 5 open fingers on one hand and 4 extended fingers on the other hand.', 'Menghitung angka sembilan sebelum mencapai sepuluh:', 'Counting nine right before reaching ten:'),
  makeSign('angka', 'characters-angka', 'Sepuluh', 'Sepuluh (10)', 'Ten (10)', 'Angkat kedua telapak tangan terbuka berdampingan di depan dada dengan kesepuluh jari direntangkan menghadap kamera.', 'Raise both open palms side by side in front of your chest with all ten fingers spread facing the camera.', 'Memberikan nilai sempurna sepuluh dari sepuluh:', 'Giving a perfect score of ten out of ten:'),
];

export const LEARN_SIGNS: SignData[] = CURRICULUM.flatMap(unit =>
  unit.levels.flatMap(lvl => lvl.signs)
);

// All 60 flattened signs (23 Kata + 26 Abjad + 11 Angka)
export const ALL_SIGNS: SignData[] = [
  ...LEARN_SIGNS,
  ...ABJAD_SIGNS,
  ...ANGKA_SIGNS,
];

export function getSignByClass(roboflowClass: string): SignData | undefined {
  const normalized = roboflowClass.trim().toLowerCase();
  return ALL_SIGNS.find(s => s.roboflowClass.trim().toLowerCase() === normalized);
}

export function getCharacterSigns(category: 'abjad' | 'angka'): SignData[] {
  return category === 'abjad' ? ABJAD_SIGNS : ANGKA_SIGNS;
}

export function getUnitSigns(unitId: string): SignData[] {
  const unit = CURRICULUM.find(u => u.id === unitId);
  if (!unit) return [];
  return unit.levels.flatMap(lvl => lvl.signs);
}

export function getUnitSentences(unitId: string): SentenceData[] {
  const unit = CURRICULUM.find(u => u.id === unitId);
  if (!unit) return [];
  return unit.levels.flatMap(lvl => lvl.sentences ?? []);
}

export function getSignsUpToUnit(unitId: string): SignData[] {
  const collected: SignData[] = [];
  for (const unit of CURRICULUM) {
    collected.push(...getUnitSigns(unit.id));
    if (unit.id === unitId) break;
  }
  return collected.length > 0 ? collected : LEARN_SIGNS;
}

export function getLevelById(levelId: string): { level: LevelData; unit: UnitData } | null {
  for (const unit of CURRICULUM) {
    for (const level of unit.levels) {
      if (level.id === levelId) {
        return { level, unit };
      }
    }
  }
  return null;
}

export function formatSignLabel(sign: SignData, language: 'id' | 'en'): string {
  if (language === 'en') {
    if (sign.wordId === sign.wordEn) return sign.wordId;
    return `${sign.wordId} (${sign.wordEn})`;
  }
  return sign.wordId;
}

function generateOptions(
  correctSign: SignData,
  pool: SignData[]
): { options: string[]; correctIndex: number } {
  const distractors = pool
    .filter(s => s.wordId !== correctSign.wordId)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  const combined = [correctSign, ...distractors].sort(() => 0.5 - Math.random());
  const correctIndex = combined.findIndex(s => s.wordId === correctSign.wordId);
  return {
    options: combined.map(s => s.wordId),
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
  };
}

function resolveSentenceSigns(sentence: SentenceData): SignData[] {
  return sentence.signs
    .map(label => getSignByClass(label))
    .filter((s): s is SignData => Boolean(s));
}

function createSentenceSteps(
  levelId: string,
  sentence: SentenceData,
  distractorPool: string[]
): ExerciseStep[] {
  const sentenceSigns = resolveSentenceSigns(sentence);
  if (sentenceSigns.length === 0) return [];

  const primarySign = sentenceSigns[0];
  const wordBankOptions = buildWordBankOptions(sentence.signs, distractorPool);

  return [
    {
      id: `${levelId}-${sentence.id}-word-bank`,
      type: 'word-bank',
      sign: primarySign,
      sentence,
      sentenceSigns,
      wordBankOptions,
      questionId: `Susun isyarat untuk: "${sentence.meaningId}"`,
      questionEn: `Arrange the signs for: "${sentence.meaningEn}"`,
    },
    {
      id: `${levelId}-${sentence.id}-chained-camera`,
      type: 'chained-camera',
      sign: primarySign,
      sentence,
      sentenceSigns,
      questionId: `Peragakan kalimat berurutan: "${sentence.meaningId}"`,
      questionEn: `Perform the sentence in order: "${sentence.meaningEn}"`,
    },
  ];
}

export function generateExerciseSteps(level: LevelData, unit: UnitData): ExerciseStep[] {
  const unitSigns = getUnitSigns(unit.id);
  const availableWordPool = getSignsUpToUnit(unit.id).map(s => s.roboflowClass);

  if (level.isUnitReview) {
    const steps: ExerciseStep[] = [];
    const shuffledSigns = [...unitSigns].sort(() => 0.5 - Math.random()).slice(0, 3);

    shuffledSigns.forEach((sign, idx) => {
      if (idx % 2 === 0) {
        const { options, correctIndex } = generateOptions(sign, unitSigns);
        steps.push({
          id: `${level.id}-review-quiz-${sign.roboflowClass}`,
          type: 'quiz',
          sign,
          questionId: sign.scenarioId || `Isyarat manakah yang memiliki gerakan: "${sign.hintId}"?`,
          questionEn: sign.scenarioEn || `Which sign corresponds to the gesture: "${sign.hintEn}"?`,
          options,
          correctOptionIndex: correctIndex,
        });
      }
      steps.push({
        id: `${level.id}-review-camera-${sign.roboflowClass}`,
        type: 'camera',
        sign,
      });
    });

    const unitSentences = getUnitSentences(unit.id);
    const selectedSentences = [...unitSentences].sort(() => 0.5 - Math.random()).slice(0, 2);
    for (const sentence of selectedSentences) {
      steps.push(...createSentenceSteps(level.id, sentence, availableWordPool));
    }

    return steps;
  }

  const steps: ExerciseStep[] = [];
  const quizPool = unitSigns.length >= 4 ? unitSigns : LEARN_SIGNS;

  for (const sign of level.signs) {
    steps.push({
      id: `${level.id}-${sign.roboflowClass}-study`,
      type: 'study',
      sign,
    });

    const { options, correctIndex } = generateOptions(sign, quizPool);
    steps.push({
      id: `${level.id}-${sign.roboflowClass}-quiz`,
      type: 'quiz',
      sign,
      questionId: sign.scenarioId || `Isyarat manakah yang memiliki gerakan: "${sign.hintId}"?`,
      questionEn: sign.scenarioEn || `Which sign corresponds to the gesture: "${sign.hintEn}"?`,
      options,
      correctOptionIndex: correctIndex,
    });

    steps.push({
      id: `${level.id}-${sign.roboflowClass}-camera`,
      type: 'camera',
      sign,
    });
  }

  for (const sentence of level.sentences ?? []) {
    steps.push(...createSentenceSteps(level.id, sentence, availableWordPool));
  }

  return steps;
}

export function generateCharacterPracticeSteps(
  category: 'abjad' | 'angka',
  focusSignClass?: string
): ExerciseStep[] {
  const categorySigns = getCharacterSigns(category);
  const normalizedFocus = focusSignClass?.trim().toLowerCase();

  let targetSigns: SignData[];
  if (normalizedFocus) {
    const matched = categorySigns.find(
      s => s.roboflowClass.trim().toLowerCase() === normalizedFocus
    );
    targetSigns = matched
      ? [matched]
      : [...categorySigns].sort(() => 0.5 - Math.random()).slice(0, 3);
  } else {
    targetSigns = [...categorySigns].sort(() => 0.5 - Math.random()).slice(0, 3);
  }

  const steps: ExerciseStep[] = [];
  for (const sign of targetSigns) {
    steps.push({
      id: `char-${category}-${sign.roboflowClass}-study`,
      type: 'study',
      sign,
    });

    const { options, correctIndex } = generateOptions(sign, categorySigns);
    steps.push({
      id: `char-${category}-${sign.roboflowClass}-quiz`,
      type: 'quiz',
      sign,
      questionId: sign.scenarioId || `Isyarat manakah yang memiliki gerakan: "${sign.hintId}"?`,
      questionEn: sign.scenarioEn || `Which sign corresponds to the gesture: "${sign.hintEn}"?`,
      options,
      correctOptionIndex: correctIndex,
    });

    steps.push({
      id: `char-${category}-${sign.roboflowClass}-camera`,
      type: 'camera',
      sign,
    });
  }

  return steps;
}
