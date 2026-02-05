/**
 * Base64 encoding/decoding benchmark.
 * Compares happy-codec implementation with native btoa/atob.
 *
 * Note: btoa/atob only support Latin1 characters, so for non-Latin1 strings
 * we need to use encodeUtf8/decodeUtf8 for conversion to ensure fair comparison.
 */

import { bench, describe } from 'vitest';
import { decodeBase64, decodeUtf8, encodeBase64, encodeUtf8 } from '../src/mod.ts';

// Test data - using non-Latin1 strings (Chinese and emoji)
const shortString = 'Hello, 世界!';
const mediumString = 'Hello, 世界! 🎮'.repeat(100);
const longString = 'The quick brown fox jumps over the lazy dog. 你好世界！🚀🎉'.repeat(1000);

// Pre-encoded base64 strings for decode benchmarks
const shortBase64 = encodeBase64(shortString);
const mediumBase64 = encodeBase64(mediumString);
const longBase64 = encodeBase64(longString);

// Binary data for testing BufferSource input
const shortBinaryBytes = new Uint8Array([72, 101, 108, 108, 111]);
const mediumBinaryBytes = new Uint8Array(1000).map((_, i) => i % 256);
const longBinaryBytes = new Uint8Array(10000).map((_, i) => i % 256);

// Pre-encoded base64 for binary data decode benchmarks
const shortBinaryBase64 = encodeBase64(shortBinaryBytes);
const mediumBinaryBase64 = encodeBase64(mediumBinaryBytes);
const longBinaryBase64 = encodeBase64(longBinaryBytes);

// Helper: Convert Uint8Array to Latin1 string for btoa
function uint8ArrayToLatin1(bytes: Uint8Array): string {
    return String.fromCharCode(...bytes);
}

// Helper: Convert Latin1 string to Uint8Array for atob result
function latin1ToUint8Array(str: string): Uint8Array<ArrayBuffer> {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i);
    }
    return bytes;
}

// Native base64 encode for non-Latin1 strings: string -> UTF-8 bytes -> Latin1 string -> btoa
function nativeEncodeBase64(str: string): string {
    const bytes = encodeUtf8(str);
    return btoa(uint8ArrayToLatin1(bytes));
}

// Native base64 decode for non-Latin1 strings: atob -> Latin1 string -> bytes -> UTF-8 string
function nativeDecodeBase64ToString(base64: string): string {
    const latin1 = atob(base64);
    const bytes = latin1ToUint8Array(latin1);
    return decodeUtf8(bytes);
}

// Native base64 decode to bytes: atob -> Latin1 string -> bytes
function nativeDecodeBase64ToBytes(base64: string): Uint8Array {
    return latin1ToUint8Array(atob(base64));
}

// ============================================================================
// String Encoding Benchmarks (non-Latin1 characters)
// ============================================================================

describe('Base64 Encode String - Short (non-Latin1)', () => {
    bench('happy-codec encodeBase64', () => {
        encodeBase64(shortString);
    });

    bench('native btoa (with UTF-8 conversion)', () => {
        nativeEncodeBase64(shortString);
    });
});

describe('Base64 Encode String - Medium (non-Latin1)', () => {
    bench('happy-codec encodeBase64', () => {
        encodeBase64(mediumString);
    });

    bench('native btoa (with UTF-8 conversion)', () => {
        nativeEncodeBase64(mediumString);
    });
});

describe('Base64 Encode String - Long (non-Latin1)', () => {
    bench('happy-codec encodeBase64', () => {
        encodeBase64(longString);
    });

    bench('native btoa (with UTF-8 conversion)', () => {
        nativeEncodeBase64(longString);
    });
});

// ============================================================================
// Binary Encoding Benchmarks
// ============================================================================

describe('Base64 Encode Bytes - Short', () => {
    bench('happy-codec encodeBase64', () => {
        encodeBase64(shortBinaryBytes);
    });

    bench('native btoa (with conversion)', () => {
        btoa(uint8ArrayToLatin1(shortBinaryBytes));
    });
});

describe('Base64 Encode Bytes - Medium', () => {
    bench('happy-codec encodeBase64', () => {
        encodeBase64(mediumBinaryBytes);
    });

    bench('native btoa (with conversion)', () => {
        btoa(uint8ArrayToLatin1(mediumBinaryBytes));
    });
});

describe('Base64 Encode Bytes - Long', () => {
    bench('happy-codec encodeBase64', () => {
        encodeBase64(longBinaryBytes);
    });

    bench('native btoa (with conversion)', () => {
        btoa(uint8ArrayToLatin1(longBinaryBytes));
    });
});

// ============================================================================
// String Decoding Benchmarks (decode to string, non-Latin1)
// ============================================================================

describe('Base64 Decode to String - Short (non-Latin1)', () => {
    bench('happy-codec decodeBase64 + decodeUtf8', () => {
        decodeUtf8(decodeBase64(shortBase64));
    });

    bench('native atob (with UTF-8 conversion)', () => {
        nativeDecodeBase64ToString(shortBase64);
    });
});

describe('Base64 Decode to String - Medium (non-Latin1)', () => {
    bench('happy-codec decodeBase64 + decodeUtf8', () => {
        decodeUtf8(decodeBase64(mediumBase64));
    });

    bench('native atob (with UTF-8 conversion)', () => {
        nativeDecodeBase64ToString(mediumBase64);
    });
});

describe('Base64 Decode to String - Long (non-Latin1)', () => {
    bench('happy-codec decodeBase64 + decodeUtf8', () => {
        decodeUtf8(decodeBase64(longBase64));
    });

    bench('native atob (with UTF-8 conversion)', () => {
        nativeDecodeBase64ToString(longBase64);
    });
});

// ============================================================================
// Binary Decoding Benchmarks (decode to bytes)
// ============================================================================

describe('Base64 Decode to Bytes - Short', () => {
    bench('happy-codec decodeBase64', () => {
        decodeBase64(shortBinaryBase64);
    });

    bench('native atob (with conversion)', () => {
        nativeDecodeBase64ToBytes(shortBinaryBase64);
    });
});

describe('Base64 Decode to Bytes - Medium', () => {
    bench('happy-codec decodeBase64', () => {
        decodeBase64(mediumBinaryBase64);
    });

    bench('native atob (with conversion)', () => {
        nativeDecodeBase64ToBytes(mediumBinaryBase64);
    });
});

describe('Base64 Decode to Bytes - Long', () => {
    bench('happy-codec decodeBase64', () => {
        decodeBase64(longBinaryBase64);
    });

    bench('native atob (with conversion)', () => {
        nativeDecodeBase64ToBytes(longBinaryBase64);
    });
});
