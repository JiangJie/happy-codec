/**
 * Base64 decoding benchmark.
 * Compares happy-codec fallback implementation with native atob.
 *
 * Note: encodeBase64 always uses pure JS (faster than native btoa), no benchmark needed.
 * decodeBase64 uses atob if available, this benchmark finds the crossover point.
 *
 * Crossover points below (sizes) were determined under:
 *   Node.js v25.6.0, AMD EPYC 7K83, Linux x86_64.
 * These thresholds may differ on other JS engines or hardware — re-run to verify.
 */

import { bench, describe } from 'vitest';

// Save native atob for comparison
const nativeAtob = globalThis.atob;

// Remove atob to force fallback
// @ts-expect-error Intentionally removing for benchmark
globalThis.atob = undefined;

// Import after removing atob to get fallback
const { decodeBase64, encodeBase64 } = await import('../src/mod.ts');

// Helper: Convert Latin1 string to Uint8Array
function latin1ToUint8Array(str: string): Uint8Array<ArrayBuffer> {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i);
    }
    return bytes;
}

// Test sizes: base64 string length (data.length)
const sizes = [124, 128];

// Generate test data - base64 strings with exact lengths
// Base64 encodes 3 bytes to 4 chars, so we need (size * 3 / 4) bytes to get size chars
const base64Strings = sizes.map(size => {
    const byteCount = (size * 3) / 4;
    return encodeBase64('a'.repeat(byteCount));
});

// ============================================================================
// Base64 Decode - Find crossover point by data.length
// ============================================================================

sizes.forEach((_size, i) => {
    describe(`Base64 Decode - ${base64Strings[i].length} chars`, () => {
        bench('fallback', () => {
            decodeBase64(base64Strings[i]);
        });

        bench('native atob', () => {
            latin1ToUint8Array(nativeAtob(base64Strings[i]));
        });
    });
});
