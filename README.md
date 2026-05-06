<p align="center">
  <img src="apps/mobile/assets/icon.png" width="96" alt="QR Imposto icon" />
</p>

# QR Imposto

QR Imposto is an open-source TypeScript mobile app that scans Brazilian NFC-e QR Codes and shows the approximate taxes included in a purchase.

Built with Expo, React Native, and a small TypeScript workspace, it keeps fiscal parsing and tax computation outside the UI so the core logic stays testable, reusable, and easy to review.

> [!NOTE]
> QR Imposto is available for Android only right now. The iOS version is pending.

## Download

Download the Android APK from GitHub Releases:

[Download QR Imposto for Android](https://github.com/richard-wollyce/qr-imposto/releases/download/v2.1.0/qr-imposto-v2.1.apk)

After downloading:

1. Allow Android to install the APK if your browser asks.
2. Open QR Imposto.
3. Grant camera permission.
4. Point the scanner at a supported NFC-e QR Code.

## Run Locally

```bash
git clone https://github.com/richard-wollyce/qr-imposto.git
cd qr-imposto
npm install
npm run android
```

Useful development commands:

```bash
npm run start
npm run typecheck
npm run test
npm run check
```

## Project Shape

- `apps/mobile` - Expo React Native app for Android.
- `packages/core` - shared types, currency formatting, tax computation, and display insight logic.
- `packages/parsers` - NFC-e URL validation, public page fetching, invoice parsing, and scan analysis.

The project is intentionally TypeScript-first: domain logic is isolated, covered by tests, and structured for contributors who care about readable, maintainable application code.
