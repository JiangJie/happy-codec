/**
 * Base64 encoding/decoding module.
 *
 * @module base64
 */

import { assertInputIsString, Lazy, type Uint8ArrayConstructorWithBase64Hex, type Uint8ArrayWithBase64Hex } from '../internal/mod.ts';
import { dataSourceToBytes } from './helpers.ts';
import type { DataSource } from './types.ts';

// #region Internal Variables

/**
 * Common prefix shared by both base64 alphabets (first 62 characters).
 */
const commonChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Standard base64 character array.
 */
const base64abc = `${commonChars}+/`.split('');

/**
 * Base64url character array (RFC 4648 §5): uses `-` and `_` instead of `+` and `/`.
 */
const base64urlAbc = `${commonChars}-_`.split('');

/**
 * Standard base64 character lookup table (lazily initialized).
 */
const lookup = Lazy(() => buildLookup(base64abc));

/**
 * Base64url character lookup table (lazily initialized).
 */
const lookupUrl = Lazy(() => buildLookup(base64urlAbc));

/**
 * Validation regex for standard base64.
 */
const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

/**
 * Validation regex for base64url.
 */
const BASE64URL_RE = /^[A-Za-z0-9\-_]*={0,2}$/;

// #endregion

/**
 * Options for {@link encodeBase64}.
 * Mirrors the options accepted by the native `Uint8Array.prototype.toBase64`.
 *
 * @since 1.1.0
 */
export interface EncodeBase64Options {
    /**
     * Which base64 alphabet to use.
     * - `'base64'` (default): standard alphabet (`+`, `/`).
     * - `'base64url'`: URL-safe alphabet (`-`, `_`).
     * @default 'base64'
     */
    alphabet?: 'base64' | 'base64url';
    /**
     * If `true`, omit trailing `=` padding characters.
     * @default false
     */
    omitPadding?: boolean;
}

/**
 * Options for {@link decodeBase64}.
 * Mirrors the options accepted by the native `Uint8Array.fromBase64`.
 *
 * @since 1.1.0
 */
export interface DecodeBase64Options {
    /**
     * Which base64 alphabet to use.
     * - `'base64'` (default): standard alphabet (`+`, `/`).
     * - `'base64url'`: URL-safe alphabet (`-`, `_`).
     * @default 'base64'
     */
    alphabet?: 'base64' | 'base64url';
    /**
     * How to handle an incomplete final chunk of input.
     * - `'loose'` (default): accept and decode available bits.
     * - `'strict'`: require correct padding; throw on incomplete chunks.
     * - `'stop-before-partial'`: silently ignore an incomplete final chunk.
     * @default 'loose'
     */
    lastChunkHandling?: 'loose' | 'strict' | 'stop-before-partial';
}

/**
 * Converts DataSource (string or BufferSource) to a Base64 encoded string.
 *
 * Uses native `Uint8Array.prototype.toBase64` if available, otherwise pure JS fallback.
 *
 * @param data - The data to encode, can be a string, ArrayBuffer, or ArrayBufferView.
 * @param options - Encoding options.
 * @returns Base64 encoded string.
 * @throws {TypeError} If the input is not a string, ArrayBuffer, or ArrayBufferView.
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
 *
 * // Base64url with no padding
 * const url = encodeBase64(buffer, { alphabet: 'base64url', omitPadding: true });
 * console.log(url); // 'SGVsbG8'
 * ```
 */
export function encodeBase64(data: DataSource, options?: EncodeBase64Options): string {
    const bytes = dataSourceToBytes(data);

    const extended = bytes as Uint8ArrayWithBase64Hex;
    return typeof extended.toBase64 === 'function'
        ? extended.toBase64(options)
        : encodeBase64Fallback(bytes, options);
}

