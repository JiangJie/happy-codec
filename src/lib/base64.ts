/**
 * Base64 encoding/decoding module.
 *
 * ## Implementation Strategy
 *
 * **Encoding (`encodeBase64`)**:
 * - Uses native `Uint8Array.prototype.toBase64` for larger inputs (>= 32 bytes) if available
 * - Falls back to pure JS for small inputs or when native API is unavailable
 *
 * **Decoding (`decodeBase64`)**:
 * - Uses native `Uint8Array.fromBase64` for larger inputs (>= 24 chars) if available
 * - Falls back to pure JS for small inputs or when native API is unavailable
 *
 * Derived from @std/encoding/base64 and https://github.com/cross-org/base64
 *
 * @module base64
 */

// TC39 Stage 4: Uint8Array base64 methods (not yet in TS lib types)
declare global {
    interface Uint8Array {
        toBase64(options?: { alphabet?: 'base64' | 'base64url'; omitPadding?: boolean; }): string;
    }
    interface Uint8ArrayConstructor {
        fromBase64(base64: string, options?: { alphabet?: 'base64' | 'base64url'; lastChunkHandling?: 'loose' | 'strict' | 'stop-before-partial'; }): Uint8Array<ArrayBuffer>;
    }
}

import { Lazy } from '../internal/mod.ts';
import { dataSourceToBytes } from './helpers.ts';
import type { DataSource } from './types.ts';

// #region Internal Variables

/**
 * Threshold for using native `Uint8Array.prototype.toBase64`.
 * For small inputs, pure JS is faster than native API due to call overhead.
 */
const ENCODE_NATIVE_THRESHOLD = 21; // byteLength

/**
 * Threshold for using native `Uint8Array.fromBase64`.
 * For small inputs, pure JS is faster than native API due to call overhead.
 */
const DECODE_NATIVE_THRESHOLD = 88; // data.length (base64 string length, ≈66 bytes)

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
 * Uses native `Uint8Array.prototype.toBase64` for larger inputs if available,
 * pure JS fallback for small inputs or when native API is unavailable.
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
    const bytes = dataSourceToBytes(data);

    return typeof bytes.toBase64 === 'function' && bytes.byteLength >= ENCODE_NATIVE_THRESHOLD
        ? bytes.toBase64()
        : encodeBase64Fallback(bytes);
}

/**
 * Converts a Base64 encoded string to Uint8Array.
 *
 * Uses native `Uint8Array.fromBase64` for larger inputs if available,
 * pure JS fallback for small inputs or when native API is unavailable.
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
    return typeof Uint8Array.fromBase64 === 'function' && data.length >= DECODE_NATIVE_THRESHOLD
        ? Uint8Array.fromBase64(data)
        : decodeBase64Fallback(data);
}

// #region Internal Functions

/**
 * Pure JS implementation of Base64 encoding.
 *
 * @param bytes - The bytes to encode.
 * @returns Base64 encoded string.
 */
function encodeBase64Fallback(bytes: Uint8Array<ArrayBuffer>): string {
    const { byteLength } = bytes;

    let result = '';
    let i = 2;

    for (; i < byteLength; i += 3) {
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += base64abc[((bytes[i - 1] & 0x0f) << 2) | (bytes[i] >> 6)];
        result += base64abc[bytes[i] & 0x3f];
    }

    // Handle remaining bytes after the main loop.
    // Loop starts at i=2, increments by 3, exits when i >= byteLength:
    //   byteLength % 3 === 1 → i === byteLength + 1 → 1 byte remaining
    //   byteLength % 3 === 2 → i === byteLength     → 2 bytes remaining

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
