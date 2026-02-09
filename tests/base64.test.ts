import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { decodeBase64, encodeBase64, encodeUtf8 } from '../src/mod.ts';
import type { DecodeBase64Options, EncodeBase64Options } from '../src/mod.ts';

test('encode/decode string to/from base64', () => {
    const data = 'happy-codec';
    const encodedData = 'aGFwcHktY29kZWM=';
    const data1 = '中文';
    const encodedData1 = '5Lit5paH';

    expect(encodeBase64(data)).toBe(encodedData);
    expect(new TextDecoder().decode(decodeBase64(encodedData))).toBe(data);

    expect(encodeBase64(data1)).toBe(encodedData1);
    expect(new TextDecoder().decode(decodeBase64(encodedData1))).toBe(data1);
});

test('encodeBase64 encodes Uint8Array to base64 string', () => {
    // Test with simple ASCII data
    const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    expect(encodeBase64(data)).toBe('SGVsbG8=');

    // Test with empty array
    expect(encodeBase64(new Uint8Array([]))).toBe('');

    // Test with single byte
    expect(encodeBase64(new Uint8Array([65]))).toBe('QQ==');

    // Test with two bytes
    expect(encodeBase64(new Uint8Array([65, 66]))).toBe('QUI=');

    // Test with three bytes (no padding needed)
    expect(encodeBase64(new Uint8Array([65, 66, 67]))).toBe('QUJD');
});

test('encodeBase64 encodes ArrayBuffer to base64 string', () => {
    const buffer = new ArrayBuffer(5);
    const view = new Uint8Array(buffer);
    view.set([72, 101, 108, 108, 111]); // "Hello"
    expect(encodeBase64(buffer)).toBe('SGVsbG8=');
});

test('decodeBase64 decodes base64 string to Uint8Array', () => {
    // Test with simple ASCII data
    const result = decodeBase64('SGVsbG8=');
    expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));

    // Test with empty string
    expect(decodeBase64('')).toEqual(new Uint8Array([]));

    // Test with single byte (double padding)
    expect(decodeBase64('QQ==')).toEqual(new Uint8Array([65]));

    // Test with two bytes (single padding)
    expect(decodeBase64('QUI=')).toEqual(new Uint8Array([65, 66]));

    // Test with three bytes (no padding)
    expect(decodeBase64('QUJD')).toEqual(new Uint8Array([65, 66, 67]));
});

test('base64 round-trip conversion', () => {
    const originalData = encodeUtf8('Hello, 世界! 🎮');
    const encoded = encodeBase64(originalData);
    const decoded = decodeBase64(encoded);

    expect(decoded).toEqual(originalData);
});

test('encodeBase64 with DataView', () => {
    const buffer = new ArrayBuffer(8);
    const fullView = new Uint8Array(buffer);
    fullView.set([0, 0, 72, 101, 108, 108, 111, 0]);

    // Create a DataView with offset
    const dataView = new DataView(buffer, 2, 5);
    expect(encodeBase64(dataView)).toBe('SGVsbG8=');
});

test('base64 handles binary data correctly', () => {
    // Test with all possible byte values (0-255)
    const allBytes = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
        allBytes[i] = i;
    }

    const encoded = encodeBase64(allBytes);
    const decoded = decodeBase64(encoded);

    expect(decoded).toEqual(allBytes);
});

test('encodeBase64 encodes string to base64', () => {
    expect(encodeBase64('happy-codec')).toBe('aGFwcHktY29kZWM=');
    expect(encodeBase64('中文')).toBe('5Lit5paH');
    expect(encodeBase64('')).toBe('');
});

test('decodeBase64 decodes base64 to Uint8Array', () => {
    expect(new TextDecoder().decode(decodeBase64('aGFwcHktY29kZWM='))).toBe('happy-codec');
    expect(new TextDecoder().decode(decodeBase64('5Lit5paH'))).toBe('中文');
    expect(decodeBase64('')).toEqual(new Uint8Array([]));
});

test('base64 round-trip conversion with string', () => {
    const testStrings = ['Hello, World!', '中文测试', 'emoji 🎮🎯', ''];
    for (const str of testStrings) {
        expect(new TextDecoder().decode(decodeBase64(encodeBase64(str)))).toBe(str);
    }
});

