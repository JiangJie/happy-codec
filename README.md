# happy-codec

Zero-dependency codec library for Base64, Hex, UTF-8 and ByteString encoding/decoding.

---

## Features

- **Zero dependencies** - No external runtime dependencies
- **Base64** - Fast pure-JS implementation (faster than native `btoa`/`atob`)
- **Hex** - Hexadecimal encoding/decoding
- **UTF-8** - UTF-8 text encoding/decoding with fallback support
- **ByteString** - Binary string conversions

## Installation

```bash
npm install happy-codec
# or
pnpm add happy-codec
# or
yarn add happy-codec
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

// ByteString
const byteStr = encodeByteString(new Uint8Array([72, 101, 108, 108, 111])); // 'Hello'
const byteArr = decodeByteString('Hello'); // Uint8Array [72, 101, 108, 108, 111]
```

## API

### Base64

- `encodeBase64(data: DataSource): string` - Encode string or BufferSource to Base64
- `decodeBase64(data: string): Uint8Array` - Decode Base64 string to Uint8Array

### Hex

- `encodeHex(data: DataSource): string` - Encode to hexadecimal string
- `decodeHex(hex: string): Uint8Array` - Decode hexadecimal string

### UTF-8

- `encodeUtf8(data: string): Uint8Array` - Encode string to UTF-8 bytes
- `decodeUtf8(data: BufferSource): string` - Decode UTF-8 bytes to string

### ByteString

- `encodeByteString(data: DataSource): string` - Convert to byte string
- `decodeByteString(data: string): Uint8Array` - Convert byte string to Uint8Array

### Types

- `DataSource = string | BufferSource` - Input type for encoding functions

## Why Pure JS Base64?

The native `btoa`/`atob` functions have limitations:

1. **Latin1 restriction** - Only handles characters 0x00-0xFF
2. **Performance overhead** - Requires extra string↔bytes conversions

Benchmarks show the pure JS implementation is **1.6x-4.1x faster** for encoding and **1.1x-2.5x faster** for decoding.

## License

MIT
