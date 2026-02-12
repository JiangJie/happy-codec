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
 * - AllowSharedBufferSource: Converted to Uint8Array
 *
 * @param data - The data to convert.
 * @returns Converted `Uint8Array`.
 * @throws {TypeError} If the input is not a string, ArrayBuffer, SharedArrayBuffer, or ArrayBufferView.
 */
export function dataSourceToBytes(data: DataSource): Uint8Array {
    if (typeof data === 'string') {
        return encodeUtf8(data);
    }

    if (data instanceof ArrayBuffer || ArrayBuffer.isView(data) || (typeof SharedArrayBuffer === 'function' && data instanceof SharedArrayBuffer)) {
        return bufferSourceToBytes(data);
    }

    throw new TypeError('Input argument must be a string, ArrayBuffer, SharedArrayBuffer, or ArrayBufferView');
}