test('encodeBase64 supports DataSource types', () => {
    // String input
    expect(encodeBase64('Hello')).toBe('SGVsbG8=');

    // Uint8Array input
    expect(encodeBase64(new Uint8Array([72, 101, 108, 108, 111]))).toBe('SGVsbG8=');

    // ArrayBuffer input
    const buffer = new ArrayBuffer(5);
    new Uint8Array(buffer).set([72, 101, 108, 108, 111]);
    expect(encodeBase64(buffer)).toBe('SGVsbG8=');
});

describe('encodeBase64 with options', () => {
    test('alphabet: base64url uses - and _ instead of + and /', () => {
        // [0xfb, 0xef, 0xbf] encodes to '+++/' in standard base64
        const data = new Uint8Array([0xfb, 0xef, 0xbf]);
        const standard = encodeBase64(data);
        const url = encodeBase64(data, { alphabet: 'base64url' });

        expect(standard).toBe('+++/');
        expect(url).toBe('---_');
        expect(url).not.toContain('+');
        expect(url).not.toContain('/');
    });

    test('omitPadding: true strips trailing = padding', () => {
        // 1 byte -> 2 base64 chars + ==
        expect(encodeBase64(new Uint8Array([65]), { omitPadding: true })).toBe('QQ');
        // 2 bytes -> 3 base64 chars + =
        expect(encodeBase64(new Uint8Array([65, 66]), { omitPadding: true })).toBe('QUI');
        // 3 bytes -> 4 base64 chars, no padding needed
        expect(encodeBase64(new Uint8Array([65, 66, 67]), { omitPadding: true })).toBe('QUJD');
    });

    test('omitPadding: false (default) keeps padding', () => {
        expect(encodeBase64(new Uint8Array([65]))).toBe('QQ==');
        expect(encodeBase64(new Uint8Array([65, 66]))).toBe('QUI=');
    });

    test('combined: base64url + omitPadding', () => {
        const data = new Uint8Array([0xfb, 0xef]); // '++8=' in standard
        const result = encodeBase64(data, { alphabet: 'base64url', omitPadding: true });
        expect(result).toBe('--8');
        expect(result).not.toContain('+');
        expect(result).not.toContain('/');
        expect(result).not.toContain('=');
    });

    test('empty input returns empty string regardless of options', () => {
        expect(encodeBase64(new Uint8Array([]), { alphabet: 'base64url', omitPadding: true })).toBe('');
    });
});

