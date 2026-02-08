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

import { assertInputIsString } from '../internal/mod.ts';
import { dataSourceToBytes } from './helpers.ts';
import type { DataSource } from './types.ts';

// #region Internal Variables

/**
 * Threshold (in hex string length) for using native `Uint8Array.fromHex`.
 * For small inputs, pure JS is faster than native API due to call overhead.
 */
const DECODE_NATIVE_THRESHOLD = 22; // hex.length (hex string length, = 11 bytes)

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
 * Uses native `Uint8Array.fromHex` for larger inputs if available,
 * pure JS fallback for small inputs or when native API is unavailable.
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
    return typeof Uint8Array.fromHex === 'function' && hex.length >= DECODE_NATIVE_THRESHOLD
        ? Uint8Array.fromHex(hex)
        : decodeHexFallback(hex);
}

// #region Internal Functions

/**
 * Pure JS implementation of hex encoding.
 *
 * @param bytes - The bytes to encode.
 * @returns Hexadecimal string.
 */
function encodeHexFallback(bytes: Uint8Array<ArrayBuffer>): string {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Pure JS implementation of hex decoding.
 *
 * @param hex - Hexadecimal string.
 * @returns Decoded Uint8Array.
 * @throws {TypeError} If the input is not a string.
 * @throws {SyntaxError} If length is odd or contains non-hex characters.
 */
function decodeHexFallback(hex: string): Uint8Array<ArrayBuffer> {
    assertInputIsString(hex);

    if (hex.length % 2 !== 0 || /[^0-9a-fA-F]/.test(hex)) {
        throw new SyntaxError('Input string must contain hex characters in even length');
    }

    const bytes = new Uint8Array(hex.length / 2);

    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }

    return bytes;
}

// #endregion
