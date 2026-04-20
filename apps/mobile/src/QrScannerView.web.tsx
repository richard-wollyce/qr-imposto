import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Html5Qrcode } from 'html5-qrcode';
import type { QrScannerViewProps } from './QrScannerView.types';

const QR_REGION_ID = 'qr-reader';

export function QrScannerView({ active, onScan, onError, style }: QrScannerViewProps) {
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  const didScanRef = useRef(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    didScanRef.current = false;
    let isDisposed = false;

    const html5QrCode = new Html5Qrcode(QR_REGION_ID);

    html5QrCode.start(
      { facingMode: 'environment' },
      {
        fps: 10,
      },
      (decodedText) => {
        const data = decodedText.trim();
        if (!data || didScanRef.current) {
          return;
        }

        didScanRef.current = true;
        void html5QrCode.stop().catch(() => undefined);
        onScanRef.current(data);
      },
      () => {
        // Parse error on frame, simply ignore to continue scanning
      }
    ).catch((error) => {
      if (!isDisposed) {
         onErrorRef.current?.(cameraErrorMessage(error));
      }
    });

    return () => {
      isDisposed = true;
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => undefined);
      } else {
        html5QrCode.clear();
      }
    };
  }, [active]);

  return (
    <View pointerEvents="none" style={[styles.container, style]}>
      {/* @ts-ignore */}
      <div id={QR_REGION_ID} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </View>
  );
}

function cameraErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : undefined;

  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'A permissao da camera foi bloqueada pelo navegador. Libere a camera para escanear a NFC-e.';
  }

  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'Nao encontramos uma camera traseira disponivel neste navegador.';
  }

  return 'Nao foi possivel iniciar a camera neste navegador. Tente recarregar a pagina ou usar o app Android.';
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111111',
    overflow: 'hidden',
  },
});
