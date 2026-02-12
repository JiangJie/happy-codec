/**
 * UTF-8 encoding/decoding module.
 *
 * @module utf8
 */

import { assertInputIsString, bufferSourceToBytes, Lazy, typedArrayToString } from '../internal/mod.ts';

// #region Internal Variables

// label for TextDecoder
const LABEL = 'utf-8';

// Cached TextEncoder instance
const encoder = Lazy(() => new TextEncoder());

// Cached TextDecoder instances for all combinations of fatal × ignoreBOM
const decoder = Lazy(() => new TextDecoder(LABEL, { fatal: false, ignoreBOM: false }));
const decoderIgnoreBOM = Lazy(() => new TextDecoder(LABEL, { fatal: false, ignoreBOM: true }));
const fatalDecoder = Lazy(() => new TextDecoder(LABEL, { fatal: true, ignoreBOM: false }));
const fatalDecoderIgnoreBOM = Lazy(() => new TextDecoder(LABEL, { fatal: true, ignoreBOM: true }));

// #endregion

/**
 * Encodes string data to `Uint8Array` (UTF-8 encoding).
 *
 * Uses native `TextEncoder` if available, otherwise pure JS fallback.
 *
 * @param input - The string data to encode.
 * @returns Encoded `Uint8Array`.
 * @throws {TypeError} If the input is not a string.
 * @since 1.0.0
 * @example
 * ```ts
 * const encoded = encodeUtf8('你好');
 * console.log(encoded); // Uint8Array [228, 189, 160, 229, 165, 189]
 * ```
 */
export function encodeUtf8(input: string): Uint8Array<ArrayBuffer> {
    assertInputIsString(input);

    return typeof TextEncoder === 'function'
        ? encoder.force().encode(input)
        : encodeUtf8Fallback(input);
}

/**
 * Decodes binary data to string (UTF-8 decoding).
 *
 * Uses native `TextDecoder` when available (faster at all input sizes).
 * Falls back to pure JS when `TextDecoder` is not available.
 *
 * @param data - The binary data to decode.
 * @param options - Decoding options (same as TextDecoderOptions).
 * @param options.fatal - If true, throw on invalid sequences. If false (default), replace with U+FFFD.
 * @param options.ignoreBOM - If true, keep BOM in output. If false (default), strip BOM.
 * @returns Decoded string.
 * @throws {TypeError} If `options.fatal` is `true` and the input contains invalid UTF-8 sequences.
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
 *
 * // BOM handling (default: strip BOM)
 * const withBOM = new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x69]); // BOM + 'Hi'
 * decodeUtf8(withBOM); // 'Hi'
 * decodeUtf8(withBOM, { ignoreBOM: true }); // '\uFEFFHi'
 * ```
 */
export function decodeUtf8(data: AllowSharedBufferSource, options?: TextDecoderOptions): string {
    const {
        fatal = false,
        ignoreBOM = false,
    } = options ?? {};

    // Use native TextDecoder when available (faster at all input sizes)
    if (typeof TextDecoder === 'function') {
        const decoderInstance = fatal
            ? (ignoreBOM ? fatalDecoderIgnoreBOM : fatalDecoder)
            : (ignoreBOM ? decoderIgnoreBOM : decoder);
        return decoderInstance.force().decode(data);
    }

    return decodeUtf8Fallback(data, { fatal, ignoreBOM });
}

// #region Pure JS Implementation

/**
 * Pure JS implementation of UTF-8 encoding.
 *
 * @param input - The string to encode.
 * @returns Encoded Uint8Array.
 */
function encodeUtf8Fallback(input: string): Uint8Array<ArrayBuffer> {
    const { length } = input;
    // Each UTF-16 code unit produces at most 3 UTF-8 bytes
    const bytes = new Uint8Array(length * 3);
    let pos = 0;

    for (let i = 0; i < length; i++) {
        let codePoint = input.charCodeAt(i);

        if (codePoint < 0x80) {
            // 1 byte (ASCII)
            bytes[pos++] = codePoint;
        } else if (codePoint < 0x800) {
            // 2 bytes
            bytes[pos++] = 0xc0 | (codePoint >> 6);
            bytes[pos++] = 0x80 | (codePoint & 0x3f);
        } else if (codePoint < 0xd800 || codePoint >= 0xe000) {
            // 3 bytes (normal BMP character, not a surrogate)
            bytes[pos++] = 0xe0 | (codePoint >> 12);
            bytes[pos++] = 0x80 | ((codePoint >> 6) & 0x3f);
            bytes[pos++] = 0x80 | (codePoint & 0x3f);
        } else {
            // Surrogate pair → 4-byte UTF-8
            const lo = input.charCodeAt(++i);
            codePoint = ((codePoint - 0xd800) << 10) + (lo - 0xdc00) + 0x10000;
            bytes[pos++] = 0xf0 | (codePoint >> 18);
            bytes[pos++] = 0x80 | ((codePoint >> 12) & 0x3f);
            bytes[pos++] = 0x80 | ((codePoint >> 6) & 0x3f);
            bytes[pos++] = 0x80 | (codePoint & 0x3f);
        }
    }

    // Use slice (not subarray) to release the over-allocated buffer for GC
    return bytes.slice(0, pos);
}

