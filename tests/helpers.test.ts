import { expect, test } from 'vitest';
import { bufferSourceToBytes } from '../src/internal/mod.ts';
import { decodeBase64, decodeByteString, decodeHex, encodeHex, encodeUtf8 } from '../src/mod.ts';

test('bufferSourceToBytes throws TypeError for invalid AllowSharedBufferSource', () => {
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => bufferSourceToBytes(123)).toThrow(TypeError);
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => bufferSourceToBytes(null)).toThrow(TypeError);
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => bufferSourceToBytes('string')).toThrow(TypeError);
});

test('encodeHex throws TypeError for invalid DataSource', () => {
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => encodeHex(123)).toThrow(TypeError);
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => encodeHex(null)).toThrow(TypeError);
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => encodeHex(undefined)).toThrow(TypeError);
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => encodeHex({ foo: 'bar' })).toThrow(TypeError);
});

test('decodeBase64 throws TypeError for non-string input', () => {
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => decodeBase64(123)).toThrow(TypeError);
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => decodeBase64(null)).toThrow(TypeError);
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => decodeBase64(undefined)).toThrow(TypeError);
});

test('decodeHex throws TypeError for non-string input', () => {
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => decodeHex(123)).toThrow(TypeError);
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => decodeHex(null)).toThrow(TypeError);
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => decodeHex(undefined)).toThrow(TypeError);
});

test('decodeByteString throws TypeError for non-string input', () => {
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => decodeByteString(123)).toThrow(TypeError);
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => decodeByteString(null)).toThrow(TypeError);
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => decodeByteString(undefined)).toThrow(TypeError);
});

test('encodeUtf8 throws TypeError for non-string input', () => {
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => encodeUtf8(123)).toThrow(TypeError);
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => encodeUtf8(null)).toThrow(TypeError);
    // @ts-expect-error - intentionally passing invalid type for testing
    expect(() => encodeUtf8(undefined)).toThrow(TypeError);
});

test('bufferSourceToBytes handles SharedArrayBuffer', () => {
    const sab = new SharedArrayBuffer(3);
    const view = new Uint8Array(sab);
    view.set([1, 2, 3]);

    const result = bufferSourceToBytes(sab);
    expect(result).toEqual(new Uint8Array([1, 2, 3]));
    // Zero-copy: underlying buffer should be the same SharedArrayBuffer
    expect(result.buffer).toBe(sab);
});

test('bufferSourceToBytes handles Uint8Array backed by SharedArrayBuffer', () => {
    const sab = new SharedArrayBuffer(5);
    const view = new Uint8Array(sab);
    view.set([10, 20, 30, 40, 50]);

    const result = bufferSourceToBytes(view);
    expect(result).toEqual(new Uint8Array([10, 20, 30, 40, 50]));
    expect(result.buffer).toBe(sab);
});
