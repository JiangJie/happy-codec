import { expect, test } from 'vitest';
import { decodeHex, encodeHex } from '../src/mod.ts';

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
