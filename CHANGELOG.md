# Changelog

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

[1.0.0]: https://github.com/JiangJie/happy-codec/releases/tag/v1.0.0
