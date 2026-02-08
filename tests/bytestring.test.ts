import { expect, test } from 'vitest';
import { decodeByteString, encodeByteString, encodeUtf8 } from '../src/mod.ts';

test('decodeByteString converts string to Uint8Array', () => {
    const str = 'Hello';
    const result = decodeByteString(str);
    expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
});

test('decodeByteString handles empty string', () => {
    expect(decodeByteString('')).toEqual(new Uint8Array([]));
});

test('encodeByteString converts buffer to string', () => {
    const buffer = new Uint8Array([72, 101, 108, 108, 111]);
    expect(encodeByteString(buffer)).toBe('Hello');
});

test('encodeByteString handles empty buffer', () => {
    expect(encodeByteString(new Uint8Array([]))).toBe('');
});

test('byteString round-trip conversion', () => {
    const original = 'Test string 123';
    const buffer = decodeByteString(original);
    const result = encodeByteString(buffer);
    expect(result).toBe(original);
});

test('encodeByteString converts string to byte string', () => {
    const str = 'Hello';
    const result = encodeByteString(str);
    expect(result).toBe('Hello');
});

test('decodeByteString throws on characters above 0xFF', () => {
    expect(() => decodeByteString('你好')).toThrow('Found a character that cannot be part of a valid byte string');
    expect(() => decodeByteString('abc你')).toThrow('Found a character that cannot be part of a valid byte string');
    expect(() => decodeByteString('\u0100')).toThrow('Found a character that cannot be part of a valid byte string');
});

test('encodeByteString handles unicode string', () => {
    const str = '中文';
    const result = encodeByteString(str);
    const expected = encodeByteString(encodeUtf8(str));
    expect(result).toBe(expected);
});

test('encodeByteString handles BufferSource input', () => {
    const buffer = new Uint8Array([72, 101, 108, 108, 111]);
    const result = encodeByteString(buffer);
    expect(result).toBe('Hello');
});

test('encodeByteString works with DataView', () => {
    const buffer = new ArrayBuffer(8);
    const fullView = new Uint8Array(buffer);
    fullView.set([0, 0, 72, 101, 108, 108, 111, 0]);

    const dataView = new DataView(buffer, 2, 5);
    expect(encodeByteString(dataView)).toBe('Hello');
});

test('encodeByteString handles large buffers without stack overflow', () => {
    const size = 1_000_000;
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
        bytes[i] = i & 0xFF;
    }

    const result = encodeByteString(bytes);
    expect(result.length).toBe(size);
    expect(result.charCodeAt(0)).toBe(0);
    expect(result.charCodeAt(255)).toBe(255);
    expect(result.charCodeAt(256)).toBe(0);
});
