/**
 * @internal
 * Internal helper functions.
 */

/**
 * Converts BufferSource to Uint8Array.
 *
 * @param input - The BufferSource to convert.
 * @returns Uint8Array.
 * @throws {TypeError} If the input is not an ArrayBuffer or ArrayBufferView.
 */
export function bufferSourceToBytes(input: BufferSource): Uint8Array<ArrayBuffer> {
    if (input instanceof Uint8Array) {
        // Safe: Uint8Array.prototype.buffer is always an ArrayBuffer
        return input as Uint8Array<ArrayBuffer>;
    }

    if (input instanceof ArrayBuffer) {
        return new Uint8Array(input);
    }

    if (ArrayBuffer.isView(input)) {
        return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    }

    throw new TypeError('Input argument must be an ArrayBuffer or ArrayBufferView');
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
