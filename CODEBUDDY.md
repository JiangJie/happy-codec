# CODEBUDDY.md

This file provides guidance to CodeBuddy Code when working with code in this repository.

## Commands

```bash
# Type check
pnpm run check

# Lint
pnpm run lint

# Run all tests with coverage
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run a single test file
pnpm exec vitest run tests/utf8.test.ts

# Run benchmarks
pnpm run bench

# Build (runs check + lint first)
pnpm run build

# Generate API docs
pnpm run docs
```

## Architecture

```
src/
├── mod.ts              # Entry point, re-exports src/lib/mod.ts
├── internal/           # Internal utilities (not exported)
│   ├── mod.ts
│   ├── helpers.ts      # bufferSourceToBytes() - converts AllowSharedBufferSource to Uint8Array
│   ├── lazy.ts         # Lazy<T> - deferred initialization wrapper
│   └── types.ts        # Uint8Array ES2026 method type interfaces
└── lib/                # Public API
    ├── mod.ts          # Re-exports all public modules
    ├── types.ts        # DataSource type definition
    ├── helpers.ts      # dataSourceToBytes() - converts DataSource to Uint8Array
    ├── base64.ts       # encodeBase64(), decodeBase64()
    ├── hex.ts          # encodeHex(), decodeHex()
    ├── utf8.ts         # encodeUtf8(), decodeUtf8()
    └── bytestring.ts   # encodeByteString(), decodeByteString()
```

## Design Patterns

### Native API Detection with Fallback

All encoding/decoding functions detect native API availability at runtime and fall back to pure JS:

```ts
// Example pattern from base64.ts
return typeof Uint8Array.fromBase64 === 'function'
    ? Uint8Array.fromBase64(data)
    : decodeBase64Fallback(data);
```

- `encodeBase64`: Uses native `Uint8Array.prototype.toBase64` if available, otherwise pure JS
- `decodeBase64`: Uses native `Uint8Array.fromBase64` if available, otherwise pure JS fallback
- `encodeHex`: Uses native `Uint8Array.prototype.toHex` if available, otherwise pure JS
- `decodeHex`: Uses native `Uint8Array.fromHex` if available, otherwise pure JS fallback
- `encodeUtf8`: Uses `TextEncoder` if available, otherwise pure JS fallback
- `decodeUtf8`: Uses `TextDecoder` if available, otherwise pure JS fallback

### Lazy Initialization

Use `Lazy()` to defer expensive object creation (like `TextEncoder`/`TextDecoder` instances):

```ts
const encoder = Lazy(() => new TextEncoder());
// Later: encoder.force().encode(data)
```

### Input Type Handling

- `DataSource = string | AllowSharedBufferSource` - common input type for encoding functions
- `dataSourceToBytes()` - converts DataSource to Uint8Array (strings are UTF-8 encoded)
- `bufferSourceToBytes()` - converts AllowSharedBufferSource to Uint8Array

## Key Implementation Notes

- `encodeBase64` accepts `EncodeBase64Options` (`alphabet`, `omitPadding`) matching the native `Uint8Array.prototype.toBase64` API
- `decodeBase64` accepts `DecodeBase64Options` (`alphabet`, `lastChunkHandling`) matching the native `Uint8Array.fromBase64` API
- `decodeUtf8` accepts `TextDecoderOptions` (`fatal`, `ignoreBOM`) matching the standard `TextDecoder` API
- Hexadecimal literals must use lowercase letters (e.g., `0xff` not `0xFF`)
- Replacement character for invalid UTF-8 sequences: use `String.fromCharCode(0xfffd)` instead of `'\ufffd'` literal (Vite build converts the literal to `�`)
- All modules maintain 100% test coverage
