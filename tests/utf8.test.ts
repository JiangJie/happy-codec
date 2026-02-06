import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { decodeUtf8, encodeUtf8 } from '../src/mod.ts';

// Native TextEncoder/TextDecoder for comparison
const nativeEncoder = new TextEncoder();
const nativeDecoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: false });
const nativeDecoderIgnoreBOM = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
const nativeFatalDecoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false });
const nativeFatalDecoderIgnoreBOM = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

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

test('decodeUtf8 replaces invalid bytes with U+FFFD by default', () => {
    // 0xFF is invalid UTF-8 byte
    const buffer = new Uint8Array([0xff, 0xfe]);
    expect(decodeUtf8(buffer)).toBe('\ufffd\ufffd');
});

test('decodeUtf8 throws on invalid bytes when fatal is true', () => {
    const buffer = new Uint8Array([0xff, 0xfe]);
    expect(() => decodeUtf8(buffer, { fatal: true })).toThrow();
});

test('decodeUtf8 strips BOM by default', () => {
    // UTF-8 BOM: EF BB BF + 'Hi'
    const withBOM = new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x69]);
    expect(decodeUtf8(withBOM)).toBe('Hi');
});

test('decodeUtf8 keeps BOM when ignoreBOM is true', () => {
    const withBOM = new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x69]);
    expect(decodeUtf8(withBOM, { ignoreBOM: true })).toBe('\ufeffHi');
});

test('decodeUtf8 handles data without BOM correctly', () => {
    const noBOM = new Uint8Array([0x48, 0x69]);
    expect(decodeUtf8(noBOM)).toBe('Hi');
    expect(decodeUtf8(noBOM, { ignoreBOM: true })).toBe('Hi');
});

test('decodeUtf8 with fatal and ignoreBOM combination', () => {
    // Valid data with BOM
    const withBOM = new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x69]);
    expect(decodeUtf8(withBOM, { fatal: true, ignoreBOM: true })).toBe('\ufeffHi');

    // Invalid data should throw
    const invalid = new Uint8Array([0xff]);
    expect(() => decodeUtf8(invalid, { fatal: true, ignoreBOM: true })).toThrow();
});

