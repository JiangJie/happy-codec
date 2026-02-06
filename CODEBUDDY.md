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
│   ├── helpers.ts      # bufferSourceToBytes() - converts BufferSource to Uint8Array
│   └── lazy.ts         # Lazy<T> - deferred initialization wrapper
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
return typeof atob === 'function'
    ? decodeBase64Native(data)
    : decodeBase64Fallback(data);
```

- `encodeBase64`: Always uses pure JS (faster than native `btoa`)
- `decodeBase64`: Uses `atob` if available, otherwise pure JS fallback
- `encodeUtf8`: Uses `TextEncoder` if available, otherwise pure JS fallback
- `decodeUtf8`: Uses `TextDecoder` if available, otherwise pure JS fallback

### Lazy Initialization

Use `Lazy()` to defer expensive object creation (like `TextEncoder`/`TextDecoder` instances):

```ts
const encoder = Lazy(() => new TextEncoder());
// Later: encoder.force().encode(data)
```

### Input Type Handling

- `DataSource = string | BufferSource` - common input type for encoding functions
- `dataSourceToBytes()` - converts DataSource to Uint8Array (strings are UTF-8 encoded)
- `bufferSourceToBytes()` - converts BufferSource to Uint8Array

## Key Implementation Notes

- `decodeUtf8` accepts `TextDecoderOptions` (`fatal`, `ignoreBOM`) matching the standard `TextDecoder` API
- Replacement character for invalid UTF-8 sequences: use `String.fromCharCode(0xfffd)` instead of `'\ufffd'` literal (Vite build converts the literal to `�`)
- All modules maintain 100% test coverage
