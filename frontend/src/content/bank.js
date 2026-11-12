/**
 * Bank soal per modul & level (docs/CONTENT-GUIDE.md).
 * Kunci jawaban dihitung oleh lib/sci (answerKey), kecuali pilihan ganda.
 * Pengecoh pilihan ganda mewakili satu miskonsepsi (errorCode).
 */

const sci = (value) => ({ type: 'to_scientific', value });
const pow = (value) => ({ type: 'power_of_ten', value });
const ten = (n) => ({ type: 'ten_to_standard', n });
const std = (a, n) => ({ type: 'to_standard', a, n });
// Modul 4 & 5: petunjuk & pembahasan khusus (lib/sci/steps.js) lewat `focus`.
const zero = (value) => ({ type: 'to_scientific', value, focus: 'zero' });
const back = (a, n) => ({ type: 'to_standard', a, n, focus: 'back' });

export const BANK = {
  m1: {
    levels: {
      1: [ten(2), ten(3), ten(4), ten(5), pow('100'), pow('1.000'), pow('10.000')],
      2: [pow('0,1'), pow('0,01'), pow('0,001'), ten(-1), ten(-2), ten(-3)],
      3: [
        pow('1.000.000'),
        pow('0,00001'),
        pow('10.000.000'),
        ten(-4),
        ten(7),
        {
          type: 'choose_correct',
          text: '10⁻³ sama dengan …',
          options: [
            { key: 'a', text: '1.000', errorCode: 'E-TANDA' },
            { key: 'b', text: '0,001' },
            { key: 'c', text: '0,0001', errorCode: 'E-PANGKAT' },
            { key: 'd', text: '−1.000', errorCode: 'E-LAIN' },
          ],
          answer: 'b',
        },
      ],
      4: [
        pow('100.000.000'),
        pow('0,0000001'),
        pow('0,000001'),
        ten(-6),
        ten(9),
        {
          type: 'choose_correct',
          text: 'Manakah yang sama dengan 0,0001?',
          options: [
            { key: 'a', text: '10⁴', errorCode: 'E-TANDA' },
            { key: 'b', text: '10⁻³', errorCode: 'E-PANGKAT' },
            { key: 'c', text: '10⁻⁴' },
            { key: 'd', text: '10⁻⁵', errorCode: 'E-PANGKAT' },
          ],
          answer: 'c',
        },
      ],
    },
    quiz: [ten(5), pow('0,01'), ten(-3), pow('1.000.000'), pow('0,00001')],
  },
  m2: {
    levels: {
      1: [sci('3.000'), sci('50.000'), sci('700'), sci('9.000.000'), sci('20'), sci('400.000')],
      2: [sci('4.500.000'), sci('36.000'), sci('120.000'), sci('8.100'), sci('650.000'), sci('92.000.000')],
      3: [
        sci('135.000.000'),
        sci('2.750.000'),
        sci('48.200.000'),
        sci('9.990'),
        sci('1.234.000'),
        {
          type: 'choose_correct',
          text: 'Bentuk baku dari 135.000.000 adalah …',
          options: [
            { key: 'a', text: '13,5 × 10⁷', errorCode: 'E-KOMA' },
            { key: 'b', text: '1,35 × 10⁸' },
            { key: 'c', text: '1,35 × 10⁷', errorCode: 'E-PANGKAT' },
            { key: 'd', text: '135 × 10⁶', errorCode: 'E-KOMA' },
          ],
          answer: 'b',
        },
      ],
      4: [
        sci('2.500.000.000'),
        sci('300.000.000'),
        sci('149.600.000'),
        sci('7.800.000.000'),
        sci('56.700.000.000'),
        {
          type: 'choose_correct',
          text: 'Anggaran sekolah Rp2.500.000.000. Dalam bentuk baku, anggaran itu adalah …',
          options: [
            { key: 'a', text: 'Rp2,5 × 10⁸', errorCode: 'E-PANGKAT' },
            { key: 'b', text: 'Rp25 × 10⁸', errorCode: 'E-KOMA' },
            { key: 'c', text: 'Rp2,5 × 10⁹' },
            { key: 'd', text: 'Rp2,5 × 10⁻⁹', errorCode: 'E-TANDA' },
          ],
          answer: 'c',
        },
      ],
    },
    quiz: [
      sci('62.000'),
      sci('5.000.000'),
      sci('345.000.000'),
      sci('7.200'),
      {
        type: 'choose_correct',
        text: 'Bentuk baku dari 48.200.000 adalah …',
        options: [
          { key: 'a', text: '4,82 × 10⁷' },
          { key: 'b', text: '48,2 × 10⁶', errorCode: 'E-KOMA' },
          { key: 'c', text: '4,82 × 10⁶', errorCode: 'E-PANGKAT' },
          { key: 'd', text: '4,82 × 10⁻⁷', errorCode: 'E-TANDA' },
        ],
        answer: 'a',
      },
    ],
  },
  m3: {
    levels: {
      1: [sci('0,0007'), sci('0,003'), sci('0,05'), sci('0,0009'), sci('0,02'), sci('0,4')],
      2: [sci('0,0405'), sci('0,0012'), sci('0,00035'), sci('0,071'), sci('0,0048'), std('3', -2)],
      3: [
        sci('0,0000075'),
        sci('0,00032'),
        sci('0,000081'),
        sci('0,0000006'),
        sci('0,00125'),
        std('6,02', -3),
        {
          type: 'choose_correct',
          text: 'Bentuk baku dari 0,0000075 adalah …',
          options: [
            { key: 'a', text: '7,5 × 10⁶', errorCode: 'E-TANDA' },
            { key: 'b', text: '7,5 × 10⁻⁶' },
            { key: 'c', text: '7,5 × 10⁻⁷', errorCode: 'E-PANGKAT' },
            { key: 'd', text: '75 × 10⁻⁷', errorCode: 'E-KOMA' },
          ],
          answer: 'b',
        },
      ],
      4: [
        sci('0,00000075'),
        sci('0,000000042'),
        sci('0,0000003'),
        sci('0,0000000016'),
        std('9,5', -7),
        {
          type: 'choose_correct',
          text: 'Massa sebutir debu sekitar 0,00000075 kg. Dalam bentuk baku, massanya …',
          options: [
            { key: 'a', text: '7,5 × 10⁻⁷ kg' },
            { key: 'b', text: '7,5 × 10⁷ kg', errorCode: 'E-TANDA' },
            { key: 'c', text: '75 × 10⁻⁸ kg', errorCode: 'E-KOMA' },
            { key: 'd', text: '7,5 × 10⁻⁶ kg', errorCode: 'E-PANGKAT' },
          ],
          answer: 'a',
        },
      ],
    },
    quiz: [
      sci('0,0006'),
      sci('0,00045'),
      sci('0,000073'),
      std('2,4', -3),
      {
        type: 'choose_correct',
        text: 'Ukuran sebuah bakteri sekitar 0,000002 m. Bentuk bakunya …',
        options: [
          { key: 'a', text: '2 × 10⁶ m', errorCode: 'E-TANDA' },
          { key: 'b', text: '2 × 10⁻⁵ m', errorCode: 'E-PANGKAT' },
          { key: 'c', text: '2 × 10⁻⁶ m' },
          { key: 'd', text: '20 × 10⁻⁷ m', errorCode: 'E-KOMA' },
        ],
        answer: 'c',
      },
    ],
  },
  m4: {
    levels: {
      // L1: bilangan besar, satu nol tengah
      1: [zero('105'), zero('4.050'), zero('30.200'), zero('1.080'), zero('506'), zero('7.030.000')],
      // L2: bilangan kecil, satu nol tengah (ada nol depan)
      2: [zero('0,0105'), zero('0,302'), zero('0,00708'), zero('0,000901'), zero('0,0603'), zero('0,4009')],
      // L3: beberapa nol tengah, campuran besar & kecil
      3: [zero('3.004.000'), zero('70.080.000'), zero('0,000506'), zero('2.000.500'), zero('0,0010203'), zero('600.090.000')],
      // L4: bilangan sangat besar/kecil & soal konteks dengan pengecoh membuang nol
      4: [
        zero('1.002.000.000'),
        zero('0,00000304'),
        zero('40.700.000.000'),
        zero('0,0000060012'),
        {
          type: 'choose_correct',
          focus: 'zero',
          value: '3.004.000',
          text: 'Penduduk sebuah kota 3.004.000 jiwa. Dalam bentuk baku, jumlah itu …',
          options: [
            { key: 'a', text: '3,4 × 10⁶', errorCode: 'E-NOL' },
            { key: 'b', text: '3,004 × 10⁶' },
            { key: 'c', text: '3,004 × 10⁵', errorCode: 'E-PANGKAT' },
            { key: 'd', text: '30,04 × 10⁵', errorCode: 'E-KOMA' },
          ],
          answer: 'b',
        },
        {
          type: 'choose_correct',
          focus: 'zero',
          value: '0,000000105',
          text: 'Diameter sebuah virus sekitar 0,000000105 m. Dalam bentuk baku, diameternya …',
          options: [
            { key: 'a', text: '1,5 × 10⁻⁷ m', errorCode: 'E-NOL' },
            { key: 'b', text: '1,05 × 10⁷ m', errorCode: 'E-TANDA' },
            { key: 'c', text: '1,05 × 10⁻⁷ m' },
            { key: 'd', text: '10,5 × 10⁻⁸ m', errorCode: 'E-KOMA' },
          ],
          answer: 'c',
        },
      ],
    },
    quiz: [
      zero('8.006.000'),
      zero('0,000703'),
      zero('50.040'),
      zero('0,0020005'),
      {
        type: 'choose_correct',
        focus: 'zero',
        value: '90.060.000',
        text: 'Bentuk baku dari 90.060.000 adalah …',
        options: [
          { key: 'a', text: '9,6 × 10⁷', errorCode: 'E-NOL' },
          { key: 'b', text: '9,006 × 10⁷' },
          { key: 'c', text: '9,006 × 10⁶', errorCode: 'E-PANGKAT' },
          { key: 'd', text: '90,06 × 10⁶', errorCode: 'E-KOMA' },
        ],
        answer: 'b',
      },
    ],
  },
  m5: {
    levels: {
      // L1: pangkat positif, a sederhana
      1: [back('3', 2), back('1,2', 5), back('5', 4), back('4,5', 3), back('7', 6), back('2,4', 2)],
      // L2: pangkat negatif, a sederhana
      2: [back('3', -2), back('5', -4), back('2,5', -3), back('8', -1), back('1,6', -2), back('4,2', -5)],
      // L3: campuran, nol tengah, koma berhenti di tengah angka
      3: [
        back('6,02', -3),
        back('2,5', 8),
        back('3,456', 2),
        back('7,08', 5),
        back('1,005', -4),
        back('9,03', 7),
        {
          type: 'choose_correct',
          focus: 'back',
          a: '4,05',
          n: -3,
          text: 'Bentuk biasa dari 4,05 × 10⁻³ adalah …',
          options: [
            { key: 'a', text: '0,0405', errorCode: 'E-PANGKAT' },
            { key: 'b', text: '0,00405' },
            { key: 'c', text: '0,0045', errorCode: 'E-NOL' },
            { key: 'd', text: '4.050', errorCode: 'E-TANDA' },
          ],
          answer: 'b',
        },
      ],
      // L4: pangkat besar/kecil & soal konteks
      4: [
        back('9,0387', -9),
        back('1,5', 11),
        back('6,4', -7),
        back('3,0005', 6),
        {
          type: 'choose_correct',
          focus: 'back',
          a: '1,5',
          n: 8,
          text: 'Jarak Bumi ke Matahari sekitar 1,5 × 10⁸ km. Dalam bentuk biasa, jarak itu …',
          options: [
            { key: 'a', text: '15.000.000 km', errorCode: 'E-PANGKAT' },
            { key: 'b', text: '150.000.000 km' },
            { key: 'c', text: '1.500.000.000 km', errorCode: 'E-PANGKAT' },
            { key: 'd', text: '0,000000015 km', errorCode: 'E-TANDA' },
          ],
          answer: 'b',
        },
        {
          type: 'choose_correct',
          focus: 'back',
          a: '7,5',
          n: -6,
          text: 'Ukuran sel darah merah sekitar 7,5 × 10⁻⁶ m. Dalam bentuk biasa, ukurannya …',
          options: [
            { key: 'a', text: '0,0000075 m' },
            { key: 'b', text: '0,000075 m', errorCode: 'E-PANGKAT' },
            { key: 'c', text: '7.500.000 m', errorCode: 'E-TANDA' },
            { key: 'd', text: '0,00000075 m', errorCode: 'E-PANGKAT' },
          ],
          answer: 'a',
        },
      ],
    },
    quiz: [
      back('4', 3),
      back('2,7', 6),
      back('5', -3),
      back('3,08', -4),
      {
        type: 'choose_correct',
        focus: 'back',
        a: '6,1',
        n: 5,
        text: 'Bentuk biasa dari 6,1 × 10⁵ adalah …',
        options: [
          { key: 'a', text: '61.000', errorCode: 'E-PANGKAT' },
          { key: 'b', text: '610.000' },
          { key: 'c', text: '6.100.000', errorCode: 'E-PANGKAT' },
          { key: 'd', text: '0,000061', errorCode: 'E-TANDA' },
        ],
        answer: 'b',
      },
    ],
  },
};

export const LEVELS = [
  { level: 1, name: 'Pemula', desc: 'Angka sederhana, visual tersedia' },
  { level: 2, name: 'Berkembang', desc: '2–3 angka bermakna' },
  { level: 3, name: 'Cakap', desc: 'Lebih banyak nol & campuran' },
  { level: 4, name: 'Mahir', desc: 'Soal konteks & pengecoh' },
];

export const PER_SESSION = 5;
export const PASS_COUNT = 3;
