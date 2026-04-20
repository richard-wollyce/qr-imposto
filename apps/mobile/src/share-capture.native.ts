import type { RefObject } from 'react';
import type { View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

export type ShareCardCaptureRef = RefObject<View | null>;

export type ShareCardImage = {
  uri: string;
  fileName: string;
  mimeType: 'image/png';
  canAttach: boolean;
};

export async function captureShareCardImage(cardRef: ShareCardCaptureRef, fileName: string): Promise<ShareCardImage> {
  if (!cardRef.current) {
    throw new Error('share_card_ref_unavailable');
  }

  const uri = await captureRef(cardRef, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    width: 1080,
    height: 1920,
  });

  return {
    uri,
    fileName,
    mimeType: 'image/png',
    canAttach: true,
  };
}

export async function shareImageWithSystem(image: ShareCardImage, _text?: string): Promise<boolean> {
  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    return false;
  }

  await Sharing.shareAsync(image.uri, {
    mimeType: image.mimeType,
    UTI: 'public.png',
    dialogTitle: 'Compartilhar card do QR Imposto',
  });

  return true;
}

export async function downloadShareCardImage(image: ShareCardImage): Promise<void> {
  const didShare = await shareImageWithSystem(image);

  if (!didShare) {
    throw new Error('sharing_unavailable');
  }
}
