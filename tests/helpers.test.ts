import { expect, test } from 'vitest';
import { encodeHex } from '../src/mod.ts';

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
