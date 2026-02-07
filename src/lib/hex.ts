/**
 * Hex (hexadecimal) encoding/decoding module.
 * @module hex
 */

import { dataSourceToBytes } from './helpers.ts';
import type { DataSource } from './types.ts';

/**
 * Encodes DataSource to a hexadecimal string.
 * - String: First UTF-8 encoded, then converted to hexadecimal
 * - BufferSource: Directly converted to hexadecimal
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
    return Array.from(dataSourceToBytes(data), byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Decodes a hexadecimal string to Uint8Array.
 *
 * @param hex - Hexadecimal string.
 * @returns Decoded Uint8Array.
 * @throws {Error} If length is odd or contains non-hex characters.
 * @since 1.0.0
 * @example
 * ```ts
 * const bytes = decodeHex('ff0080');
 * console.log(bytes); // Uint8Array [255, 0, 128]
 * ```
 */
export function decodeHex(hex: string): Uint8Array<ArrayBuffer> {
    if (hex.length % 2 !== 0) {
        throw new Error('Invalid hex string: length must be even');
    }

    if (/[^0-9a-fA-F]/.test(hex)) {
        throw new Error('Invalid hex string: contains non-hex characters');
    }

    const bytes = new Uint8Array(hex.length / 2);

    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }

    return bytes;
}
