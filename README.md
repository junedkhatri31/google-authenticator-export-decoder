# Google Authenticator Export Decoder

Interactive web application for recovering account details from Google Authenticator migration QR codes. Scan the export directly with your camera to reveal TOTP/HOTP secrets, copy the generated otpauth URI, or display an authenticator-ready QR code.

👉 **Live demo:** https://authenticator-export-decoder.juned.site

> **Notice**  
> This project is an independent community effort and is **not affiliated with Google or the Google Authenticator team**. All decoding occurs locally in your browser; nothing is uploaded to any server.

## Features

- **Live camera scanning** powered by [`qr-scanner`](https://github.com/nimiq/qr-scanner) with camera switching support.
- **Automated protobuf decoding** of Google Authenticator migration payloads (SHA1/256/512, TOTP & HOTP).
- **Instant otpauth export** — copy the URI or render a scannable QR code per account.
- **Privacy-first UX** with clear trust indicators and an offline-friendly build.
- Modern React 19 + TypeScript + Vite setup with Tailwind-based styling.

## Getting Started

### Prerequisites

- Node.js 20+
- PNPM 9+ (or adapt the commands to npm/yarn)

### Installation

```bash
pnpm install
```

### Development Server

```bash
pnpm dev
```

Visit http://localhost:5173/ and grant camera access when prompted.

### Production Build

```bash
pnpm build
pnpm preview
```

The `build` command emits a static bundle in `dist/` that can be hosted on any static site provider.

## Usage

1. Open the app and choose the preferred camera (rear cameras are recommended on mobile).
2. Click **Start Scanning** and present the Google Authenticator export QR code.
3. Once decoded, review the account list:
   - `Secret (Base32)` is ready for other TOTP/HOTP apps.
   - Use **Show QR Code** to display an otpauth QR code along with a copyable otpauth URI.
4. Select **Scan Another Code** to process additional migration exports.

## Tech Stack

- [React 19](https://react.dev/)
- [Vite 7](https://vite.dev/)
- [Tailwind via `@tailwindcss/vite`](https://tailwindcss.com/)
- [qr-scanner](https://github.com/nimiq/qr-scanner) for camera scanning
- [protobufjs](https://github.com/protobufjs/protobuf.js) for decoding migration payloads
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) for otpauth exports

## License & Contributions

This project is provided without warranty. Contributions, bug reports, and feature requests are welcome — please open an issue or submit a pull request.
