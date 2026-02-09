/**
 * Hex (hexadecimal) encoding/decoding module.
 * @module hex
 */

// TC39 Stage 4: Uint8Array hex methods (not yet in TS lib types)
declare global {
    interface Uint8Array {
        toHex(): string;
    }
    interface Uint8ArrayConstructor {
        fromHex(hex: string): Uint8Array<ArrayBuffer>;
    }
}

import { assertInputIsString, Lazy } from '../internal/mod.ts';
import { dataSourceToBytes } from './helpers.ts';
import type { DataSource } from './types.ts';

// #region Internal Variables

/**
 * Pre-computed byte-to-hex lookup table (256 entries).
 */
const encodeTable = Lazy(() =>
    Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0')),
);

/**
 * Pre-computed charCode-to-nibble decode table.
 * Valid hex chars map to 0-15, everything else maps to 0xff.
 */
const decodeTable = Lazy(() => {
    // 128 entries covers all ASCII charCodes (max hex char 'f' = 0x66 = 102).
    // Fill with 0xff as invalid marker — valid nibbles are 0-15,
    // so (hi | lo) > 0x0f detects any non-hex character.
    const table = new Uint8Array(128).fill(0xff);
    for (let i = 0; i < 10; i++) table[0x30 + i] = i;       // '0'-'9'
    for (let i = 0; i < 6; i++) table[0x41 + i] = 10 + i;   // 'A'-'F'
    for (let i = 0; i < 6; i++) table[0x61 + i] = 10 + i;   // 'a'-'f'
    return table;
});

// #endregion

/**
 * Encodes DataSource to a hexadecimal string.
 * - String: First UTF-8 encoded, then converted to hexadecimal
 * - BufferSource: Directly converted to hexadecimal
 *
 * Uses native `Uint8Array.prototype.toHex` if available, otherwise pure JS fallback.
 *
 * @param data - The DataSource to encode.
 * @returns Hexadecimal string.
 * @since 1.0.0
 * @example
 * ```ts
 * const hex = encodeHex(new Uint8Array([255, 0, 128]));
 * console.log(hex); // 'ff0080'
 *
 * const hex2 = encodeHex('hello');
 * console.log(hex2); // '68656c6c6f'
 * ```
 */
export function encodeHex(data: DataSource): string {
    const bytes = dataSourceToBytes(data);

    return typeof bytes.toHex === 'function'
        ? bytes.toHex()
        : encodeHexFallback(bytes);
}

/**
 * Decodes a hexadecimal string to Uint8Array.
 *
 * Uses native `Uint8Array.fromHex` if available, otherwise pure JS fallback.
 *
 * @param hex - Hexadecimal string.
 * @returns Decoded Uint8Array.
 * @throws {TypeError} If the input is not a string.
 * @throws {SyntaxError} If length is odd or contains non-hex characters.
 * @since 1.0.0
 * @example
 * ```ts
 * const bytes = decodeHex('ff0080');
 * console.log(bytes); // Uint8Array [255, 0, 128]
 * ```
 */
export function decodeHex(hex: string): Uint8Array<ArrayBuffer> {
    return typeof Uint8Array.fromHex === 'function'
        ? Uint8Array.fromHex(hex)
        : decodeHexFallback(hex);
}

// #region Internal Functions

/**
 * Pure JS implementation of hex encoding using pre-computed lookup table.
 *
 * @param bytes - The bytes to encode.
 * @returns Hexadecimal string.
 */
function encodeHexFallback(bytes: Uint8Array<ArrayBuffer>): string {
    const table = encodeTable.force();

    let result = '';
    for (const byte of bytes) {
        result += table[byte];
    }
    return result;
}

/**
 * Pure JS implementation of hex decoding using charCode lookup table.
 * Validates and decodes in a single pass.
 *
 * @param hex - Hexadecimal string.
 * @returns Decoded Uint8Array.
 * @throws {TypeError} If the input is not a string.
 * @throws {SyntaxError} If length is odd or contains non-hex characters.
 */
function decodeHexFallback(hex: string): Uint8Array<ArrayBuffer> {
    assertInputIsString(hex);

    const { length } = hex;
    if (length % 2 !== 0) {
        throwInvalidHex();
    }

    const table = decodeTable.force();
    const bytes = new Uint8Array(length / 2);

    for (let i = 0; i < length; i += 2) {
        const hi = table[hex.charCodeAt(i)];
        const lo = table[hex.charCodeAt(i + 1)];
        if ((hi | lo) > 0x0f) {
            throwInvalidHex();
        }
        bytes[i >> 1] = (hi << 4) | lo;
    }

    return bytes;
}

/**
 * Throws a SyntaxError for invalid hex input.
 */
function throwInvalidHex(): never {
    throw new SyntaxError('Input string must contain hex characters in even length');
}

// #endregion