describe('decodeBase64 with options', () => {
    test('alphabet: base64url decodes - and _ correctly', () => {
        // Encode with base64url, then decode with base64url
        const data = new Uint8Array([0xfb, 0xef, 0xbf]);
        const encoded = encodeBase64(data, { alphabet: 'base64url' });
        expect(encoded).toBe('---_');
        const decoded = decodeBase64(encoded, { alphabet: 'base64url' });
        expect(decoded).toEqual(data);
    });

    test('alphabet: base64url rejects + and / characters', () => {
        // '+++/' is valid standard base64 but contains + and / which are invalid in base64url
        expect(() => decodeBase64('+++/', { alphabet: 'base64url' })).toThrow(SyntaxError);
    });

    test('alphabet: base64 rejects - and _ characters', () => {
        expect(() => decodeBase64('---_', { alphabet: 'base64' })).toThrow(SyntaxError);
    });

    test('lastChunkHandling: loose (default) accepts unpadded input', () => {
        // 'QQ' without padding -> should decode to [65]
        expect(decodeBase64('QQ')).toEqual(new Uint8Array([65]));
        expect(decodeBase64('QUI')).toEqual(new Uint8Array([65, 66]));
    });

    test('lastChunkHandling: strict throws on missing padding', () => {
        expect(() => decodeBase64('QQ', { lastChunkHandling: 'strict' })).toThrow('The base64 input terminates with a single character, excluding padding (=)');
        expect(() => decodeBase64('QUI', { lastChunkHandling: 'strict' })).toThrow('The base64 input terminates with a single character, excluding padding (=)');
    });

    test('lastChunkHandling: strict accepts correctly padded input', () => {
        expect(decodeBase64('QQ==', { lastChunkHandling: 'strict' })).toEqual(new Uint8Array([65]));
        expect(decodeBase64('QUI=', { lastChunkHandling: 'strict' })).toEqual(new Uint8Array([65, 66]));
        expect(decodeBase64('QUJD', { lastChunkHandling: 'strict' })).toEqual(new Uint8Array([65, 66, 67]));
    });

    test('lastChunkHandling: strict validates padding bits are zero', () => {
        // 'QR==' — 'R' is index 17 (0b010001), lower 4 bits = 0b0001 != 0
        expect(() => decodeBase64('QR==', { lastChunkHandling: 'strict' })).toThrow('The base64 input terminates with non-zero padding bits');
        // 'QUJ=' — 'J' is index 9 (0b001001), lower 2 bits = 0b01 != 0
        expect(() => decodeBase64('QUJ=', { lastChunkHandling: 'strict' })).toThrow('The base64 input terminates with non-zero padding bits');
    });

    test('lastChunkHandling: strict validates padding bits with base64url', () => {
        // Same validation with base64url alphabet
        // 'QR==' with base64url: 'R' is index 17, lower 4 bits != 0
        expect(() => decodeBase64('QR==', { alphabet: 'base64url', lastChunkHandling: 'strict' })).toThrow('The base64 input terminates with non-zero padding bits');
        // 'QUJ=' with base64url: 'J' is index 9, lower 2 bits != 0
        expect(() => decodeBase64('QUJ=', { alphabet: 'base64url', lastChunkHandling: 'strict' })).toThrow('The base64 input terminates with non-zero padding bits');
    });

    test('lastChunkHandling: stop-before-partial ignores incomplete chunk', () => {
        // 'QUJDQQ' = 4 full chars + 2 extra unpadded chars
        // Should only decode the first 4 chars ('QUJD' = [65,66,67])
        expect(decodeBase64('QUJDQQ', { lastChunkHandling: 'stop-before-partial' })).toEqual(new Uint8Array([65, 66, 67]));
    });

    test('lastChunkHandling: stop-before-partial decodes padded final chunks', () => {
        // 'QUJDQQ==' has proper padding -> decode all
        expect(decodeBase64('QUJDQQ==', { lastChunkHandling: 'stop-before-partial' })).toEqual(new Uint8Array([65, 66, 67, 65]));
    });

    test('round-trip with base64url alphabet', () => {
        const data = new Uint8Array(256);
        for (let i = 0; i < 256; i++) data[i] = i;
        const encoded = encodeBase64(data, { alphabet: 'base64url' });
        const decoded = decodeBase64(encoded, { alphabet: 'base64url' });
        expect(decoded).toEqual(data);
    });

    test('round-trip with omitPadding + loose decoding', () => {
        const data = new Uint8Array([1, 2]);
        const encoded = encodeBase64(data, { omitPadding: true });
        const decoded = decodeBase64(encoded);
        expect(decoded).toEqual(data);
    });

    test('empty string returns empty array regardless of options', () => {
        expect(decodeBase64('', { alphabet: 'base64url', lastChunkHandling: 'strict' })).toEqual(new Uint8Array([]));
    });
});

