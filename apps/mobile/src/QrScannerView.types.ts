import type { StyleProp, ViewStyle } from 'react-native';

export type QrScannerViewProps = {
  active: boolean;
  onScan: (data: string) => void;
  onError?: (message: string) => void;
  style?: StyleProp<ViewStyle>;
};