/**
 * Pure JS implementation of UTF-8 decoding.
 *
 * @param data - The AllowSharedBufferSource to decode.
 * @param options - Decoding options (same as TextDecoderOptions).
 * @returns Decoded string.
 * @throws {TypeError} If `options.fatal` is `true` and the input contains invalid UTF-8 sequences.
 */
function decodeUtf8Fallback(data: AllowSharedBufferSource, options: TextDecoderOptions): string {
    const bytes = bufferSourceToBytes(data);

    const { fatal, ignoreBOM } = options;
    const { length } = bytes;
    // Each byte produces at most one charCode; surrogate pairs (4 bytes → 2 charCodes) stay within bounds
    const charCodes = new Uint16Array(length);
    let pos = 0;

    /**
     * Handle invalid byte sequence: throw if fatal, otherwise collect replacement character.
     */
    function handleInvalid(): void {
        if (fatal) {
            throw new TypeError('The encoded data was not valid for encoding utf-8');
        }
        charCodes[pos++] = 0xfffd;
    }

    // Skip BOM at byte level: UTF-8 BOM is 0xef 0xbb 0xbf
    let i = (!ignoreBOM && length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf)
        ? 3
        : 0;
    while (i < length) {
        const byte = bytes[i];

        // 1-byte character (ASCII: 0x00-0x7f)
        if (byte < 0x80) {
            charCodes[pos++] = byte;
            i += 1;
            continue;
        }

        // Determine bytes needed and validate leading byte
        let bytesNeeded: number;
        let codePoint: number;
        let lowerBoundary = 0x80;
        let upperBoundary = 0xbf;

        if (byte >= 0xc2 && byte < 0xe0) {
            // 2-byte character
            bytesNeeded = 2;
            codePoint = byte & 0x1f;
        } else if (byte >= 0xe0 && byte < 0xf0) {
            // 3-byte character
            bytesNeeded = 3;
            codePoint = byte & 0x0f;
            if (byte === 0xe0) lowerBoundary = 0xa0;
            if (byte === 0xed) upperBoundary = 0x9f;
        } else if (byte >= 0xf0 && byte < 0xf5) {
            // 4-byte character
            bytesNeeded = 4;
            codePoint = byte & 0x07;
            if (byte === 0xf0) lowerBoundary = 0x90;
            if (byte === 0xf4) upperBoundary = 0x8f;
        } else {
            // Invalid leading byte (0x80-0xc1, 0xf5-0xff)
            handleInvalid();
            i += 1;
            continue;
        }

        // Check if we have enough bytes for the complete sequence
        if (i + bytesNeeded > length) {
            // Truncated sequence: output one replacement char for entire remaining bytes
            handleInvalid();
            break;
        }

        // Validate and decode continuation bytes
        let valid = true;
        for (let j = 1; j < bytesNeeded; j++) {
            const byte = bytes[i + j];
            const lower = j === 1 ? lowerBoundary : 0x80;
            const upper = j === 1 ? upperBoundary : 0xbf;

            if (byte < lower || byte > upper) {
                valid = false;
                break;
            }
            codePoint = (codePoint << 6) | (byte & 0x3f);
        }

        if (!valid) {
            // Invalid continuation byte: output replacement and advance by 1
            handleInvalid();
            i += 1;
            continue;
        }

        if (codePoint < 0x10000) {
            charCodes[pos++] = codePoint;
        } else {
            // Split into surrogate pair for String.fromCharCode
            const offset = codePoint - 0x10000;
            charCodes[pos++] = 0xd800 + (offset >> 10);
            charCodes[pos++] = 0xdc00 + (offset & 0x3ff);
        }
        i += bytesNeeded;
    }

    return typedArrayToString(charCodes, pos);
}

// #endregion
