/**
 * Base64 encoding/decoding module.
 *
 * ## Implementation Strategy
 *
 * **Encoding (`encodeBase64`)**: Always uses pure JS implementation because:
 * - Native `btoa` only handles Latin1 characters (0x00-0xFF)
 * - Processing UTF-8 data requires additional `string → UTF-8 bytes → Latin1 string → btoa` conversion
 * - Benchmark shows pure JS is 1.8x ~ 5x faster than btoa with conversion
 *
 * **Decoding (`decodeBase64`)**: Uses pure JS for small inputs (length < 128),
 * native `atob` for larger inputs, falls back to pure JS when `atob` is not available.
 *
 * Derived from @std/encoding/base64 and https://github.com/cross-org/base64
 *
 * @module base64
 */

import { Lazy } from '../internal/mod.ts';
import { decodeByteString } from './bytestring.ts';
import { dataSourceToBytes } from './helpers.ts';
import type { DataSource } from './types.ts';

// #region Internal Variables

/**
 * Threshold for using fallback implementation.
 * For small inputs, pure JS is faster than native atob due to call overhead.
 */
const DECODE_FALLBACK_THRESHOLD = 128; // data.length (base64 string length)

/**
 * String containing standard base64 characters.
 */
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Standard base64 character array.
 */
const base64abc = chars.split('');

/**
 * Standard base64 character lookup table (lazily initialized).
 */
const lookup = Lazy(() => {
    const bytes = new Uint8Array(256);

    for (let i = 0; i < base64abc.length; i++) {
        bytes[base64abc[i].charCodeAt(0)] = i;
    }

    return bytes;
});

// #endregion

/**
 * Converts DataSource (string or BufferSource) to a Base64 encoded string.
 *
 * Uses pure JS implementation on all platforms to avoid Latin1 limitations and extra conversion overhead.
 *
 * @param data - The data to encode, can be a string, ArrayBuffer, TypedArray, or DataView.
 * @returns Base64 encoded string.
 * @since 1.0.0
 * @example
 * ```ts
 * // String input
 * const encoded = encodeBase64('Hello, World!');
 * console.log(encoded); // 'SGVsbG8sIFdvcmxkIQ=='
 *
 * // BufferSource input
 * const buffer = new Uint8Array([72, 101, 108, 108, 111]);
 * const base64 = encodeBase64(buffer);
 * console.log(base64); // 'SGVsbG8='
 * ```
 */
export function encodeBase64(data: DataSource): string {
    let result = '';

    const bytes = dataSourceToBytes(data);
    const { byteLength } = bytes;

    let i = 2;
    for (; i < byteLength; i += 3) {
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += base64abc[((bytes[i - 1] & 0x0f) << 2) | (bytes[i] >> 6)];
        result += base64abc[bytes[i] & 0x3f];
    }

    if (i === byteLength + 1) {
        // 1 byte remaining to write
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[(bytes[i - 2] & 0x03) << 4];
        result += '==';
    }

    if (i === byteLength) {
        // 2 bytes remaining to write
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += base64abc[(bytes[i - 1] & 0x0f) << 2];
        result += '=';
    }

    return result;
}

/**
 * Converts a Base64 encoded string to Uint8Array.
 *
 * Uses pure JS for small strings (length < 128) and native `atob` for larger ones.
 * Falls back to pure JS when `atob` is not available.
 *
 * @param data - Base64 encoded string.
 * @returns Decoded Uint8Array.
 * @since 1.0.0
 * @example
 * ```ts
 * const buffer = decodeBase64('SGVsbG8=');
 * console.log(buffer); // Uint8Array [72, 101, 108, 108, 111]
 *
 * // Decode to string
 * const text = decodeUtf8(decodeBase64('SGVsbG8sIFdvcmxkIQ=='));
 * console.log(text); // 'Hello, World!'
 * ```
 */
export function decodeBase64(data: string): Uint8Array<ArrayBuffer> {
    // Use fallback for small inputs (faster due to native API call overhead)
    // or when atob is not available
    return typeof atob !== 'function' || data.length < DECODE_FALLBACK_THRESHOLD
        ? decodeBase64Fallback(data)
        : decodeBase64Native(data);
}

// #region Internal Functions

/**
 * Native implementation using atob.
 * Converts atob's Latin1 string result to Uint8Array.
 *
 * @param data - Base64 encoded string.
 * @returns Decoded Uint8Array.
 */
function decodeBase64Native(data: string): Uint8Array<ArrayBuffer> {
    return decodeByteString(atob(data));
}

/**
 * Pure JS fallback implementation.
 *
 * @param data - Base64 encoded string.
 * @returns Decoded Uint8Array.
 * @throws {Error} If length % 4 === 1 (invalid base64 length).
 */
function decodeBase64Fallback(data: string): Uint8Array<ArrayBuffer> {
    const { length } = data;

    // Invalid: length % 4 === 1 cannot form valid base64
    if (length % 4 === 1) {
        throw new Error('The string to be decoded is not correctly encoded');
    }

    // Calculate byte length: (length * 3 / 4), accounting for padding
    let byteLength = (length * 3) >> 2; // Use bit shift to avoid decimals

    if (data[length - 1] === '=') {
        byteLength--;
        if (data[length - 2] === '=') {
            byteLength--;
        }
    }

    const bytes = new Uint8Array(byteLength);
    const table = lookup.force();

    let pos = 0;
    for (let i = 0; i < length; i += 4) {
        const encoded1 = table[data.charCodeAt(i)];
        const encoded2 = table[data.charCodeAt(i + 1)];
        const encoded3 = table[data.charCodeAt(i + 2)];
        const encoded4 = table[data.charCodeAt(i + 3)];

        bytes[pos++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[pos++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[pos++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return bytes;
}

// #endregion
