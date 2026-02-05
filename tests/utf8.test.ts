import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { decodeUtf8, encodeUtf8 } from '../src/mod.ts';

test('encode/decode between utf8 string and binary', () => {
    const data = 'happy-codec';
    expect(decodeUtf8(encodeUtf8(data))).toBe(data);
});

test('encodeUtf8/decodeUtf8 handles unicode correctly', () => {
    const data = 'Hello, 世界! 🎮';
    const encoded = encodeUtf8(data);
    expect(decodeUtf8(encoded)).toBe(data);
});

test('encodeUtf8/decodeUtf8 handles empty string', () => {
    expect(decodeUtf8(encodeUtf8(''))).toBe('');
});

test('encodeUtf8 returns Uint8Array', () => {
    const result = encodeUtf8('test');
    expect(result).toBeInstanceOf(Uint8Array);
});

describe('UTF-8 fallback implementation', () => {
    let encodeUtf8Fallback: (data: string) => Uint8Array<ArrayBuffer>;
    let decodeUtf8Fallback: (data: BufferSource) => string;
    let originalTextEncoder: typeof TextEncoder;
    let originalTextDecoder: typeof TextDecoder;

    beforeAll(async () => {
        // Save original constructors
        originalTextEncoder = globalThis.TextEncoder;
        originalTextDecoder = globalThis.TextDecoder;

        // Remove TextEncoder/TextDecoder to trigger fallback
        // @ts-expect-error - intentionally removing for testing
        delete globalThis.TextEncoder;
        // @ts-expect-error - intentionally removing for testing
        delete globalThis.TextDecoder;

        // Clear module cache to ensure fresh import without TextEncoder/TextDecoder
        vi.resetModules();

        // Dynamically import the utf8 module
        const utf8Module = await import('../src/lib/utf8.ts');
        encodeUtf8Fallback = utf8Module.encodeUtf8;
        decodeUtf8Fallback = utf8Module.decodeUtf8;
    });

    afterAll(() => {
        // Restore original constructors
        globalThis.TextEncoder = originalTextEncoder;
        globalThis.TextDecoder = originalTextDecoder;
    });

    test('encodeUtf8 converts ASCII string correctly without TextEncoder', () => {
        const str = 'Hello';
        const result = new Uint8Array(encodeUtf8Fallback(str));
        expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
    });

    test('encodeUtf8 handles empty string without TextEncoder', () => {
        const result = new Uint8Array(encodeUtf8Fallback(''));
        expect(result).toEqual(new Uint8Array([]));
    });

    test('encodeUtf8 encodes 2-byte UTF-8 characters without TextEncoder', () => {
        // 'é' (U+00E9) should be encoded as [0xC3, 0xA9]
        const str = 'é';
        const result = new Uint8Array(encodeUtf8Fallback(str));
        expect(result).toEqual(new Uint8Array([0xc3, 0xa9]));
    });

    test('encodeUtf8 encodes 3-byte UTF-8 characters (Chinese) without TextEncoder', () => {
        // '中' (U+4E2D) should be encoded as [0xE4, 0xB8, 0xAD]
        const str = '中';
        const result = new Uint8Array(encodeUtf8Fallback(str));
        expect(result).toEqual(new Uint8Array([0xe4, 0xb8, 0xad]));
    });

    test('encodeUtf8 encodes 4-byte UTF-8 characters (emoji) without TextEncoder', () => {
        // '😀' (U+1F600) should be encoded as [0xF0, 0x9F, 0x98, 0x80]
        const str = '😀';
        const result = new Uint8Array(encodeUtf8Fallback(str));
        expect(result).toEqual(new Uint8Array([0xf0, 0x9f, 0x98, 0x80]));
    });

    test('encodeUtf8 handles mixed characters without TextEncoder', () => {
        const str = 'A中😀';
        const result = new Uint8Array(encodeUtf8Fallback(str));
        // 'A' = [0x41], '中' = [0xE4, 0xB8, 0xAD], '😀' = [0xF0, 0x9F, 0x98, 0x80]
        expect(result).toEqual(new Uint8Array([0x41, 0xe4, 0xb8, 0xad, 0xf0, 0x9f, 0x98, 0x80]));
    });

    test('decodeUtf8 decodes ASCII correctly without TextDecoder', () => {
        const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer;
        expect(decodeUtf8Fallback(buffer)).toBe('Hello');
    });

    test('decodeUtf8 handles empty buffer without TextDecoder', () => {
        const buffer = new ArrayBuffer(0);
        expect(decodeUtf8Fallback(buffer)).toBe('');
    });

    test('decodeUtf8 decodes 2-byte UTF-8 characters without TextDecoder', () => {
        // 'é' (U+00E9) encoded as [0xC3, 0xA9]
        const buffer = new Uint8Array([0xc3, 0xa9]).buffer;
        expect(decodeUtf8Fallback(buffer)).toBe('é');
    });

    test('decodeUtf8 decodes 3-byte UTF-8 characters (Chinese) without TextDecoder', () => {
        // '中' (U+4E2D) encoded as [0xE4, 0xB8, 0xAD]
        const buffer = new Uint8Array([0xe4, 0xb8, 0xad]).buffer;
        expect(decodeUtf8Fallback(buffer)).toBe('中');
    });

    test('decodeUtf8 decodes 4-byte UTF-8 characters (emoji) without TextDecoder', () => {
        // '😀' (U+1F600) encoded as [0xF0, 0x9F, 0x98, 0x80]
        const buffer = new Uint8Array([0xf0, 0x9f, 0x98, 0x80]).buffer;
        expect(decodeUtf8Fallback(buffer)).toBe('😀');
    });

    test('decodeUtf8 decodes mixed characters without TextDecoder', () => {
        // 'A中😀'
        const buffer = new Uint8Array([0x41, 0xe4, 0xb8, 0xad, 0xf0, 0x9f, 0x98, 0x80]).buffer;
        expect(decodeUtf8Fallback(buffer)).toBe('A中😀');
    });

    test('decodeUtf8 throws on invalid UTF-8 byte sequence without TextDecoder', () => {
        // 0xF8 is invalid UTF-8 start byte (5-byte sequence, not valid in UTF-8)
        const buffer = new Uint8Array([0xf8, 0x80, 0x80, 0x80]).buffer;
        expect(() => decodeUtf8Fallback(buffer)).toThrow('Invalid UTF-8 byte sequence');
    });

    test('encodeUtf8 and decodeUtf8 round-trip without TextEncoder/TextDecoder', () => {
        const testCases = [
            'Hello, World!',
            '你好，世界！',
            '🎮🎲🎯',
            'Mixed: Hello 你好 🌍',
            '',
            'Special chars: \t\n\r',
        ];

        for (const original of testCases) {
            const encoded = encodeUtf8Fallback(original);
            const decoded = decodeUtf8Fallback(encoded);
            expect(decoded).toBe(original);
        }
    });
});
