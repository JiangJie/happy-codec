/**
 * Internal encoding/decoding helper functions for library.
 *
 * @internal
 */

import { bufferSourceToBytes } from '../internal/mod.ts';
import type { DataSource } from './types.ts';
import { encodeUtf8 } from './utf8.ts';

/**
 * Converts DataSource to Uint8Array.
 * - String: First UTF-8 encoded
 * - BufferSource: Converted to Uint8Array
 *
 * @param data - The data to convert.
 * @returns Converted `Uint8Array`.
 */
export function dataSourceToBytes(data: DataSource): Uint8Array<ArrayBuffer> {
    return typeof data === 'string'
        ? encodeUtf8(data)
        : bufferSourceToBytes(data);
}
