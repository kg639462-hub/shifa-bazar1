import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { adminSupabase, supabase, isSupabaseConfigured } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const uploadsDir = path.resolve(__dirname, '../uploads');

// Ensure local uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * POST /api/upload
 * Accepts base64 image data from laptop/device
 * Uploads to Supabase Storage (product-images bucket) or falls back to local uploads/
 */
router.post('/', async (req, res) => {
  try {
    const { image, filename } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data received from client',
      });
    }

    // Extract base64 buffer and mime type
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let contentType = 'image/jpeg';

    if (matches && matches.length === 3) {
      contentType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(image, 'base64');
    }

    const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg';
    const cleanFilename = (filename || `remedy-${Date.now()}`)
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.[^/.]+$/, '') + ext;

    // 1. Try uploading to Supabase Storage bucket ('product-images')
    const client = adminSupabase || supabase;
    if (isSupabaseConfigured() && client) {
      try {
        // Create public bucket if not present
        try {
          await client.storage.createBucket('product-images', { public: true });
        } catch (e) {
          // Bucket might already exist
        }

        const { data, error } = await client.storage
          .from('product-images')
          .upload(cleanFilename, buffer, {
            contentType,
            upsert: true,
          });

        if (!error && data) {
          const { data: publicData } = client.storage
            .from('product-images')
            .getPublicUrl(cleanFilename);

          if (publicData?.publicUrl) {
            console.log(`✅ [Supabase Storage] Image uploaded: ${publicData.publicUrl}`);
            return res.status(200).json({
              success: true,
              source: 'supabase_storage',
              url: publicData.publicUrl,
              filename: cleanFilename,
            });
          }
        } else if (error) {
          console.warn('Supabase storage upload notice:', error.message);
        }
      } catch (err) {
        console.warn('Supabase storage upload exception:', err.message);
      }
    }

    // 2. Fallback: Save directly to server/uploads/ directory
    const filePath = path.join(uploadsDir, cleanFilename);
    fs.writeFileSync(filePath, buffer);
    const localUrl = `/uploads/${cleanFilename}`;

    console.log(`📁 [Local Storage] Image saved to server: ${localUrl}`);
    return res.status(200).json({
      success: true,
      source: 'local_server',
      url: localUrl,
      filename: cleanFilename,
    });
  } catch (error) {
    console.error('Error processing image upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process image upload',
      error: error.message,
    });
  }
});

export default router;
