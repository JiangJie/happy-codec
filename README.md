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
- **Base64** - Fast pure-JS encoding (faster than native `btoa`), hybrid decoding: pure JS for small inputs, native `atob` for larger ones (if available)
- **Hex** - Hexadecimal encoding/decoding
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

The native `btoa`/`atob` functions have limitations:

1. **Latin1 restriction** - Only handles characters 0x00-0xFF
2. **Performance overhead** - Requires extra string↔bytes conversions for non-Latin1 input

Benchmarks show the pure JS implementation is **1.7x-5x faster** for encoding. For decoding, performance varies by data size: **1.3x faster** for small inputs, while native `atob` is faster for medium/large data (1.4x-1.8x).

### UTF-8

Native `TextEncoder`/`TextDecoder` have per-call overhead that makes them slower than pure JS for small inputs. happy-codec uses a hybrid strategy based on benchmarks:

- **`encodeUtf8`**: Pure JS for short strings (length <= 21, up to 63 bytes), native `TextEncoder` for larger ones. Falls back to pure JS when `TextEncoder` is unavailable.
- **`decodeUtf8`**: Pure JS for small data (byteLength <= 4), native `TextDecoder` for larger ones. Falls back to pure JS when `TextDecoder` is unavailable.

> **Benchmark environment:** Node.js v25.6.0, AMD EPYC 7K83 64-Core Processor, Linux x86_64.
> Results may vary across different JS engines, hardware, and OS. Run `pnpm run bench` to verify on your own environment.

## License

MIT
