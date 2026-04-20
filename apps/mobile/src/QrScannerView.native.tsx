import { useCallback } from 'react';
import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import type { QrScannerViewProps } from './QrScannerView.types';

export function QrScannerView({ active, onScan, style }: QrScannerViewProps) {
  const handleBarcodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (data) {
        onScan(data);
      }
    },
    [onScan],
  );

  if (!active) {
    return null;
  }

  return (
    <CameraView
      style={style}
      facing="back"
      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      onBarcodeScanned={handleBarcodeScanned}
    />
  );
}
