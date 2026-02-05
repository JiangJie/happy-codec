/**
 * Public type definitions module.
 * @module types
 */

/**
 * Data source type, can be a string or BufferSource.
 *
 * @since 1.0.0
 * @example
 * ```ts
 * // String type
 * const strData: DataSource = 'Hello, World!';
 *
 * // ArrayBuffer type
 * const bufferData: DataSource = new ArrayBuffer(8);
 *
 * // Uint8Array type
 * const u8aData: DataSource = new Uint8Array([1, 2, 3]);
 * ```
 */
export type DataSource = string | BufferSource;
