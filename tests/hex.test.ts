import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { decodeHex, encodeHex } from '../src/mod.ts';
import type { Uint8ArrayConstructorWithBase64Hex, Uint8ArrayWithBase64Hex } from '../src/internal/mod.ts';

test('encodeHex converts buffer to hex string', () => {
    const buffer = new Uint8Array([0, 15, 16, 255]);
    expect(encodeHex(buffer)).toBe('000f10ff');
});

test('encodeHex handles empty buffer', () => {
    expect(encodeHex(new Uint8Array([]))).toBe('');
});

test('encodeHex works with ArrayBuffer', () => {
    const buffer = new ArrayBuffer(4);
    const view = new Uint8Array(buffer);
    view.set([0xde, 0xad, 0xbe, 0xef]);
    expect(encodeHex(buffer)).toBe('deadbeef');
});

test('encodeHex with single byte values', () => {
    expect(encodeHex(new Uint8Array([0]))).toBe('00');
    expect(encodeHex(new Uint8Array([255]))).toBe('ff');
    expect(encodeHex(new Uint8Array([1]))).toBe('01');
    expect(encodeHex(new Uint8Array([16]))).toBe('10');
});

test('decodeHex converts hex string to Uint8Array', () => {
    expect(decodeHex('000f10ff')).toEqual(new Uint8Array([0, 15, 16, 255]));
});

test('decodeHex handles empty string', () => {
    expect(decodeHex('')).toEqual(new Uint8Array([]));
});

test('decodeHex handles uppercase hex', () => {
    expect(decodeHex('DEADBEEF')).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
});

test('decodeHex handles mixed case hex', () => {
    expect(decodeHex('DeAdBeEf')).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
});

test('decodeHex with single byte values', () => {
    expect(decodeHex('00')).toEqual(new Uint8Array([0]));
    expect(decodeHex('ff')).toEqual(new Uint8Array([255]));
    expect(decodeHex('01')).toEqual(new Uint8Array([1]));
    expect(decodeHex('10')).toEqual(new Uint8Array([16]));
});

test('hex round-trip conversion', () => {
    const original = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x00, 0xff]);
    const hex = encodeHex(original);
    const result = decodeHex(hex);
    expect(result).toEqual(original);
});

test('hex round-trip conversion with large data', () => {
    const original = new Uint8Array(64);
    for (let i = 0; i < 64; i++) original[i] = i;
    const hex = encodeHex(original);
    const result = decodeHex(hex);
    expect(result).toEqual(original);
});

test('decodeHex at fallback threshold boundary (128 hex chars = 64 bytes)', () => {
    const original = new Uint8Array(64);
    for (let i = 0; i < 64; i++) original[i] = i & 0xFF;
    const hex = encodeHex(original);
    expect(hex).toHaveLength(128);
    expect(decodeHex(hex)).toEqual(original);
});

test('decodeHex above fallback threshold (130 hex chars = 65 bytes)', () => {
    const original = new Uint8Array(65);
    for (let i = 0; i < 65; i++) original[i] = i & 0xFF;
    const hex = encodeHex(original);
    expect(hex).toHaveLength(130);
    expect(decodeHex(hex)).toEqual(original);
});

test('hex round-trip with large data above native threshold', () => {
    const original = new Uint8Array(256);
    for (let i = 0; i < 256; i++) original[i] = i & 0xFF;
    const hex = encodeHex(original);
    expect(hex).toHaveLength(512);
    expect(decodeHex(hex)).toEqual(original);
});

describe('Hex fallback implementation', () => {
    let encodeHexFallback: (data: string | BufferSource) => string;
    let decodeHexFallback: (hex: string) => Uint8Array<ArrayBuffer>;
    let originalToHex: Uint8ArrayWithBase64Hex['toHex'];
    let originalFromHex: Uint8ArrayConstructorWithBase64Hex['fromHex'];

    beforeAll(async () => {
        // Save originals
        originalToHex = (Uint8Array.prototype as unknown as Uint8ArrayWithBase64Hex).toHex;
        originalFromHex = (Uint8Array as unknown as Uint8ArrayConstructorWithBase64Hex).fromHex;

        // Remove native APIs to force fallback
        // @ts-expect-error - intentionally removing for testing
        delete Uint8Array.prototype.toHex;
        // @ts-expect-error - intentionally removing for testing
        delete Uint8Array.fromHex;

        vi.resetModules();

        const hexModule = await import('../src/lib/hex.ts');
        encodeHexFallback = hexModule.encodeHex;
        decodeHexFallback = hexModule.decodeHex;
    });

    afterAll(() => {
        (Uint8Array.prototype as unknown as Uint8ArrayWithBase64Hex).toHex = originalToHex;
        (Uint8Array as unknown as Uint8ArrayConstructorWithBase64Hex).fromHex = originalFromHex;
    });

    test('encodeHex fallback converts buffer to hex string', () => {
        expect(encodeHexFallback(new Uint8Array([0, 15, 16, 255]))).toBe('000f10ff');
        expect(encodeHexFallback(new Uint8Array([]))).toBe('');
    });

    test('decodeHex fallback converts hex string to Uint8Array', () => {
        expect(decodeHexFallback('000f10ff')).toEqual(new Uint8Array([0, 15, 16, 255]));
        expect(decodeHexFallback('DEADBEEF')).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
        expect(decodeHexFallback('')).toEqual(new Uint8Array([]));
    });

    test('decodeHex fallback throws on odd-length string', () => {
        expect(() => decodeHexFallback('f')).toThrow(SyntaxError);
        expect(() => decodeHexFallback('f')).toThrow('Input string must contain hex characters in even length');
        expect(() => decodeHexFallback('fff')).toThrow(SyntaxError);
    });

    test('decodeHex fallback throws on non-hex characters', () => {
        expect(() => decodeHexFallback('0g')).toThrow(SyntaxError);
        expect(() => decodeHexFallback('0g')).toThrow('Input string must contain hex characters in even length');
        expect(() => decodeHexFallback('zz')).toThrow(SyntaxError);
    });

    test('hex fallback round-trip conversion', () => {
        const original = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x00, 0xff]);
        const hex = encodeHexFallback(original);
        const result = decodeHexFallback(hex);
        expect(result).toEqual(original);
    });
});
