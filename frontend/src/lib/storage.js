/**
 * @module lib/storage
 * @description Supabase Storage helpers for CrossCrafted.
 * Replaces mock Unsplash uploads with real Supabase Storage.
 *
 * Buckets (create in Supabase Dashboard):
 *   - avatars   — Profile images
 *   - posts     — Post/testimony images
 *   - churches  — Church cover images
 *   - events    — Event cover images
 *   - marketplace — Marketplace product images
 *   - prayers   — Prayer images
 */

import { supabase } from '@/lib/supabase';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Upload a file to Supabase Storage.
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path within the bucket (e.g., 'user_123/avatar.jpg')
 * @param {File|Blob} file - The file to upload
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadFile(bucket, path, file) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error(`[Storage] Upload failed for ${bucket}/${path}:`, error.message);
    throw new Error(`Upload failed: ${error.message}`);
  }

  return {
    url: getPublicUrl(bucket, path),
    path: `${bucket}/${path}`,
  };
}

/**
 * Get a public URL for a file in Supabase Storage.
 * @param {string} bucket
 * @param {string} path
 * @returns {string}
 */
export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || '';
}

/**
 * Generate a signed URL for private files (valid for 1 hour).
 * @param {string} bucket
 * @param {string} path
 * @param {number} expiresIn - Seconds (default 3600)
 * @returns {Promise<string>}
 */
export async function getSignedUrl(bucket, path, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, { expiresIn });

  if (error) {
    if (IS_DEV) console.error('[Storage] Signed URL failed:', error.message);
    return getPublicUrl(bucket, path); // Fallback to public URL
  }

  return data?.signedUrl || getPublicUrl(bucket, path);
}

/**
 * Delete a file from Supabase Storage.
 * @param {string} bucket
 * @param {string[]} paths
 */
export async function deleteFiles(bucket, paths) {
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error && IS_DEV) {
    console.error('[Storage] Delete failed:', error.message);
  }
}

// ═══════════════════════════════════════════════════════════
// Convenience Uploaders
// ═══════════════════════════════════════════════════════════

/**
 * Upload a profile avatar image.
 * @param {string} userId
 * @param {File} file
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadAvatar(userId, file) {
  const ext = file.name?.split('.').pop() || 'jpg';
  const path = `${userId}/avatar.${ext}`;
  return uploadFile('avatars', path, file);
}

/**
 * Upload a post image.
 * @param {string} userId
 * @param {File} file
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadPostImage(userId, file) {
  const ext = file.name?.split('.').pop() || 'jpg';
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${userId}/${filename}`;
  return uploadFile('posts', path, file);
}

/**
 * Upload a church cover image.
 * @param {string} churchId
 * @param {File} file
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadChurchImage(churchId, file) {
  const ext = file.name?.split('.').pop() || 'jpg';
  const path = `${churchId}/cover.${ext}`;
  return uploadFile('churches', path, file);
}

/**
 * Upload an event cover image.
 * @param {string} eventId
 * @param {File} file
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadEventImage(eventId, file) {
  const ext = file.name?.split('.').pop() || 'jpg';
  const path = `${eventId}/cover.${ext}`;
  return uploadFile('events', path, file);
}

/**
 * Upload a marketplace product image.
 * @param {string} userId
 * @param {File} file
 * @param {number} index - Image index for multi-image products
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadProductImage(userId, file, index = 0) {
  const ext = file.name?.split('.').pop() || 'jpg';
  const filename = `${Date.now()}_${index}.${ext}`;
  const path = `${userId}/${filename}`;
  return uploadFile('marketplace', path, file);
}

/**
 * Upload a prayer image.
 * @param {string} userId
 * @param {File} file
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadPrayerImage(userId, file) {
  const ext = file.name?.split('.').pop() || 'jpg';
  const filename = `${Date.now()}.${ext}`;
  const path = `${userId}/${filename}`;
  return uploadFile('prayers', path, file);
}