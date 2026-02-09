/**
 * ES2026 Uint8Array base64/hex method types.
 *
 * TODO: Remove once TypeScript includes these types in lib.esnext or lib.es2026.
 * Tracking: https://github.com/tc39/proposal-arraybuffer-base64
 *
 * @internal
 */

/**
 * Uint8Array instance with ES2026 base64/hex methods.
 */
export interface Uint8ArrayWithBase64Hex extends Uint8Array {
    toBase64(options?: { alphabet?: 'base64' | 'base64url'; omitPadding?: boolean; }): string;
    toHex(): string;
}

/**
 * Uint8Array constructor with ES2026 base64/hex static methods.
 */
export interface Uint8ArrayConstructorWithBase64Hex {
    fromBase64(base64: string, options?: { alphabet?: 'base64' | 'base64url'; lastChunkHandling?: 'loose' | 'strict' | 'stop-before-partial'; }): Uint8Array<ArrayBuffer>;
    fromHex(hex: string): Uint8Array<ArrayBuffer>;
}