describe('Base64 decodeBase64 fallback implementation', () => {
    let decodeBase64Fallback: (data: string, options?: DecodeBase64Options) => Uint8Array<ArrayBuffer>;
    let encodeBase64Fallback: (data: string | BufferSource, options?: EncodeBase64Options) => string;
    let originalFromBase64: typeof Uint8Array.fromBase64;
    let originalToBase64: typeof Uint8Array.prototype.toBase64;

    beforeAll(async () => {
        // Save originals
        originalFromBase64 = Uint8Array.fromBase64;
        originalToBase64 = Uint8Array.prototype.toBase64;

        // Remove native APIs to trigger fallback
        // @ts-expect-error - intentionally removing for testing
        delete Uint8Array.fromBase64;
        // @ts-expect-error - intentionally removing for testing
        delete Uint8Array.prototype.toBase64;

        // Clear module cache to ensure fresh import without native APIs
        vi.resetModules();

        // Dynamically import the base64 module
        const base64Module = await import('../src/lib/base64.ts');
        decodeBase64Fallback = base64Module.decodeBase64;
        encodeBase64Fallback = base64Module.encodeBase64;
    });

    afterAll(() => {
        // Restore originals
        Uint8Array.fromBase64 = originalFromBase64;
        Uint8Array.prototype.toBase64 = originalToBase64;
    });

    test('decodeBase64 decodes simple ASCII data via fallback', () => {
        const result = decodeBase64Fallback('SGVsbG8=');
        expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111])); // "Hello"
    });

    test('decodeBase64 handles empty string via fallback', () => {
        const result = decodeBase64Fallback('');
        expect(result).toEqual(new Uint8Array([]));
    });

    test('decodeBase64 handles single byte (double padding) via fallback', () => {
        const result = decodeBase64Fallback('QQ==');
        expect(result).toEqual(new Uint8Array([65])); // 'A'
    });

    test('decodeBase64 handles two bytes (single padding) via fallback', () => {
        const result = decodeBase64Fallback('QUI=');
        expect(result).toEqual(new Uint8Array([65, 66])); // 'AB'
    });

    test('decodeBase64 handles three bytes (no padding) via fallback', () => {
        const result = decodeBase64Fallback('QUJD');
        expect(result).toEqual(new Uint8Array([65, 66, 67])); // 'ABC'
    });

    test('decodeBase64 handles binary data via fallback', () => {
        // Test with all possible byte values (0-255)
        const allBytes = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            allBytes[i] = i;
        }

        // Encode using encodeBase64 (which uses pure JS)
        const encoded = encodeBase64(allBytes);
        const decoded = decodeBase64Fallback(encoded);

        expect(decoded).toEqual(allBytes);
    });

    test('decodeBase64 decodes UTF-8 encoded Chinese characters via fallback', () => {
        // '中文' encoded as UTF-8 then Base64
        const result = decodeBase64Fallback('5Lit5paH');
        expect(new TextDecoder().decode(result)).toBe('中文');
    });

    test('decodeBase64 decodes UTF-8 encoded emoji via fallback', () => {
        // '🎮' encoded as UTF-8 then Base64
        const result = decodeBase64Fallback('8J+OrQ==');
        expect(new TextDecoder().decode(result)).toBe('🎭');
    });

    test('decodeBase64 round-trip with encodeBase64 via fallback', () => {
        const testCases = [
            new Uint8Array([0, 1, 2, 3, 4, 5]),
            new Uint8Array([255, 254, 253, 252]),
            new Uint8Array([72, 101, 108, 108, 111, 44, 32, 87, 111, 114, 108, 100, 33]), // "Hello, World!"
            new Uint8Array([]),
        ];

        for (const original of testCases) {
            const encoded = encodeBase64(original);
            const decoded = decodeBase64Fallback(encoded);
            expect(decoded).toEqual(original);
        }
    });

    test('decodeBase64 throws on invalid length (length % 4 === 1) via fallback', () => {
        // length 1, 5, 9 are invalid
        expect(() => decodeBase64Fallback('a')).toThrow(SyntaxError);
        expect(() => decodeBase64Fallback('a')).toThrow('The base64 input terminates with a single character, excluding padding (=)');
        expect(() => decodeBase64Fallback('abcde')).toThrow(SyntaxError);
        expect(() => decodeBase64Fallback('abcdefghi')).toThrow(SyntaxError);
    });

    test('decodeBase64 throws on invalid characters via fallback', () => {
        expect(() => decodeBase64Fallback('@#$%')).toThrow(SyntaxError);
        expect(() => decodeBase64Fallback('@#$%')).toThrow('Found a character that cannot be part of a valid base64 string');
        expect(() => decodeBase64Fallback('AA!A')).toThrow(SyntaxError);
        expect(() => decodeBase64Fallback('====')).toThrow(SyntaxError);
    });

    test('decodeBase64 handles non-padded base64 (length % 4 !== 0) via fallback', () => {
        // length 2: 'ab' -> 1 byte
        const result2 = decodeBase64Fallback('YWI');  // 'ab' without padding, should decode to 'ab' first 2 chars
        expect(result2.length).toBe(2);

        // length 3: 'abc' -> 2 bytes
        const result3 = decodeBase64Fallback('YWJj'); // 'abc' (4 chars, no padding needed)
        expect(result3.length).toBe(3);

        expect(decodeBase64Fallback('YWI')).toEqual(new Uint8Array([97, 98])); // 'ab'
        expect(decodeBase64Fallback('YWJj')).toEqual(new Uint8Array([97, 98, 99])); // 'abc'
    });

    test('encodeBase64 fallback encodes correctly without toBase64', () => {
        expect(encodeBase64Fallback('Hello')).toBe('SGVsbG8=');
        expect(encodeBase64Fallback('happy-codec')).toBe('aGFwcHktY29kZWM=');
        expect(encodeBase64Fallback('')).toBe('');
    });

    test('encodeBase64 fallback handles binary data without toBase64', () => {
        const allBytes = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            allBytes[i] = i;
        }
        const encoded = encodeBase64Fallback(allBytes);
        const decoded = decodeBase64Fallback(encoded);
        expect(decoded).toEqual(allBytes);
    });

    // Options tests for fallback path
    test('fallback: encodeBase64 with base64url alphabet', () => {
        const data = new Uint8Array([0xfb, 0xef, 0xbf]);
        const standard = encodeBase64Fallback(data);
        const url = encodeBase64Fallback(data, { alphabet: 'base64url' });
        expect(standard).toBe('+++/');
        expect(url).toBe('---_');
    });

    test('fallback: encodeBase64 with omitPadding', () => {
        expect(encodeBase64Fallback(new Uint8Array([65]), { omitPadding: true })).toBe('QQ');
        expect(encodeBase64Fallback(new Uint8Array([65, 66]), { omitPadding: true })).toBe('QUI');
        expect(encodeBase64Fallback(new Uint8Array([65, 66, 67]), { omitPadding: true })).toBe('QUJD');
    });

    test('fallback: decodeBase64 with base64url alphabet', () => {
        const data = new Uint8Array([0xfb, 0xef, 0xbf]);
        const encoded = encodeBase64Fallback(data, { alphabet: 'base64url' });
        expect(encoded).toBe('---_');
        const decoded = decodeBase64Fallback(encoded, { alphabet: 'base64url' });
        expect(decoded).toEqual(data);
    });

    test('fallback: decodeBase64 base64url rejects + and /', () => {
        expect(() => decodeBase64Fallback('+++/', { alphabet: 'base64url' })).toThrow(SyntaxError);
    });

    test('fallback: lastChunkHandling strict throws on missing padding', () => {
        expect(() => decodeBase64Fallback('QQ', { lastChunkHandling: 'strict' })).toThrow('The base64 input terminates with a single character, excluding padding (=)');
        expect(() => decodeBase64Fallback('QUI', { lastChunkHandling: 'strict' })).toThrow('The base64 input terminates with a single character, excluding padding (=)');
    });

    test('fallback: lastChunkHandling strict accepts padded input', () => {
        expect(decodeBase64Fallback('QQ==', { lastChunkHandling: 'strict' })).toEqual(new Uint8Array([65]));
        expect(decodeBase64Fallback('QUI=', { lastChunkHandling: 'strict' })).toEqual(new Uint8Array([65, 66]));
    });

    test('fallback: lastChunkHandling strict validates padding bits', () => {
        expect(() => decodeBase64Fallback('QR==', { lastChunkHandling: 'strict' })).toThrow('The base64 input terminates with non-zero padding bits');
        expect(() => decodeBase64Fallback('QUJ=', { lastChunkHandling: 'strict' })).toThrow('The base64 input terminates with non-zero padding bits');
    });

    test('fallback: lastChunkHandling strict validates padding bits with base64url', () => {
        expect(() => decodeBase64Fallback('QR==', { alphabet: 'base64url', lastChunkHandling: 'strict' })).toThrow('The base64 input terminates with non-zero padding bits');
        expect(() => decodeBase64Fallback('QUJ=', { alphabet: 'base64url', lastChunkHandling: 'strict' })).toThrow('The base64 input terminates with non-zero padding bits');
    });

    test('fallback: lastChunkHandling strict accepts aligned input without padding with base64url', () => {
        // 'QUJD' is 4 chars, no padding needed, strict mode should accept it
        expect(decodeBase64Fallback('QUJD', { alphabet: 'base64url', lastChunkHandling: 'strict' })).toEqual(new Uint8Array([65, 66, 67]));
    });

    test('fallback: lastChunkHandling stop-before-partial ignores incomplete chunk', () => {
        expect(decodeBase64Fallback('QUJDQQ', { lastChunkHandling: 'stop-before-partial' })).toEqual(new Uint8Array([65, 66, 67]));
    });

    test('fallback: lastChunkHandling stop-before-partial decodes padded chunks', () => {
        expect(decodeBase64Fallback('QUJDQQ==', { lastChunkHandling: 'stop-before-partial' })).toEqual(new Uint8Array([65, 66, 67, 65]));
    });

    test('fallback: round-trip with base64url + omitPadding', () => {
        const data = new Uint8Array(256);
        for (let i = 0; i < 256; i++) data[i] = i;
        const encoded = encodeBase64Fallback(data, { alphabet: 'base64url', omitPadding: true });
        const decoded = decodeBase64Fallback(encoded, { alphabet: 'base64url' });
        expect(decoded).toEqual(data);
    });
});
