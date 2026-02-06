import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { decodeBase64, encodeBase64, encodeUtf8 } from '../src/mod.ts';

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

describe('Base64 decodeBase64 fallback implementation', () => {
    let decodeBase64Fallback: (data: string) => Uint8Array<ArrayBuffer>;
    let originalAtob: typeof atob;

    beforeAll(async () => {
        // Save original atob
        originalAtob = globalThis.atob;

        // Remove atob to trigger fallback
        // @ts-expect-error - intentionally removing for testing
        delete globalThis.atob;

        // Clear module cache to ensure fresh import without atob
        vi.resetModules();

        // Dynamically import the base64 module
        const base64Module = await import('../src/lib/base64.ts');
        decodeBase64Fallback = base64Module.decodeBase64;
    });

    afterAll(() => {
        // Restore original atob
        globalThis.atob = originalAtob;
    });

    test('decodeBase64 decodes simple ASCII data without atob', () => {
        const result = decodeBase64Fallback('SGVsbG8=');
        expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111])); // "Hello"
    });

    test('decodeBase64 handles empty string without atob', () => {
        const result = decodeBase64Fallback('');
        expect(result).toEqual(new Uint8Array([]));
    });

    test('decodeBase64 handles single byte (double padding) without atob', () => {
        const result = decodeBase64Fallback('QQ==');
        expect(result).toEqual(new Uint8Array([65])); // 'A'
    });

    test('decodeBase64 handles two bytes (single padding) without atob', () => {
        const result = decodeBase64Fallback('QUI=');
        expect(result).toEqual(new Uint8Array([65, 66])); // 'AB'
    });

    test('decodeBase64 handles three bytes (no padding) without atob', () => {
        const result = decodeBase64Fallback('QUJD');
        expect(result).toEqual(new Uint8Array([65, 66, 67])); // 'ABC'
    });

    test('decodeBase64 handles binary data without atob', () => {
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

    test('decodeBase64 decodes UTF-8 encoded Chinese characters without atob', () => {
        // '中文' encoded as UTF-8 then Base64
        const result = decodeBase64Fallback('5Lit5paH');
        expect(new TextDecoder().decode(result)).toBe('中文');
    });

    test('decodeBase64 decodes UTF-8 encoded emoji without atob', () => {
        // '🎮' encoded as UTF-8 then Base64
        const result = decodeBase64Fallback('8J+OrQ==');
        expect(new TextDecoder().decode(result)).toBe('🎭');
    });

    test('decodeBase64 round-trip with encodeBase64 without atob', () => {
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
});
