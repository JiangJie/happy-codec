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
        // Safe: Uint8Array.prototype.buffer is always an ArrayBuffer
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

/**
 * Asserts that the input is a string.
 *
 * @param input - The value to check.
 * @throws {TypeError} If the input is not a string.
 */
export function assertInputIsString(input: string): void {
    if (typeof input !== 'string') {
        throw new TypeError('Input argument must be a string');
    }
}
