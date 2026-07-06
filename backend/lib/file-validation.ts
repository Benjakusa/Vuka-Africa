import crypto from 'crypto';
import { ValidationError } from './errors';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
export const ALLOWED_ALL_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES, ...ALLOWED_VIDEO_TYPES];

export const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
export const VIDEO_MAX_SIZE = 50 * 1024 * 1024;

const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  'image/jpeg': [new Uint8Array([0xFF, 0xD8, 0xFF])],
  'image/png': [new Uint8Array([0x89, 0x50, 0x4E, 0x47])],
  'image/webp': [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
  'application/pdf': [new Uint8Array([0x25, 0x50, 0x44, 0x46])],
  'video/mp4': [new Uint8Array([0x00, 0x00, 0x00, 0x1C, 0x66, 0x74, 0x79, 0x70])],
  'video/webm': [new Uint8Array([0x1A, 0x45, 0xDF, 0xA3])],
};

function getMaxSize(mimeType: string): number {
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return VIDEO_MAX_SIZE;
  return IMAGE_MAX_SIZE;
}

export function validateFile(file: { name: string; type: string; size: number }, allowedTypes: string[] = ALLOWED_ALL_TYPES): void {
  if (!file.name || file.name.length > 255) {
    throw new ValidationError('Invalid file name');
  }

  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError(`File type "${file.type}" is not allowed. Accepted: ${allowedTypes.join(', ')}`);
  }

  const maxSize = getMaxSize(file.type);
  if (file.size > maxSize) {
    throw new ValidationError(`File exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
  }

  if (file.size === 0) {
    throw new ValidationError('File is empty');
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'mp4', 'webm'];
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new ValidationError(`File extension ".${extension}" is not allowed`);
  }
}

export function checkMagicBytes(buffer: Uint8Array, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;

  return signatures.some(sig => {
    const len = Math.min(sig.length, buffer.length);
    for (let i = 0; i < len; i++) {
      if (buffer[i] !== sig[i]) return false;
    }
    return true;
  });
}

export function sanitizeFilename(original: string): string {
  const extension = original.split('.').pop()?.toLowerCase() || 'bin';
  const uuid = crypto.randomUUID();
  return `${uuid}.${extension}`;
}
