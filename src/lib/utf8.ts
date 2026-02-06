/**
 * UTF-8 encoding/decoding module.
 * @module utf8
 */

import { bufferSourceToBytes, Lazy } from '../internal/mod.ts';

// #region Types

/**
 * Options for UTF-8 decoding.
 */
export interface DecodeUtf8Options {
    /**
     * If true, throw an error when encountering invalid UTF-8 sequences.
     * If false (default), replace invalid sequences with U+FFFD (replacement character).
     * @default false
     */
    fatal?: boolean;
}

// #endregion

// #region Internal Variables

const encoder = Lazy(() => new TextEncoder());
// Non-fatal decoder (default): replaces invalid sequences with U+FFFD
const decoder = Lazy(() => new TextDecoder('utf-8', { fatal: false }));
// Fatal decoder: throws on invalid sequences
const fatalDecoder = Lazy(() => new TextDecoder('utf-8', { fatal: true }));

// #endregion

/**
 * Encodes string data to `Uint8Array` (UTF-8 encoding).
 *
 * @param data - The string data to encode.
 * @returns Encoded `Uint8Array`.
 * @since 1.0.0
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
        : encodeUtf8Fallback(data);
}

/**
 * Decodes binary data to string (UTF-8 decoding).
 *
 * @param data - The binary data to decode.
 * @param options - Decoding options.
 * @param options.fatal - If true, throw on invalid sequences. If false (default), replace with U+FFFD.
 * @returns Decoded string.
 * @since 1.0.0
 * @example
 * ```ts
 * const decoded = decodeUtf8(new Uint8Array([228, 189, 160, 229, 165, 189]));
 * console.log(decoded); // '你好'
 *
 * // With invalid bytes (non-fatal, default)
 * const withReplacement = decodeUtf8(new Uint8Array([0xff, 0xfe]));
 * console.log(withReplacement); // '��'
 *
 * // With invalid bytes (fatal)
 * decodeUtf8(new Uint8Array([0xff, 0xfe]), { fatal: true }); // throws Error
 * ```
 */
export function decodeUtf8(data: BufferSource, options?: DecodeUtf8Options): string {
    const fatal = options?.fatal ?? false;

    // Compatible with environments that may not have `TextDecoder`
    return typeof TextDecoder === 'function'
        ? (fatal ? fatalDecoder : decoder).force().decode(data)
        : decodeUtf8Fallback(data, fatal);
}

// #region Pure JS Implementation

/**
 * Pure JS implementation of UTF-8 encoding.
 * Used when the platform does not support TextEncoder.
 *
 * @param data - The string to encode.
 * @returns Encoded Uint8Array.
 */
function encodeUtf8Fallback(data: string): Uint8Array<ArrayBuffer> {
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
 *
 * @param data - The BufferSource to decode.
 * @param fatal - If true, throw on invalid sequences. If false, replace with U+FFFD.
 * @returns Decoded string.
 */
function decodeUtf8Fallback(data: BufferSource, fatal: boolean): string {
    const bytes = bufferSourceToBytes(data);
    const { length } = bytes;

    let str = '';
    let i = 0;

    /**
     * Handle invalid byte sequence: throw if fatal, otherwise append replacement character and advance index.
     */
    function handleInvalid(): void {
        if (fatal) {
            throw new TypeError('The encoded data was not valid for encoding utf-8');
        }
        str += '\ufffd';
        i += 1;
    }

    while (i < length) {
        const byte1 = bytes[i];

        let codePoint: number;
        let bytesNeeded: number;
        let lowerBoundary = 0x80;
        let upperBoundary = 0xbf;

        if (byte1 < 0x80) {
            // 1-byte character (ASCII)
            str += String.fromCodePoint(byte1);
            i += 1;
            continue;
        } else if (byte1 >= 0xc2 && byte1 < 0xe0) {
            // 2-byte character
            bytesNeeded = 1;
            codePoint = byte1 & 0x1f;
        } else if (byte1 >= 0xe0 && byte1 < 0xf0) {
            // 3-byte character
            bytesNeeded = 2;
            codePoint = byte1 & 0x0f;
            if (byte1 === 0xe0) lowerBoundary = 0xa0;
            if (byte1 === 0xed) upperBoundary = 0x9f;
        } else if (byte1 >= 0xf0 && byte1 < 0xf5) {
            // 4-byte character
            bytesNeeded = 3;
            codePoint = byte1 & 0x07;
            if (byte1 === 0xf0) lowerBoundary = 0x90;
            if (byte1 === 0xf4) upperBoundary = 0x8f;
        } else {
            // Invalid leading byte
            handleInvalid();
            continue;
        }

        // Check if we have enough bytes
        if (i + bytesNeeded >= length) {
            handleInvalid();
            continue;
        }

        // Process continuation bytes
        let valid = true;
        for (let j = 0; j < bytesNeeded; j++) {
            const byte = bytes[i + 1 + j];
            const lower = j === 0 ? lowerBoundary : 0x80;
            const upper = j === 0 ? upperBoundary : 0xbf;

            if (byte < lower || byte > upper) {
                valid = false;
                break;
            }
            codePoint = (codePoint << 6) | (byte & 0x3f);
        }

        if (!valid) {
            handleInvalid();
            continue;
        }

        str += String.fromCodePoint(codePoint);
        i += 1 + bytesNeeded;
    }

    return str;
}

// #endregion