/**
 * Converts a Base64 encoded string to Uint8Array.
 *
 * Uses native `Uint8Array.fromBase64` if available, otherwise pure JS fallback.
 *
 * @param base64 - Base64 encoded string.
 * @param options - Decoding options.
 * @returns Decoded Uint8Array.
 * @throws {TypeError} If the input is not a string.
 * @throws {SyntaxError} If the input contains invalid characters for the chosen alphabet.
 * @throws {SyntaxError} If the input has an invalid length (trailing single character).
 * @throws {SyntaxError} If `options.lastChunkHandling` is `'strict'` and padding is missing or padding bits are non-zero.
 * @since 1.0.0
 * @example
 * ```ts
 * const buffer = decodeBase64('SGVsbG8=');
 * console.log(buffer); // Uint8Array [72, 101, 108, 108, 111]
 *
 * // Decode to string
 * const text = decodeUtf8(decodeBase64('SGVsbG8sIFdvcmxkIQ=='));
 * console.log(text); // 'Hello, World!'
 *
 * // Base64url input
 * const bytes = decodeBase64('SGVsbG8', { alphabet: 'base64url' });
 *
 * // Strict mode: require correct padding
 * decodeBase64('QQ==', { lastChunkHandling: 'strict' });
 * ```
 */
export function decodeBase64(base64: string, options?: DecodeBase64Options): Uint8Array<ArrayBuffer> {
    const ctor = Uint8Array as unknown as Uint8ArrayConstructorWithBase64Hex;
    return typeof ctor.fromBase64 === 'function'
        ? ctor.fromBase64(base64, options)
        : decodeBase64Fallback(base64, options);
}

// #region Internal Functions

/**
 * Pure JS implementation of Base64 encoding.
 *
 * @param bytes - The bytes to encode.
 * @param options - Encoding options.
 * @returns Base64 encoded string.
 */
function encodeBase64Fallback(bytes: Uint8Array<ArrayBuffer>, options?: EncodeBase64Options): string {
    const {
        alphabet = 'base64',
        omitPadding = false,
    } = options ?? {};

    const abc = alphabet === 'base64url' ? base64urlAbc : base64abc;
    const { byteLength } = bytes;

    let result = '';
    let i = 2;

    for (; i < byteLength; i += 3) {
        result += abc[bytes[i - 2] >> 2];
        result += abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += abc[((bytes[i - 1] & 0x0f) << 2) | (bytes[i] >> 6)];
        result += abc[bytes[i] & 0x3f];
    }

    // Handle remaining bytes after the main loop.
    // Loop starts at i=2, increments by 3, exits when i >= byteLength:
    //   byteLength % 3 === 1 → i === byteLength + 1 → 1 byte remaining
    //   byteLength % 3 === 2 → i === byteLength     → 2 bytes remaining

    if (i === byteLength + 1) {
        // 1 byte remaining to write
        result += abc[bytes[i - 2] >> 2];
        result += abc[(bytes[i - 2] & 0x03) << 4];
        if (!omitPadding) result += '==';
    } else if (i === byteLength) {
        // 2 bytes remaining to write
        result += abc[bytes[i - 2] >> 2];
        result += abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += abc[(bytes[i - 1] & 0x0f) << 2];
        if (!omitPadding) result += '=';
    }

    return result;
}

/**
 * Pure JS fallback implementation.
 *
 * @param base64 - Base64 encoded string.
 * @param options - Decoding options.
 * @returns Decoded Uint8Array.
 * @throws {TypeError} If the input is not a string.
 * @throws {SyntaxError} If the input contains invalid characters for the chosen alphabet.
 * @throws {SyntaxError} If the input has an invalid length (trailing single character).
 * @throws {SyntaxError} If `options.lastChunkHandling` is `'strict'` and padding is missing or padding bits are non-zero.
 */
