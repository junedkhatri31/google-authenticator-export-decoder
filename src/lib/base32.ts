// RFC 3548 base32 encoder adapted from reference/edbase32.js
// Original license: MIT (Kahiro Koo), modifications by Kristian Rekstad.

const alphabet = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
  'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
  'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
  'Y', 'Z', '2', '3', '4', '5', '6', '7',
];

/**
 * Encode arbitrary bytes to RFC 3548 base32.
 */
export function encodeBase32(input: Uint8Array | null | undefined): string | null {
  if (input == null) {
    return null;
  }

  if (input.length === 0) {
    return '';
  }

  let bits = '';
  for (const byte of input) {
    bits += byte.toString(2).padStart(8, '0');
  }

  const chars: string[] = [];
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5);
    const paddedChunk = chunk.padEnd(5, '0');
    const index = parseInt(paddedChunk, 2);
    chars.push(alphabet[index]);
  }

  while (chars.length % 8 !== 0) {
    chars.push('=');
  }

  return chars.join('');
}
