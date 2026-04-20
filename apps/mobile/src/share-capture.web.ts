import type { RefObject } from 'react';
import { findNodeHandle, type View } from 'react-native';
import html2canvas from 'html2canvas';

export type ShareCardCaptureRef = RefObject<View | null>;

export type ShareCardImage = {
  uri: string;
  fileName: string;
  mimeType: 'image/png';
  file?: File;
  canAttach: boolean;
};

type WebShareData = {
  title?: string;
  text?: string;
  files?: File[];
};

type WebNavigator = {
  canShare?: (data: WebShareData) => boolean;
  share?: (data: WebShareData) => Promise<void>;
};

export async function captureShareCardImage(cardRef: ShareCardCaptureRef, fileName: string): Promise<ShareCardImage> {
  const element = resolveCardElement(cardRef);
  const sourceCanvas = await html2canvas(element, {
    backgroundColor: null,
    logging: false,
    scale: 3,
    useCORS: true,
  });
  const canvas = resizeCanvas(sourceCanvas, 1080, 1920);
  const uri = canvas.toDataURL('image/png', 1);
  const file = await dataUriToFile(uri, fileName);
  const canAttach = file ? canShareFiles(file) : false;

  return {
    uri,
    fileName,
    mimeType: 'image/png',
    file,
    canAttach,
  };
}

export async function shareImageWithSystem(image: ShareCardImage, text: string): Promise<boolean> {
  const webNavigator = getWebNavigator();

  if (!image.file || typeof webNavigator?.share !== 'function') {
    return false;
  }

  const shareData: WebShareData = {
    title: 'QR Imposto',
    text,
    files: [image.file],
  };

  if (typeof webNavigator.canShare === 'function' && !webNavigator.canShare(shareData)) {
    return false;
  }

  await webNavigator.share(shareData);
  return true;
}

export async function downloadShareCardImage(image: ShareCardImage): Promise<void> {
  const webDocument = globalThis.document;

  if (!webDocument) {
    throw new Error('web_document_unavailable');
  }

  const anchor = webDocument.createElement('a');
  anchor.href = image.uri;
  anchor.download = image.fileName;
  webDocument.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function resolveCardElement(cardRef: ShareCardCaptureRef): HTMLElement {
  const current = cardRef.current as unknown;

  if (current instanceof HTMLElement) {
    return current;
  }

  const node = findNodeHandle(cardRef.current) as unknown;

  if (node instanceof HTMLElement) {
    return node;
  }

  throw new Error('share_card_dom_node_unavailable');
}

function resizeCanvas(sourceCanvas: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('canvas_context_unavailable');
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(sourceCanvas, 0, 0, width, height);
  return canvas;
}

async function dataUriToFile(dataUri: string, fileName: string): Promise<File | undefined> {
  if (typeof File === 'undefined') {
    return undefined;
  }

  const response = await fetch(dataUri);
  const blob = await response.blob();
  return new File([blob], fileName, { type: 'image/png' });
}

function canShareFiles(file: File): boolean {
  const webNavigator = getWebNavigator();

  if (typeof webNavigator?.canShare !== 'function') {
    return false;
  }

  return webNavigator.canShare({ files: [file] });
}

function getWebNavigator(): WebNavigator | undefined {
  return globalThis.navigator as WebNavigator | undefined;
}
