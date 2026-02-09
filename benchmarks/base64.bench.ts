/**
 * Base64 encoding/decoding benchmark.
 * Compares happy-codec fallback implementation with native APIs.
 *
 * **Encoding (`encodeBase64`)**:
 * - Fallback (pure JS) wins at <= 18 bytes.
 * - Native `toBase64()` wins at > 18 bytes.
 *
 * **Decoding (`decodeBase64`)**:
 * - Fallback (pure JS) wins at <= 84 base64 chars (≈63 bytes).
 * - Native `fromBase64()` wins at > 84 base64 chars.
 *
 * Results above were determined under:
 *   Node.js v25.6.0, AMD EPYC 7K83, Linux x86_64.
 * These may differ on other JS engines or hardware — re-run to verify.
 */

import { bench, describe } from 'vitest';
import type { Uint8ArrayConstructorWithBase64Hex, Uint8ArrayWithBase64Hex } from '../src/internal/mod.ts';

// Save native implementations for comparison
const nativeFromBase64 = (Uint8Array as unknown as Uint8ArrayConstructorWithBase64Hex).fromBase64;
const nativeToBase64 = (Uint8Array.prototype as unknown as Uint8ArrayWithBase64Hex).toBase64;

// Remove native APIs to get fallback
// @ts-expect-error - intentionally removing for benchmark
delete Uint8Array.fromBase64;
// @ts-expect-error - intentionally removing for benchmark
delete Uint8Array.prototype.toBase64;

const { encodeBase64, decodeBase64 } = await import('../src/mod.ts');

// ============================================================================
// Base64 Encode - fallback vs native toBase64
// ============================================================================

const encodeSizes = [16, 18, 19, 20];

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

const decodeSizes = [80, 84, 88];

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
