# happy-codec

[![License](https://img.shields.io/npm/l/happy-codec.svg)](LICENSE)
[![Build Status](https://github.com/JiangJie/happy-codec/actions/workflows/test.yml/badge.svg)](https://github.com/JiangJie/happy-codec/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/JiangJie/happy-codec/graph/badge.svg)](https://codecov.io/gh/JiangJie/happy-codec)
[![NPM version](https://img.shields.io/npm/v/happy-codec.svg)](https://npmjs.org/package/happy-codec)
[![NPM downloads](https://badgen.net/npm/dm/happy-codec)](https://npmjs.org/package/happy-codec)
[![JSR Version](https://jsr.io/badges/@happy-js/happy-codec)](https://jsr.io/@happy-js/happy-codec)
[![JSR Score](https://jsr.io/badges/@happy-js/happy-codec/score)](https://jsr.io/@happy-js/happy-codec/score)

Zero-dependency codec library for Base64, Hex, UTF-8 and ByteString encoding/decoding.

---

[API Documentation](https://jiangjie.github.io/happy-codec)

---

## Features

- **Zero dependencies** - No external runtime dependencies
- **Universal runtime** - Works in any JavaScript environment (Browser, Node.js, Deno, Bun, Web Workers, 小程序/小游戏 (如微信小游戏), etc.) regardless of DOM/BOM support
- **Base64** - Hybrid encoding/decoding: pure JS for small inputs, native `Uint8Array.prototype.toBase64`/`Uint8Array.fromBase64` for larger ones (if available)
- **Hex** - Hybrid encoding/decoding: pure JS for small inputs, native `Uint8Array.prototype.toHex`/`Uint8Array.fromHex` for larger ones (if available)
- **UTF-8** - Hybrid UTF-8 encoding/decoding: pure JS for small inputs, native `TextEncoder`/`TextDecoder` for larger ones (if available)
- **ByteString** - Binary string conversions

## Installation

```sh
# npm
npm install happy-codec

# yarn
yarn add happy-codec

# pnpm
pnpm add happy-codec

# JSR (Deno)
deno add @happy-js/happy-codec

# JSR (Bun)
bunx jsr add @happy-js/happy-codec
```

## Usage

```ts
import {
    encodeBase64,
    decodeBase64,
    encodeHex,
    decodeHex,
    encodeUtf8,
    decodeUtf8,
    encodeByteString,
    decodeByteString,
} from 'happy-codec';

// Base64
const base64 = encodeBase64('Hello, World!'); // 'SGVsbG8sIFdvcmxkIQ=='
const bytes = decodeBase64(base64); // Uint8Array

// Hex
const hex = encodeHex(new Uint8Array([255, 0, 128])); // 'ff0080'
const data = decodeHex('ff0080'); // Uint8Array [255, 0, 128]

// UTF-8
const utf8Bytes = encodeUtf8('你好'); // Uint8Array [228, 189, 160, ...]
const text = decodeUtf8(utf8Bytes); // '你好'
// Invalid bytes are replaced with U+FFFD by default
const lossy = decodeUtf8(new Uint8Array([0xff, 0xfe])); // '��'
// Use { fatal: true } to throw on invalid bytes
decodeUtf8(new Uint8Array([0xff]), { fatal: true }); // throws TypeError
// BOM is stripped by default, use { ignoreBOM: true } to keep it
const withBOM = new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x69]); // BOM + 'Hi'
decodeUtf8(withBOM); // 'Hi'
decodeUtf8(withBOM, { ignoreBOM: true }); // '\uFEFFHi'

// ByteString
const byteStr = encodeByteString(new Uint8Array([72, 101, 108, 108, 111])); // 'Hello'
const byteArr = decodeByteString('Hello'); // Uint8Array [72, 101, 108, 108, 111]
```

## Performance

All encoding/decoding functions are benchmarked against native APIs to choose the fastest strategy.

### Base64

happy-codec uses native `Uint8Array.prototype.toBase64` / `Uint8Array.fromBase64` (TC39 Stage 4) when available, with pure JS fallback for environments that don't support them yet.

- **`encodeBase64`**: Native `toBase64` for inputs >= 21 bytes, pure JS for smaller ones.
- **`decodeBase64`**: Native `fromBase64` for inputs >= 88 base64 chars (~66 bytes), pure JS for smaller ones.

### Hex

happy-codec uses native `Uint8Array.prototype.toHex` / `Uint8Array.fromHex` (TC39 Stage 4) when available, with pure JS fallback for environments that don't support them yet.

- **`encodeHex`**: Always uses native `toHex` when available (faster at all sizes).
- **`decodeHex`**: Native `fromHex` for inputs >= 22 hex chars (11 bytes), pure JS for smaller ones.

### UTF-8

Native `TextEncoder`/`TextDecoder` have per-call overhead that makes them slower than pure JS for small inputs. happy-codec uses a hybrid strategy based on benchmarks:

- **`encodeUtf8`**: Pure JS for short strings (length <= 21, up to 63 bytes), native `TextEncoder` for larger ones. Falls back to pure JS when `TextEncoder` is unavailable.
- **`decodeUtf8`**: Pure JS for small data (byteLength <= 4), native `TextDecoder` for larger ones. Falls back to pure JS when `TextDecoder` is unavailable.

> **Benchmark environment:** Node.js v25.6.0, AMD EPYC 7K83 64-Core Processor, Linux x86_64.
> Results may vary across different JS engines, hardware, and OS. Run `pnpm run bench` to verify on your own environment.

## License

MIT
