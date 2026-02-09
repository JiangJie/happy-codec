/**
 * ByteString encoding/decoding module.
 *
 * @module bytestring
 */

import { assertInputIsString, typedArrayToString } from '../internal/mod.ts';
import { dataSourceToBytes } from './helpers.ts';
import type { DataSource } from './types.ts';

/**
 * Encodes a string or BufferSource to a byte string, with each byte as a character.
 *
 * Uses `String.fromCharCode.apply` in chunks of 8192 bytes for efficient
 * batch conversion while staying safe from call-stack overflow.
 *
 * @param data - The string or BufferSource to encode.
 * @returns Byte string.
 * @since 1.0.0
 * @example
 * ```ts
 * const str = encodeByteString(new Uint8Array([72, 101, 108, 108, 111]));
 * console.log(str); // 'Hello'
 *
 * const byteStr = encodeByteString('你好');
 * // Returns the UTF-8 encoded byte string
 * ```
 */
export function encodeByteString(data: DataSource): string {
    const bytes = dataSourceToBytes(data);

    return typedArrayToString(bytes, bytes.byteLength);
}

/**
 * Decodes a byte string to Uint8Array, with each character's charCode as a byte.
 *
 * @param byteString - The byte string to decode.
 * @returns Uint8Array.
 * @throws {TypeError} If the input is not a string.
 * @throws {SyntaxError} If string contains characters with charCode above 0xff.
 * @since 1.0.0
 * @example
 * ```ts
 * const bytes = decodeByteString('Hello');
 * console.log(bytes); // Uint8Array [72, 101, 108, 108, 111]
 * ```
 */
export function decodeByteString(byteString: string): Uint8Array<ArrayBuffer> {
    assertInputIsString(byteString);

    const { length } = byteString;
    const bytes = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
        const charCode = byteString.charCodeAt(i);

        if (charCode > 0xff) {
            throw new SyntaxError('Found a character that cannot be part of a valid byte string');
        }

        bytes[i] = charCode;
    }

    return bytes;
}
