/**
 * Hex encoding/decoding benchmark.
 * Compares lookup-table fallback with native APIs.
 *
 * **Encoding (`encodeHex`)**:
 * - Native `toHex()` wins at all sizes — always prefer native.
 *
 * **Decoding (`decodeHex`)**:
 * - Fallback (lookup table) wins at <= 128 hex chars (64 bytes).
 * - Native `fromHex()` wins at > 128 hex chars.
 *
 * Results above were determined under:
 *   Node.js v25.6.0, AMD EPYC 7K83, Linux x86_64.
 * These may differ on other JS engines or hardware — re-run to verify.
 */

import { bench, describe } from 'vitest';
import type { Uint8ArrayConstructorWithBase64Hex, Uint8ArrayWithBase64Hex } from '../src/internal/mod.ts';

// Save native implementations for comparison
const nativeToHex = (Uint8Array.prototype as unknown as Uint8ArrayWithBase64Hex).toHex;
const nativeFromHex = (Uint8Array as unknown as Uint8ArrayConstructorWithBase64Hex).fromHex;

// Remove native APIs to get fallback
// @ts-expect-error - intentionally removing for benchmark
delete Uint8Array.prototype.toHex;
// @ts-expect-error - intentionally removing for benchmark
delete Uint8Array.fromHex;

const { encodeHex, decodeHex } = await import('../src/mod.ts');

// ============================================================================
// Hex Encode - fallback vs native toHex
// ============================================================================

const encodeSizes = [1];

const encodeBuffers = encodeSizes.map(size => {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) bytes[i] = i & 0xFF;
    return bytes;
});

encodeSizes.forEach((size, i) => {
    describe(`Hex Encode - ${size} bytes`, () => {
        bench('fallback', () => {
            encodeHex(encodeBuffers[i]);
        });

        bench('native toHex', () => {
            nativeToHex.call(encodeBuffers[i]);
        });
    });
});

// ============================================================================
// Hex Decode - fallback vs native fromHex
// ============================================================================

const decodeSizes = [128, 130];

const decodeHexStrings = decodeSizes.map(size => {
    const bytes = new Uint8Array(size / 2);
    for (let i = 0; i < bytes.byteLength; i++) bytes[i] = i & 0xFF;
    return nativeToHex.call(bytes);
});

decodeSizes.forEach((size, i) => {
    describe(`Hex Decode - ${size / 2} bytes (${size} hex chars)`, () => {
        bench('fallback', () => {
            decodeHex(decodeHexStrings[i]);
        });

        bench('native fromHex', () => {
            nativeFromHex(decodeHexStrings[i]);
        });
    });
});
