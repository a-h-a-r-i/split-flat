/**
 * Cloudinary image upload utility
 * Uses unsigned upload preset — no API secret needed client-side
 *
 * SETUP REQUIRED in Cloudinary Dashboard:
 * 1. Go to https://cloudinary.com/console/settings/upload
 * 2. Click "Add upload preset"
 * 3. Set Preset name: splitflat_avatars
 * 4. Set Signing mode: Unsigned
 * 5. Set Folder: splitflat/avatars
 * 6. Save
 */

const CLOUD_NAME = 'diiii2qat';
const UPLOAD_PRESET = 'splitflat_avatars';

export async function uploadImageToCloudinary(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  // Compress image client-side before upload (max 800px, quality 0.8)
  const compressed = await compressImage(file, 800, 0.8);

  const formData = new FormData();
  formData.append('file', compressed);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'splitflat/avatars');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        resolve(res.secure_url as string);
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try {
          const err = JSON.parse(xhr.responseText);
          msg = err?.error?.message || msg;
        } catch {}
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

/** Compress image to max width/height using canvas */
async function compressImage(file: File, maxSize: number, quality: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality);
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}

/** Fallback: convert file to base64 data URL (for when Cloudinary isn't set up) */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
