import { createElement, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import QrScanner from 'qr-scanner';
import type { CSSProperties } from 'react';
import type { QrScannerViewProps } from './QrScannerView.types';

const WORKER_PATH = '/qr-scanner-worker.min.js';
const MAX_SCANS_PER_SECOND = 15;
const SCAN_REGION_RATIO = 0.78;
const SCAN_REGION_DOWNSCALE = 480;

QrScanner.WORKER_PATH = WORKER_PATH;

export function QrScannerView({ active, onScan, onError, style }: QrScannerViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
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
    const video = videoRef.current;

    if (!active || !video) {
      return undefined;
    }

    let isDisposed = false;
    didScanRef.current = false;

    const scanner = new QrScanner(
      video,
      (result) => {
        const data = result.data.trim();

        if (!data || didScanRef.current) {
          return;
        }

        didScanRef.current = true;
        void scanner.pause(true).catch(() => undefined);
        onScanRef.current(data);
      },
      {
        calculateScanRegion,
        maxScansPerSecond: MAX_SCANS_PER_SECOND,
        onDecodeError: () => undefined,
        preferredCamera: 'environment',
        returnDetailedScanResult: true,
      },
    );

    scannerRef.current = scanner;

    scanner.start().catch((error) => {
      if (!isDisposed) {
        onErrorRef.current?.(cameraErrorMessage(error));
      }
    });

    return () => {
      isDisposed = true;
      scanner.destroy();

      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }
    };
  }, [active]);

  return (
    <View pointerEvents="none" style={[styles.container, style]}>
      {createElement('video', {
        autoPlay: true,
        muted: true,
        playsInline: true,
        ref: videoRef,
        style: videoStyle,
      })}
    </View>
  );
}

function calculateScanRegion(video: HTMLVideoElement): QrScanner.ScanRegion {
  const sourceWidth = video.videoWidth || video.clientWidth || SCAN_REGION_DOWNSCALE;
  const sourceHeight = video.videoHeight || video.clientHeight || sourceWidth;
  const size = Math.max(1, Math.floor(Math.min(sourceWidth, sourceHeight) * SCAN_REGION_RATIO));
  const downScaledSize = Math.min(size, SCAN_REGION_DOWNSCALE);

  return {
    x: Math.floor((sourceWidth - size) / 2),
    y: Math.floor((sourceHeight - size) / 2),
    width: size,
    height: size,
    downScaledWidth: downScaledSize,
    downScaledHeight: downScaledSize,
  };
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

const videoStyle: CSSProperties = {
  height: '100%',
  objectFit: 'cover',
  width: '100%',
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111111',
    overflow: 'hidden',
  },
});
