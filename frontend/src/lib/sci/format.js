const MINUS = '−';
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };

/** Angka bertanda dengan minus tipografis: -4 → "−4". */
export const fmtSigned = (n) => (n < 0 ? `${MINUS}${Math.abs(n)}` : String(n));

/** "10⁻⁴" */
export const powText = (n) => `10${String(n).split('').map((c) => SUP[c] ?? c).join('')}`;

/** "3,2 × 10⁻⁴" */
export const sciText = (a, n) => `${String(a).replace('-', MINUS)} × ${powText(n)}`;

/** Bacaan untuk pembaca layar. */
export const sciSpeech = (a, n) => `${a} kali 10 pangkat ${n < 0 ? 'negatif ' : ''}${Math.abs(n)}`;
