/**
 * Internal helper functions.
 *
 * @internal
 */

// #region Internal Variables

/**
 * Maximum number of arguments passed to `Function.prototype.apply` per call.
 * Kept well below engine call-stack limits (~65536) to avoid `RangeError: Maximum call stack size exceeded`.
 */
const APPLY_CHUNK = 8192;

// #endregion

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

/**
 * Converts a TypedArray to a string via `String.fromCharCode` in chunks.
 * Uses `subarray` for zero-copy views and chunks of {@link APPLY_CHUNK}
 * to avoid call-stack overflow.
 *
 * @param arr - The TypedArray containing char codes.
 * @param len - Number of elements to convert (may be less than arr.length).
 * @returns The resulting string.
 */
export function typedArrayToString(arr: Uint8Array | Uint16Array, len: number): string {
    if (len <= APPLY_CHUNK) {
        return String.fromCharCode.apply(null, arr.subarray(0, len) as unknown as number[]);
    }

    let result = '';
    for (let i = 0; i < len; i += APPLY_CHUNK) {
        result += String.fromCharCode.apply(
            null,
            arr.subarray(i, Math.min(i + APPLY_CHUNK, len)) as unknown as number[],
        );
    }
    return result;
}
