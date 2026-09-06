/**
 * Cloudinary image upload utility
 * Uses unsigned upload preset — no API secret needed client-side
 *
 * Setup: In Cloudinary Console → Settings → Upload → Add upload preset
 *   - Preset name: splitflat_avatars
 *   - Signing mode: Unsigned
 *   - Folder: splitflat/avatars
 */

const CLOUD_NAME = 'diiii2qat';
const UPLOAD_PRESET = 'splitflat_avatars'; // Create this in your Cloudinary dashboard

export async function uploadImageToCloudinary(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
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
        // Return the secure URL
        resolve(res.secure_url as string);
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}
