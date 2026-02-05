/**
 * UTF-8 encoding/decoding module.
 * @module utf8
 */

import { bufferSourceToBytes, Lazy } from '../internal/mod.ts';

// #region Internal Variables

const encoder = Lazy(() => new TextEncoder());
// Throw error on invalid data
const decoder = Lazy(() => new TextDecoder('utf-8', { fatal: true }));

// #endregion

/**
 * Encodes string data to `Uint8Array` (UTF-8 encoding).
 * @param data - The string data to encode.
 * @returns Encoded `Uint8Array`.
 * @example
 * ```ts
 * const encoded = encodeUtf8('你好');
 * console.log(encoded); // Uint8Array [228, 189, 160, 229, 165, 189]
 * ```
 */
export function encodeUtf8(data: string): Uint8Array<ArrayBuffer> {
    // Compatible with environments that may not have `TextEncoder`
    return typeof TextEncoder === 'function'
        ? encoder.force().encode(data)
        : encodeUtf8Buffer(data);
}

/**
 * Decodes binary data to string (UTF-8 decoding).
 * @param data - The binary data to decode.
 * @returns Decoded string.
 * @example
 * ```ts
 * const decoded = decodeUtf8(new Uint8Array([228, 189, 160, 229, 165, 189]));
 * console.log(decoded); // '你好'
 * ```
 */
export function decodeUtf8(data: BufferSource): string {
    // Compatible with environments that may not have `TextDecoder`
    return typeof TextDecoder === 'function'
        ? decoder.force().decode(data)
        : decodeUtf8Buffer(data);
}

// #region Pure JS Implementation

/**
 * Pure JS implementation of UTF-8 encoding.
 * Used when the platform does not support TextEncoder.
 * @param data - The string to encode.
 * @returns Encoded Uint8Array.
 */
function encodeUtf8Buffer(data: string): Uint8Array<ArrayBuffer> {
    const bytes: number[] = [];

    for (let i = 0; i < data.length; i++) {
        // Use codePointAt to get the complete Unicode code point, correctly handling surrogate pairs
        const codePoint = data.codePointAt(i) as number;

        // Handle different Unicode ranges
        if (codePoint < 0x80) {
            // 1 byte
            bytes.push(codePoint);
        } else if (codePoint < 0x800) {
            // 2 bytes
            bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
        } else if (codePoint < 0x10000) {
            // 3 bytes
            bytes.push(0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f));
        } else {
            // 4 bytes (U+10000 and above), need to skip the second code unit of the surrogate pair
            bytes.push(
                0xf0 | (codePoint >> 18),
                0x80 | ((codePoint >> 12) & 0x3f),
                0x80 | ((codePoint >> 6) & 0x3f),
                0x80 | (codePoint & 0x3f),
            );
            i++; // Skip the low surrogate of the surrogate pair
        }
    }

    return new Uint8Array(bytes);
}

/**
 * Pure JS implementation of UTF-8 decoding.
 * Used when the platform does not support TextDecoder.
 * @param data - The BufferSource to decode.
 * @returns Decoded string.
 */
function decodeUtf8Buffer(data: BufferSource): string {
    const bytes = bufferSourceToBytes(data);

    let str = '';
    let i = 0;

    while (i < bytes.length) {
        const byte1 = bytes[i];

        let codePoint: number;

        if (byte1 < 0x80) {
            // 1-byte character
            codePoint = byte1;
            i += 1;
        } else if (byte1 < 0xe0) {
            // 2-byte character
            const byte2 = bytes[i + 1];
            codePoint = ((byte1 & 0x1f) << 6) | (byte2 & 0x3f);
            i += 2;
        } else if (byte1 < 0xf0) {
            // 3-byte character
            const byte2 = bytes[i + 1];
            const byte3 = bytes[i + 2];
            codePoint = ((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f);
            i += 3;
        } else if (byte1 < 0xf8) {
            // 4-byte character (code point >= U+10000, such as emoji)
            const byte2 = bytes[i + 1];
            const byte3 = bytes[i + 2];
            const byte4 = bytes[i + 3];
            codePoint = ((byte1 & 0x07) << 18) | ((byte2 & 0x3f) << 12) | ((byte3 & 0x3f) << 6) | (byte4 & 0x3f);
            i += 4;
        } else {
            // Invalid UTF-8 byte sequence
            throw new Error('Invalid UTF-8 byte sequence');
        }

        // Use fromCodePoint to correctly handle all Unicode code points (including >= U+10000)
        str += String.fromCodePoint(codePoint);
    }

    return str;
}

// #endregion
