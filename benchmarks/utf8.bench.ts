/**
 * UTF-8 encoding/decoding benchmark.
 * Compares happy-codec fallback implementation with native TextEncoder/TextDecoder.
 *
 * Note: We need to remove TextEncoder/TextDecoder before importing the module
 * AND keep them removed during benchmark execution to force the use of fallback implementations.
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

// Test data - create these while TextEncoder is still removed
// We need to use the fallback to encode the test bytes
const shortString = 'Hello, 世界!';
const mediumString = 'Hello, 世界! 🎮'.repeat(100);
const longString = 'The quick brown fox jumps over the lazy dog. 你好世界！🚀🎉'.repeat(1000);

// Encode bytes using fallback (TextEncoder is still undefined)
const shortBytes = encodeUtf8(shortString);
const mediumBytes = encodeUtf8(mediumString);
const longBytes = encodeUtf8(longString);

// Restore native implementations for comparison benchmarks ONLY
// We need to keep TextEncoder/TextDecoder as undefined for the happy-codec tests
// So we create wrapper functions

const textEncoder = new NativeTextEncoder();
const textDecoder = new NativeTextDecoder('utf-8');

// Native wrappers that use the saved implementations
function nativeEncode(str: string): Uint8Array {
    return textEncoder.encode(str);
}

function nativeDecode(bytes: BufferSource): string {
    return textDecoder.decode(bytes);
}

// Note: TextEncoder/TextDecoder remain undefined here,
// so encodeUtf8/decodeUtf8 will use fallback implementations

describe('UTF-8 Encode - Short String', () => {
    bench('happy-codec encodeUtf8 (fallback)', () => {
        encodeUtf8(shortString);
    });

    bench('native TextEncoder', () => {
        nativeEncode(shortString);
    });
});

describe('UTF-8 Encode - Medium String', () => {
    bench('happy-codec encodeUtf8 (fallback)', () => {
        encodeUtf8(mediumString);
    });

    bench('native TextEncoder', () => {
        nativeEncode(mediumString);
    });
});

describe('UTF-8 Encode - Long String', () => {
    bench('happy-codec encodeUtf8 (fallback)', () => {
        encodeUtf8(longString);
    });

    bench('native TextEncoder', () => {
        nativeEncode(longString);
    });
});

describe('UTF-8 Decode - Short Bytes', () => {
    bench('happy-codec decodeUtf8 (fallback)', () => {
        decodeUtf8(shortBytes);
    });

    bench('native TextDecoder', () => {
        nativeDecode(shortBytes);
    });
});

describe('UTF-8 Decode - Medium Bytes', () => {
    bench('happy-codec decodeUtf8 (fallback)', () => {
        decodeUtf8(mediumBytes);
    });

    bench('native TextDecoder', () => {
        nativeDecode(mediumBytes);
    });
});

describe('UTF-8 Decode - Long Bytes', () => {
    bench('happy-codec decodeUtf8 (fallback)', () => {
        decodeUtf8(longBytes);
    });

    bench('native TextDecoder', () => {
        nativeDecode(longBytes);
    });
});
