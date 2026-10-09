import crypto from 'crypto'
import path from 'path'

export type SafeFileExtension = '.pdf' | '.jpg' | '.jpeg' | '.png' | '.webp'

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

/**
 * Validates file magic bytes against a strict allowlist:
 * - PDF: %PDF- (0x25 0x50 0x44 0x46)
 * - JPEG: 0xFF 0xD8 0xFF
 * - PNG: \x89PNG (0x89 0x50 0x4E 0x47)
 * - WEBP: RIFF....WEBP (0x52 0x49 0x46 0x46 at offset 0, 0x57 0x45 0x42 0x50 at offset 8)
 */
export function validateFileMagicBytes(buffer: Buffer): { valid: boolean; ext: SafeFileExtension | null; mime: string | null } {
  if (!buffer || buffer.length < 12) {
    return { valid: false, ext: null, mime: null }
  }

  // Check PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { valid: true, ext: '.pdf', mime: 'application/pdf' }
  }

  // Check JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, ext: '.jpg', mime: 'image/jpeg' }
  }

  // Check PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { valid: true, ext: '.png', mime: 'image/png' }
  }

  // Check WEBP (RIFF header + WEBP signature at offset 8)
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { valid: true, ext: '.webp', mime: 'image/webp' }
  }

  return { valid: false, ext: null, mime: null }
}

/** Compute SHA-256 hash for document integrity and duplicate detection. */
export function computeSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/** Generates a safe server-side storage filename: UUID + verified extension. */
export function generateSafeStorageFilename(ext: SafeFileExtension): string {
  return `${crypto.randomUUID()}${ext}`
}

/** Sanitize filename to prevent path traversal or null byte injection. */
export function sanitizePathFilename(filename: string): string {
  const safeName = path.basename(filename).replace(/[\x00-\x1F\x7F<>:"/\\|?*]/g, '')
  return safeName.replace(/\.\./g, '')
}
