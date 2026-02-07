/**
 * ByteString encode benchmark.
 * Compares different encoding strategies for byte-to-string conversion.
 *
 * Candidates:
 * - **loop**: `for` loop with `String.fromCharCode(bytes[i])` per byte
 * - **spread**: `String.fromCharCode(...bytes)` (stack overflow on large inputs)
 * - **apply**: `String.fromCharCode.apply(null, bytes)` (stack overflow on large inputs)
 *
 * Results (Node.js v25.6.0, AMD EPYC 7K83, Linux x86_64):
 *
 *   | Size  | loop (ops/s) | spread (ops/s) | apply (ops/s) | Winner |
 *   |-------|-------------|----------------|---------------|--------|
 *   | 5B    | 10,588K     | 3,137K         | 7,653K        | loop   |
 *   | 100B  | 1,850K      | 327K           | 2,070K        | apply  |
 *   | 1KB   | 208K        | 32K            | 262K          | apply  |
 *   | 10KB  | 23K         | 3K             | 24K           | apply  |
 *
 * apply wins at 100B+ but requires chunking for >~500KB (stack overflow).
 * loop wins at small sizes, safe at all sizes, and simplest implementation.
 *
 * **Decision: loop** — simplest code, no stack overflow risk, competitive across all sizes.
 * The ~1.2x advantage of apply in the 100B-10KB range does not justify the added complexity
 * of chunked processing for a utility function.
 */

import { bench, describe } from 'vitest';

const sizes = [5, 100, 1_000, 10_000];

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
function encodeSpread(bytes: Uint8Array): string {
    return String.fromCharCode(...bytes);
}

/** ⚠️ Stack overflow on large inputs (>~500KB) */
function encodeApply(bytes: Uint8Array): string {
    return String.fromCharCode.apply(null, bytes as unknown as number[]);
}

// ============================================================================
// ByteString Encode - loop vs spread vs apply
// ============================================================================

sizes.forEach((size, i) => {
    describe(`ByteString Encode - ${size} bytes`, () => {
        bench('loop', () => {
            encodeLoop(buffers[i]);
        });

        bench('spread', () => {
            encodeSpread(buffers[i]);
        });

        bench('apply', () => {
            encodeApply(buffers[i]);
        });
    });
});
