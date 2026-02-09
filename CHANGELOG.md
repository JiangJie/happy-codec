# Changelog

## [1.1.0] - 2026-02-09

### Added

- `EncodeBase64Options` interface (`alphabet`, `omitPadding`) for `encodeBase64()`
- `DecodeBase64Options` interface (`alphabet`, `lastChunkHandling`) for `decodeBase64()`
- Input validation for `decodeByteString` and `decodeHex`
- Native `Uint8Array.fromBase64` / `Uint8Array.prototype.toBase64` and `Uint8Array.fromHex` / `Uint8Array.prototype.toHex` (ES2026) detection with pure JS fallback

### Fixed

- `decodeBase64Fallback` byte length calculation and validation

### Changed

- Always prefer native APIs when available, removed all fallback thresholds
- Switched `encodeByteString` to chunked `String.fromCharCode.apply` for large inputs
- Replaced runtime hex parsing with pre-computed lookup tables
- UTF-8 encode fallback: replaced dynamic array with pre-allocated `Uint8Array`
- UTF-8 decode fallback: switched from code-point array to pre-allocated `Uint16Array`
- UTF-8 decode: skip BOM at byte level instead of post-decode string strip
- Extracted shared `typedArrayToString` helper and `APPLY_CHUNK` constant into internal module
- Standardized input validation and error types across all decode functions
- Improved `dataSourceToBytes` type guard and cleaned up internals

## [1.0.0] - 2026-02-06

### Added

- Universal runtime support (Browser, Node.js, Deno, Bun, 小程序/小游戏, etc.)
- Base64 encoding/decoding with fast pure-JS encoder and native decoder fallback
- Hex encoding/decoding
- UTF-8 encoding/decoding with `TextEncoder`/`TextDecoder` fallback
  - `fatal` option to throw on invalid byte sequences
  - `ignoreBOM` option to control BOM handling
- ByteString encoding/decoding
- 100% test coverage

[1.1.0]: https://github.com/JiangJie/happy-codec/releases/tag/v1.1.0
[1.0.0]: https://github.com/JiangJie/happy-codec/releases/tag/v1.0.0