describe('UTF-8 fallback implementation', () => {
    let encodeUtf8Fallback: (data: string) => Uint8Array<ArrayBuffer>;
    let decodeUtf8Fallback: (data: BufferSource, options?: TextDecoderOptions) => string;
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

    test('decodeUtf8 replaces invalid UTF-8 byte sequence with U+FFFD without TextDecoder', () => {
        // 0xF8 is invalid UTF-8 start byte (5-byte sequence, not valid in UTF-8)
        const buffer = new Uint8Array([0xf8, 0x80, 0x80, 0x80]).buffer;
        expect(decodeUtf8Fallback(buffer)).toBe('\ufffd\ufffd\ufffd\ufffd');
    });

    test('decodeUtf8 throws on invalid UTF-8 byte sequence when fatal is true without TextDecoder', () => {
        const buffer = new Uint8Array([0xf8, 0x80, 0x80, 0x80]).buffer;
        expect(() => decodeUtf8Fallback(buffer, { fatal: true })).toThrow('The encoded data was not valid for encoding utf-8');
    });

    test('decodeUtf8 handles truncated multi-byte sequence without TextDecoder', () => {
        // 0xE4 starts a 3-byte sequence but only 1 continuation byte follows
        // TextDecoder outputs one replacement character for the entire truncated sequence
        const buffer = new Uint8Array([0xe4, 0xb8]).buffer;
        expect(decodeUtf8Fallback(buffer)).toBe('\ufffd');
    });

    test('decodeUtf8 throws on truncated multi-byte sequence when fatal is true without TextDecoder', () => {
        // 0xF0 starts a 4-byte sequence but only 2 continuation bytes follow
        const buffer = new Uint8Array([0xf0, 0x9f, 0x98]).buffer;
        expect(() => decodeUtf8Fallback(buffer, { fatal: true })).toThrow('The encoded data was not valid for encoding utf-8');
    });

    test('decodeUtf8 handles invalid continuation byte without TextDecoder', () => {
        // 0xE4 starts a 3-byte sequence, but 0x00 is not a valid continuation byte (should be 0x80-0xBF)
        const buffer = new Uint8Array([0xe4, 0x00, 0xad]).buffer;
        expect(decodeUtf8Fallback(buffer)).toBe('\ufffd\x00\ufffd');
    });

    test('decodeUtf8 throws on invalid continuation byte when fatal is true without TextDecoder', () => {
        // 0xC3 starts a 2-byte sequence, but 0xFF is not a valid continuation byte
        const buffer = new Uint8Array([0xc3, 0xff]).buffer;
        expect(() => decodeUtf8Fallback(buffer, { fatal: true })).toThrow('The encoded data was not valid for encoding utf-8');
    });

    test('decodeUtf8 handles overlong 3-byte sequence (0xE0) without TextDecoder', () => {
        // 0xE0 requires second byte >= 0xA0 to avoid overlong encoding
        // 0xE0 0x80 0x80 would encode U+0000 which should be 1 byte
        const buffer = new Uint8Array([0xe0, 0x80, 0x80]).buffer;
        expect(decodeUtf8Fallback(buffer)).toBe('\ufffd\ufffd\ufffd');
    });

    test('decodeUtf8 handles surrogate range (0xED) without TextDecoder', () => {
        // 0xED requires second byte <= 0x9F to avoid surrogate pairs (U+D800-U+DFFF)
        // 0xED 0xA0 0x80 would encode U+D800 which is invalid
        const buffer = new Uint8Array([0xed, 0xa0, 0x80]).buffer;
        expect(decodeUtf8Fallback(buffer)).toBe('\ufffd\ufffd\ufffd');
    });

    test('decodeUtf8 handles overlong 4-byte sequence (0xF0) without TextDecoder', () => {
        // 0xF0 requires second byte >= 0x90 to avoid overlong encoding
        // 0xF0 0x80 0x80 0x80 would encode U+0000 which should be 1 byte
        const buffer = new Uint8Array([0xf0, 0x80, 0x80, 0x80]).buffer;
        expect(decodeUtf8Fallback(buffer)).toBe('\ufffd\ufffd\ufffd\ufffd');
    });

    test('decodeUtf8 handles out of range 4-byte sequence (0xF4) without TextDecoder', () => {
        // 0xF4 requires second byte <= 0x8F to stay within U+10FFFF
        // 0xF4 0x90 0x80 0x80 would encode U+110000 which is out of Unicode range
        const buffer = new Uint8Array([0xf4, 0x90, 0x80, 0x80]).buffer;
        expect(decodeUtf8Fallback(buffer)).toBe('\ufffd\ufffd\ufffd\ufffd');
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

    test('decodeUtf8 strips BOM by default without TextDecoder', () => {
        // UTF-8 BOM: EF BB BF + 'Hi'
        const withBOM = new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x69]).buffer;
        expect(decodeUtf8Fallback(withBOM)).toBe('Hi');
    });

    test('decodeUtf8 keeps BOM when ignoreBOM is true without TextDecoder', () => {
        const withBOM = new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x69]).buffer;
        expect(decodeUtf8Fallback(withBOM, { ignoreBOM: true })).toBe('\ufeffHi');
    });

    test('decodeUtf8 handles data without BOM correctly without TextDecoder', () => {
        const noBOM = new Uint8Array([0x48, 0x69]).buffer;
        expect(decodeUtf8Fallback(noBOM)).toBe('Hi');
        expect(decodeUtf8Fallback(noBOM, { ignoreBOM: true })).toBe('Hi');
    });

    test('fallback encodeUtf8 matches native TextEncoder', () => {
        const testCases = [
            '',
            'Hello',
            'é',
            '中文',
            '😀🎮',
            'Mixed: Hello 你好 🌍 café',
            '\t\n\r',
            '\x00\x7f', // ASCII boundaries
            '\u0080\u07ff', // 2-byte boundaries
            '\u0800\uffff', // 3-byte boundaries
            '\u{10000}\u{10ffff}', // 4-byte boundaries
        ];

        for (const str of testCases) {
            const fallbackResult = encodeUtf8Fallback(str);
            const nativeResult = nativeEncoder.encode(str);
            expect(new Uint8Array(fallbackResult)).toEqual(nativeResult);
        }
    });

    test('fallback decodeUtf8 matches native TextDecoder for valid data', () => {
        const testCases = [
            new Uint8Array([]),
            new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]), // Hello
            new Uint8Array([0xc3, 0xa9]), // é
            new Uint8Array([0xe4, 0xb8, 0xad, 0xe6, 0x96, 0x87]), // 中文
            new Uint8Array([0xf0, 0x9f, 0x98, 0x80]), // 😀
            new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x69]), // BOM + Hi
        ];

        for (const bytes of testCases) {
            // Test all option combinations
            expect(decodeUtf8Fallback(bytes)).toBe(nativeDecoder.decode(bytes));
            expect(decodeUtf8Fallback(bytes, { ignoreBOM: true })).toBe(nativeDecoderIgnoreBOM.decode(bytes));
            expect(decodeUtf8Fallback(bytes, { fatal: true })).toBe(nativeFatalDecoder.decode(bytes));
            expect(decodeUtf8Fallback(bytes, { fatal: true, ignoreBOM: true })).toBe(nativeFatalDecoderIgnoreBOM.decode(bytes));
        }
    });

    test('fallback decodeUtf8 matches native TextDecoder for invalid data (non-fatal)', () => {
        const testCases = [
            new Uint8Array([0xff]), // Invalid byte
            new Uint8Array([0xc3]), // Truncated 2-byte
            new Uint8Array([0xe4, 0xb8]), // Truncated 3-byte
            new Uint8Array([0xf0, 0x9f, 0x98]), // Truncated 4-byte
            new Uint8Array([0xc3, 0x00]), // Invalid continuation
            new Uint8Array([0xe0, 0x80, 0x80]), // Overlong
            new Uint8Array([0xed, 0xa0, 0x80]), // Surrogate
        ];

        for (const bytes of testCases) {
            expect(decodeUtf8Fallback(bytes)).toBe(nativeDecoder.decode(bytes));
            expect(decodeUtf8Fallback(bytes, { ignoreBOM: true })).toBe(nativeDecoderIgnoreBOM.decode(bytes));
        }
    });

    test('fallback decodeUtf8 throws like native TextDecoder for invalid data (fatal)', () => {
        const testCases = [
            new Uint8Array([0xff]),
            new Uint8Array([0xc3]),
            new Uint8Array([0xe0, 0x80, 0x80]),
        ];

        for (const bytes of testCases) {
            // Both should throw
            expect(() => decodeUtf8Fallback(bytes, { fatal: true })).toThrow();
            expect(() => nativeFatalDecoder.decode(bytes)).toThrow();
        }
    });
});
