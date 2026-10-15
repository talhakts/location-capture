import fs from 'node:fs';
import path from 'node:path';
import { LocalMedia } from '../types';
import { addLocalMedia } from '../database/db';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export function sanitizeFilename(filename: string): string {
  // Strip path traversal attempts and special characters
  const basename = path.basename(filename);
  const clean = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return clean || 'imported_asset';
}

export interface SaveImportedMediaParams {
  projectId: string;
  sourceReferenceId?: string;
  originalFilename: string;
  mimeType: string;
  buffer: Buffer;
  licenceSnapshot?: string;
  attributionSnapshot?: string;
  notes?: string;
}

export function saveImportedMedia(params: SaveImportedMediaParams): LocalMedia {
  if (!ALLOWED_MIME_TYPES.has(params.mimeType.toLowerCase())) {
    throw new Error(
      `Unsupported file type "${params.mimeType}". Allowed types: JPEG, PNG, WebP, MP4, QuickTime, WebM.`
    );
  }

  if (params.buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size (${(params.buffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds the 50MB limit.`
    );
  }

  // Application-managed storage directory inside public for accessible browser preview
  const sanitizedName = sanitizeFilename(params.originalFilename);
  const mediaStorageDir = path.join(process.cwd(), 'public', 'imported-media', params.projectId);

  if (!fs.existsSync(mediaStorageDir)) {
    fs.mkdirSync(mediaStorageDir, { recursive: true });
  }

  const timestamp = Date.now();
  const uniqueFilename = `${timestamp}_${sanitizedName}`;
  const targetFilePath = path.join(mediaStorageDir, uniqueFilename);

  // Path traversal check
  const resolvedTarget = path.resolve(targetFilePath);
  const resolvedDir = path.resolve(mediaStorageDir);
  if (!resolvedTarget.startsWith(resolvedDir)) {
    throw new Error('Security violation: Attempted path traversal.');
  }

  fs.writeFileSync(resolvedTarget, params.buffer);

  const localRelativePath = `/imported-media/${params.projectId}/${uniqueFilename}`;
  const now = new Date().toISOString();
  const id = `media_${timestamp}_${Math.random().toString(36).slice(2, 7)}`;

  const record: LocalMedia = {
    id,
    projectId: params.projectId,
    sourceReferenceId: params.sourceReferenceId,
    localRelativePath,
    originalFilename: params.originalFilename,
    mediaType: params.mimeType,
    fileSizeBytes: params.buffer.length,
    importedAt: now,
    licenceSnapshot: params.licenceSnapshot,
    attributionSnapshot: params.attributionSnapshot,
    notes: params.notes,
  };

  return addLocalMedia(record);
}
