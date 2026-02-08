/**
 * UTF-8 encoding/decoding module.
 * @module utf8
 */

import { assertInputIsString, bufferSourceToBytes, Lazy } from '../internal/mod.ts';

// #region Internal Variables

/**
 * UTF-8 BOM (Byte Order Mark): U+FEFF
 */
const BOM = '\ufeff';

/**
 * Threshold for using fallback implementation.
 * For small inputs, pure JS is faster than native API due to call overhead.
 *
 * ENCODE: 21 chars of 3-byte CJK characters = 63 bytes (worst case),
 * benchmarked with maximum bytes.push() calls per string.length.
 *
 * DECODE: 4 bytes of Latin1 characters (worst case),
 * benchmarked with maximum str += calls per byteLength.
 */
const ENCODE_FALLBACK_THRESHOLD = 21; // string.length (up to 63 bytes)
const DECODE_FALLBACK_THRESHOLD = 4; // byteLength

// Cached TextEncoder instance
const encoder = Lazy(() => new TextEncoder());

// Cached TextDecoder instances for all combinations of fatal × ignoreBOM
const decoder = Lazy(() => new TextDecoder('utf-8', { fatal: false, ignoreBOM: false }));
const decoderIgnoreBOM = Lazy(() => new TextDecoder('utf-8', { fatal: false, ignoreBOM: true }));
const fatalDecoder = Lazy(() => new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }));
const fatalDecoderIgnoreBOM = Lazy(() => new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }));

// #endregion

/**
 * Encodes string data to `Uint8Array` (UTF-8 encoding).
 *
 * Uses pure JS for small strings (length <= 21, up to 63 bytes) and native `TextEncoder` for larger ones.
 * Falls back to pure JS when `TextEncoder` is not available.
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

    // Use fallback for small inputs (faster due to native API call overhead)
    // or when TextEncoder is not available
    return typeof TextEncoder !== 'function' || input.length <= ENCODE_FALLBACK_THRESHOLD
        ? encodeUtf8Fallback(input)
        : encoder.force().encode(input);
}

/**
 * Decodes binary data to string (UTF-8 decoding).
 *
 * Uses pure JS for small data (byteLength <= 4) and native `TextDecoder` for larger ones.
 * Falls back to pure JS when `TextDecoder` is not available.
 *
 * @param data - The binary data to decode.
 * @param options - Decoding options (same as TextDecoderOptions).
 * @param options.fatal - If true, throw on invalid sequences. If false (default), replace with U+FFFD.
 * @param options.ignoreBOM - If true, keep BOM in output. If false (default), strip BOM.
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
 *
 * // BOM handling (default: strip BOM)
 * const withBOM = new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x69]); // BOM + 'Hi'
 * decodeUtf8(withBOM); // 'Hi'
 * decodeUtf8(withBOM, { ignoreBOM: true }); // '\uFEFFHi'
 * ```
 */
export function decodeUtf8(data: BufferSource, options?: TextDecoderOptions): string {
    const {
        fatal = false,
        ignoreBOM = false,
    } = options ?? {};

    // Use fallback for small inputs (faster due to native API call overhead)
    // or when TextDecoder is not available
    // get byte length for threshold check
    if (typeof TextDecoder !== 'function' || data.byteLength <= DECODE_FALLBACK_THRESHOLD) {
        return decodeUtf8Fallback(data, { fatal, ignoreBOM });
    }

    const decoderInstance = fatal
        ? (ignoreBOM ? fatalDecoderIgnoreBOM : fatalDecoder)
        : (ignoreBOM ? decoderIgnoreBOM : decoder);
    return decoderInstance.force().decode(data);
}

// #region Pure JS Implementation

/**
 * Pure JS implementation of UTF-8 encoding.
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
 *
 * @param data - The BufferSource to decode.
 * @param options - Decoding options (same as TextDecoderOptions).
 * @returns Decoded string.
 */
function decodeUtf8Fallback(data: BufferSource, options: TextDecoderOptions): string {
    const bytes = bufferSourceToBytes(data);

    const { fatal, ignoreBOM } = options;
    let result = '';

    /**
     * Handle invalid byte sequence: throw if fatal, otherwise append replacement character.
     */
    function handleInvalid(): void {
        if (fatal) {
            throw new TypeError('The encoded data was not valid for encoding utf-8');
        }
        result += String.fromCharCode(0xfffd);
    }

    const { length } = bytes;
    let i = 0;
    while (i < length) {
        const byte1 = bytes[i];

        // 1-byte character (ASCII: 0x00-0x7F)
        if (byte1 < 0x80) {
            result += String.fromCodePoint(byte1);
            i += 1;
            continue;
        }

        // Determine bytes needed and validate leading byte
        let bytesNeeded: number;
        let codePoint: number;
        let lowerBoundary = 0x80;
        let upperBoundary = 0xbf;

        if (byte1 >= 0xc2 && byte1 < 0xe0) {
            // 2-byte character
            bytesNeeded = 2;
            codePoint = byte1 & 0x1f;
        } else if (byte1 >= 0xe0 && byte1 < 0xf0) {
            // 3-byte character
            bytesNeeded = 3;
            codePoint = byte1 & 0x0f;
            if (byte1 === 0xe0) lowerBoundary = 0xa0;
            if (byte1 === 0xed) upperBoundary = 0x9f;
        } else if (byte1 >= 0xf0 && byte1 < 0xf5) {
            // 4-byte character
            bytesNeeded = 4;
            codePoint = byte1 & 0x07;
            if (byte1 === 0xf0) lowerBoundary = 0x90;
            if (byte1 === 0xf4) upperBoundary = 0x8f;
        } else {
            // Invalid leading byte (0x80-0xC1, 0xF5-0xFF)
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

        result += String.fromCodePoint(codePoint);
        i += bytesNeeded;
    }

    // Strip BOM if not ignored and present at the beginning
    if (!ignoreBOM && result.startsWith(BOM)) {
        return result.slice(1);
    }

    return result;
}

// #endregion
