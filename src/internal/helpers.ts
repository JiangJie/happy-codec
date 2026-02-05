/**
 * @internal
 * Internal helper functions.
 */

/**
 * Converts BufferSource to Uint8Array.
 *
 * @param data - The BufferSource to convert.
 * @returns Uint8Array.
 */
export function bufferSourceToBytes(data: BufferSource): Uint8Array<ArrayBuffer> {
    if (data instanceof Uint8Array) {
        return data as Uint8Array<ArrayBuffer>;
    }

    if (data instanceof ArrayBuffer) {
        return new Uint8Array(data);
    }

    if (ArrayBuffer.isView(data)) {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }

    throw new TypeError(`BufferSource is not ArrayBuffer or ArrayBufferView`);
}
