/**
 * ByteString encoding/decoding module.
 * @module bytestring
 */

import { dataSourceToBytes } from './helpers.ts';
import type { DataSource } from './types.ts';

/**
 * Encodes a string or BufferSource to a byte string, with each byte as a character.
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
    return String.fromCharCode(...dataSourceToBytes(data));
}

/**
 * Decodes a byte string to Uint8Array, with each character's charCode as a byte.
 *
 * @param data - The byte string to decode.
 * @returns Uint8Array.
 * @throws {Error} If string contains characters with charCode above 0xFF.
 * @since 1.0.0
 * @example
 * ```ts
 * const bytes = decodeByteString('Hello');
 * console.log(bytes); // Uint8Array [72, 101, 108, 108, 111]
 * ```
 */
export function decodeByteString(data: string): Uint8Array<ArrayBuffer> {
    const { length } = data;
    const bytes = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
        const charCode = data.charCodeAt(i);

        if (charCode > 0xFF) {
            throw new Error('Invalid byte string: contains characters above 0xFF');
        }

        bytes[i] = charCode;
    }

    return bytes;
}
