/**
 * UTF-8 encoding/decoding benchmark.
 * Compares happy-codec fallback implementation with native TextEncoder/TextDecoder.
 *
 * Strategy: Use worst-case characters for fallback to find max size where fallback wins.
 *
 * - encodeUtf8: Use 3-byte CJK chars (max bytes.push calls per string.length)
 * - decodeUtf8: Use Latin1 chars (max str += calls per byteLength)
 */

import { bench, describe } from 'vitest';

// Save native implementations for comparison
const NativeTextEncoder = globalThis.TextEncoder;
const NativeTextDecoder = globalThis.TextDecoder;

// Remove native implementations to force fallback
// @ts-expect-error Intentionally removing for benchmark
globalThis.TextEncoder = undefined;
// @ts-expect-error Intentionally removing for benchmark
globalThis.TextDecoder = undefined;

// Import after removing native implementations to get fallback
const { decodeUtf8, encodeUtf8 } = await import('../src/mod.ts');

// Create native instances for comparison
const textEncoder = new NativeTextEncoder();
const textDecoder = new NativeTextDecoder('utf-8');

// Test characters - chosen to maximize fallback work per unit
const LATIN1_CHAR = 'a'; // 1 byte in UTF-8, best for decode (most str += per byte)
const CJK_CHAR = '中'; // 3 bytes in UTF-8, best for encode (most bytes.push per char)
const BYTE_COUNT_CJK = 3;

// Sizes to find crossover point
const encodeSizes = [21, 22]; // string.length
const decodeSizes = [3, 4, 5, 6, 7]; // byteLength

// Generate test data for encode - use 3-byte CJK chars (max bytes.push per string.length)
const encodeStrings = encodeSizes.map(charCount => CJK_CHAR.repeat(charCount));

// Generate test data for decode - use Latin1 chars (max str += per byteLength)
const decodeBytes = decodeSizes.map(byteCount => textEncoder.encode(LATIN1_CHAR.repeat(byteCount)));

// ============================================================================
// UTF-8 Encode - 3-byte CJK Characters (worst case for fallback)
// ============================================================================

encodeSizes.forEach((charCount, i) => {
    const byteCount = charCount * BYTE_COUNT_CJK; // 3 bytes per CJK char
    describe(`UTF-8 Encode - ${charCount} chars (${byteCount} bytes)`, () => {
        bench('fallback', () => {
            encodeUtf8(encodeStrings[i]);
        });

        bench('native TextEncoder', () => {
            textEncoder.encode(encodeStrings[i]);
        });
    });
});

// ============================================================================
// UTF-8 Decode - Latin1 Characters (worst case for fallback)
// ============================================================================

decodeSizes.forEach((byteCount, i) => {
    describe(`UTF-8 Decode - ${byteCount} bytes (${byteCount} chars)`, () => {
        bench('fallback', () => {
            decodeUtf8(decodeBytes[i]);
        });

        bench('native TextDecoder', () => {
            textDecoder.decode(decodeBytes[i]);
        });
    });
});
