/**
 * ByteString encode benchmark.
 * Compares encoding strategies for byte-to-string conversion.
 *
 * Candidates:
 * - **loop**: `for` loop with `String.fromCharCode(bytes[i])` per byte
 * - **apply**: `String.fromCharCode.apply(null, bytes)` (stack overflow on large inputs)
 * - **chunked-apply**: chunked `String.fromCharCode.apply` with 8192-byte chunks (safe at all sizes)
 *
 * Results (Node.js v25.6.0, AMD EPYC 7K83, Linux x86_64):
 *
 *   | Size   | loop (ops/s) | apply (ops/s) | chunked-apply (ops/s) | Winner        |
 *   |--------|-------------|---------------|-----------------------|---------------|
 *   | 8B     | 8,236K      | 6,918K        | 7,070K                | loop (1.16x)  |
 *   | 16B    | 5,899K      | 5,709K        | 5,695K                | loop (1.03x)  |
 *   | 32B    | 3,999K      | 4,094K        | 4,363K                | chunked-apply |
 *   | 1KB    | 221K        | 257K          | 256K                  | apply (1.16x) |
 *   | 8KB    | 27K         | 30K           | 31K                   | chunked-apply |
 *   | 16KB   | 13,861      | 8,559         | 14,550                | chunked-apply (1.70x vs apply) |
 *
 * Key findings:
 * - loop wins at very small sizes (< 32B) but the absolute difference is negligible
 * - apply loses badly at 16KB due to large argument list overhead
 * - chunked-apply (8192-byte chunks) avoids this by keeping each apply call in the sweet spot
 *
 * **Decision: chunked-apply** — competitive at all sizes, no stack overflow risk,
 * and clear winner at larger inputs. The ~1.16x loop advantage at 8B is ~0.00001ms/op.
 */

import { bench, describe } from 'vitest';

const sizes = [8, 16, 32, 1024, 8192, 16384];

const buffers = sizes.map(size => {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
        bytes[i] = i & 0xFF;
    }
    return bytes;
});

function encodeLoop(bytes: Uint8Array): string {
    let result = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        result += String.fromCharCode(bytes[i]);
    }
    return result;
}

/** ⚠️ Stack overflow on large inputs (>~500KB) */
function encodeApply(bytes: Uint8Array): string {
    return String.fromCharCode.apply(null, bytes as unknown as number[]);
}

const CHUNK = 8192;

function encodeChunkedApply(bytes: Uint8Array): string {
    const len = bytes.byteLength;

    if (len <= CHUNK) {
        return String.fromCharCode.apply(null, bytes as unknown as number[]);
    }

    let result = '';
    for (let i = 0; i < len; i += CHUNK) {
        result += String.fromCharCode.apply(
            null,
            bytes.subarray(i, Math.min(i + CHUNK, len)) as unknown as number[],
        );
    }
    return result;
}

// ============================================================================
// ByteString Encode - loop vs apply
// ============================================================================

sizes.forEach((size, i) => {
    describe(`ByteString Encode - ${size} bytes`, () => {
        bench('loop', () => {
            encodeLoop(buffers[i]);
        });

        bench('apply', () => {
            encodeApply(buffers[i]);
        });

        bench('chunked-apply', () => {
            encodeChunkedApply(buffers[i]);
        });
    });
});
