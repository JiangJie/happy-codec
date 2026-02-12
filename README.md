# happy-codec

[![License](https://img.shields.io/npm/l/happy-codec.svg)](LICENSE)
[![Build Status](https://github.com/JiangJie/happy-codec/actions/workflows/test.yml/badge.svg)](https://github.com/JiangJie/happy-codec/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/JiangJie/happy-codec/graph/badge.svg)](https://codecov.io/gh/JiangJie/happy-codec)
[![NPM version](https://img.shields.io/npm/v/happy-codec.svg)](https://npmjs.org/package/happy-codec)
[![NPM downloads](https://badgen.net/npm/dm/happy-codec)](https://npmjs.org/package/happy-codec)
[![JSR Version](https://jsr.io/badges/@happy-js/happy-codec)](https://jsr.io/@happy-js/happy-codec)
[![JSR Score](https://jsr.io/badges/@happy-js/happy-codec/score)](https://jsr.io/@happy-js/happy-codec/score)

Zero-dependency codec library for UTF-8, Base64, Hex and ByteString encoding/decoding.

---

[API Documentation](https://jiangjie.github.io/happy-codec)

---

## Features

- **Zero dependencies** - No external runtime dependencies
- **Universal runtime** - Works in any JavaScript environment (Browser, Node.js, Deno, Bun, Web Workers, 小程序/小游戏 (如微信小游戏), etc.) regardless of DOM/BOM support
- **SharedArrayBuffer support** - All encoding functions accept `SharedArrayBuffer` input (zero-copy)
- **UTF-8** - Native `TextEncoder`/`TextDecoder` when available, pure JS fallback otherwise
- **Base64** - Native `Uint8Array.prototype.toBase64`/`Uint8Array.fromBase64` (ES2026) when available, pure JS fallback otherwise
- **Hex** - Native `Uint8Array.prototype.toHex`/`Uint8Array.fromHex` (ES2026) when available, pure JS fallback otherwise
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
    decodeBase64,
    decodeByteString,
    decodeHex,
    decodeUtf8,
    encodeBase64,
    encodeByteString,
    encodeHex,
    encodeUtf8,
} from 'happy-codec';

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

// Base64
const base64 = encodeBase64('Hello, World!'); // 'SGVsbG8sIFdvcmxkIQ=='
const bytes = decodeBase64(base64); // Uint8Array
// Base64url alphabet
const url = encodeBase64('Hello', { alphabet: 'base64url' }); // 'SGVsbG8'
decodeBase64(url, { alphabet: 'base64url' }); // Uint8Array
// Omit padding
encodeBase64(new Uint8Array([65]), { omitPadding: true }); // 'QQ' (no trailing '==')
// Strict decoding: require correct padding
decodeBase64('QQ==', { lastChunkHandling: 'strict' }); // Uint8Array [65]
// decodeBase64('QQ', { lastChunkHandling: 'strict' }); // throws SyntaxError

// Hex
const hex = encodeHex(new Uint8Array([255, 0, 128])); // 'ff0080'
const data = decodeHex('ff0080'); // Uint8Array [255, 0, 128]

// ByteString
const byteStr = encodeByteString(new Uint8Array([72, 101, 108, 108, 111])); // 'Hello'
const byteArr = decodeByteString('Hello'); // Uint8Array [72, 101, 108, 108, 111]
```

## Performance

All encoding/decoding functions use native APIs when available, with pure JS fallback for environments that don't support them yet.

- **Base64**: Native `Uint8Array.prototype.toBase64` / `Uint8Array.fromBase64` (ES2026) when available, pure JS fallback otherwise.
- **Hex**: Native `Uint8Array.prototype.toHex` / `Uint8Array.fromHex` (ES2026) when available, pure JS fallback otherwise.
- **UTF-8**: Native `TextEncoder` / `TextDecoder` when available, pure JS fallback otherwise.

> Run `pnpm run bench` to compare fallback vs native performance on your own environment.

## License

[MIT](LICENSE)
