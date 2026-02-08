/**
 * @internal
 * Internal shared constants.
 */

/**
 * Maximum number of arguments passed to `Function.prototype.apply` per call.
 * Kept well below engine call-stack limits (~65 536) to avoid `RangeError`.
 */
export const APPLY_CHUNK = 8192;
