export declare const ALLOWED_IMAGE_TYPES: string[];
export declare const ALLOWED_DOC_TYPES: string[];
export declare const ALLOWED_VIDEO_TYPES: string[];
export declare const ALLOWED_ALL_TYPES: string[];
export declare const IMAGE_MAX_SIZE: number;
export declare const VIDEO_MAX_SIZE: number;
export declare function validateFile(file: {
    name: string;
    type: string;
    size: number;
}, allowedTypes?: string[]): void;
export declare function checkMagicBytes(buffer: Uint8Array, mimeType: string): boolean;
export declare function sanitizeFilename(original: string): string;
