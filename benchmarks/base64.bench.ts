/**
 * Base64 encoding/decoding benchmark.
 * Compares happy-codec fallback implementation with native APIs.
 *
 * **Encoding (`encodeBase64`)**:
 * - Native `toBase64()` wins at >= 21 bytes.
 * - Below 21 bytes, pure JS is faster due to native call overhead.
 *
 * **Decoding (`decodeBase64`)**:
 * - Native `fromBase64()` wins at >= 88 base64 chars (≈66 bytes).
 * - Below threshold, pure JS fallback is faster.
 *
 * Crossover points below (sizes) were determined under:
 *   Node.js v25.6.0, AMD EPYC 7K83, Linux x86_64.
 * These thresholds may differ on other JS engines or hardware — re-run to verify.
 */

import { bench, describe } from 'vitest';

// Save native implementations for comparison
const nativeFromBase64 = Uint8Array.fromBase64;
const nativeToBase64 = Uint8Array.prototype.toBase64;

// Remove native APIs to get fallback
// @ts-expect-error - intentionally removing for benchmark
delete Uint8Array.fromBase64;
// @ts-expect-error - intentionally removing for benchmark
delete Uint8Array.prototype.toBase64;

const { encodeBase64, decodeBase64 } = await import('../src/mod.ts');

// ============================================================================
// Base64 Encode - fallback vs native toBase64
// ============================================================================

const encodeSizes = [20, 21];

const encodeBuffers = encodeSizes.map(size => {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) bytes[i] = i & 0xFF;
    return bytes;
});

encodeSizes.forEach((size, i) => {
    describe(`Base64 Encode - ${size} bytes`, () => {
        bench('fallback', () => {
            encodeBase64(encodeBuffers[i]);
        });

        bench('native toBase64', () => {
            nativeToBase64.call(encodeBuffers[i]);
        });
    });
});

// ============================================================================
// Base64 Decode - fallback vs native fromBase64
// ============================================================================

const decodeSizes = [84, 88];

const base64Strings = decodeSizes.map(size => {
    const byteCount = (size * 3) / 4;
    return encodeBase64('a'.repeat(byteCount));
});

decodeSizes.forEach((_size, i) => {
    describe(`Base64 Decode - ${base64Strings[i].length} chars`, () => {
        bench('fallback', () => {
            decodeBase64(base64Strings[i]);
        });

        bench('native fromBase64', () => {
            nativeFromBase64(base64Strings[i]);
        });
    });
});
