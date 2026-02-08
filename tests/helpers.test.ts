import { expect, test } from 'vitest';
import { decodeBase64, decodeByteString, decodeHex, encodeHex, encodeUtf8 } from '../src/mod.ts';

test('encodeHex throws TypeError for invalid BufferSource', () => {
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