function decodeBase64Fallback(base64: string, options?: DecodeBase64Options): Uint8Array<ArrayBuffer> {
    assertInputIsString(base64);

    const {
        alphabet = 'base64',
        lastChunkHandling = 'loose',
    } = options ?? {};

    // Strip padding for length calculations, but remember original padding count
    const stripped = base64.replace(/={1,2}$/, '');
    const paddingChars = base64.length - stripped.length;
    const dataLength = stripped.length;
    const isUrlSafe = alphabet === 'base64url';

    // Validate characters against the chosen alphabet
    const re = isUrlSafe ? BASE64URL_RE : BASE64_RE;
    if (base64.length > 0 && !re.test(base64)) {
        throw new SyntaxError('Found a character that cannot be part of a valid base64 string');
    }

    // How many data chars remain after consuming full 4-char groups (ignoring padding)
    const remainder = dataLength % 4;

    // Determine whether the final chunk is "incomplete" (not padded to a 4-char boundary)
    const hasIncompleteChunk = remainder !== 0 && paddingChars === 0;

    // remainder === 1 is always invalid (only 6 bits, cannot form a byte);
    // in 'strict' mode, any incomplete chunk (missing padding) is also invalid
    if (remainder === 1 || (hasIncompleteChunk && lastChunkHandling === 'strict')) {
        throw new SyntaxError('The base64 input terminates with a single character, excluding padding (=)');
    }

    if (lastChunkHandling === 'strict') {
        // Validate that padding bits are zero (unused bits in the last data char before padding)
        // xx==: lower 4 bits must be 0; xxx=: lower 2 bits must be 0
        if (paddingChars > 0) {
            const table = (isUrlSafe ? lookupUrl : lookup).force();
            const lastDataChar = table[stripped.charCodeAt(dataLength - 1)];
            const mask = paddingChars === 2 ? 0x0f : 0x03;

            if ((lastDataChar & mask) !== 0) {
                throw new SyntaxError('The base64 input terminates with non-zero padding bits');
            }
        }
    }

    // Determine how many full 4-char groups of data chars to decode
    const fullChunks = Math.floor(dataLength / 4);
    let extraBytes = 0;
    let decodeExtra = remainder !== 0;

    if (hasIncompleteChunk && lastChunkHandling === 'stop-before-partial') {
        // Ignore the incomplete final chunk (no padding → truly partial)
        decodeExtra = false;
    }

    if (decodeExtra) {
        // remainder 2 → 1 byte, remainder 3 → 2 bytes
        extraBytes = remainder === 2 ? 1 : 2;
    }

    const byteLength = fullChunks * 3 + extraBytes;
    const bytes = new Uint8Array(byteLength);
    const table = (isUrlSafe ? lookupUrl : lookup).force();

    let pos = 0;
    let i = 0;

    // Decode full 4-char groups (from the stripped data, which has no '=' chars)
    for (; i < fullChunks * 4; i += 4) {
        const encoded1 = table[stripped.charCodeAt(i)];
        const encoded2 = table[stripped.charCodeAt(i + 1)];
        const encoded3 = table[stripped.charCodeAt(i + 2)];
        const encoded4 = table[stripped.charCodeAt(i + 3)];

        bytes[pos++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[pos++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[pos++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    // Decode remaining chars (if any)
    if (decodeExtra && remainder === 2) {
        const encoded1 = table[stripped.charCodeAt(i)];
        const encoded2 = table[stripped.charCodeAt(i + 1)];
        bytes[pos] = (encoded1 << 2) | (encoded2 >> 4);
    } else if (decodeExtra && remainder === 3) {
        const encoded1 = table[stripped.charCodeAt(i)];
        const encoded2 = table[stripped.charCodeAt(i + 1)];
        const encoded3 = table[stripped.charCodeAt(i + 2)];
        bytes[pos++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[pos] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }

    return bytes;
}

/**
 * Build a 128-byte lookup table from a base64 character array.
 */
function buildLookup(abc: string[]): Uint8Array {
    // 128 entries covers all ASCII charCodes.
    // Safe because input is pre-validated by BASE64_RE / BASE64URL_RE.
    const bytes = new Uint8Array(128);
    for (let i = 0; i < abc.length; i++) {
        bytes[abc[i].charCodeAt(0)] = i;
    }
    return bytes;
}

// #endregion
