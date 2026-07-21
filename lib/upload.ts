const MAX_DIMENSION = 1200

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// Some formats (e.g. HEIC/HEIF from iPhone/Mac) aren't decodable by <img> in
// most browsers: onload/onerror never fires, so without a timeout the upload
// would hang forever with no visible feedback.
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const timer = setTimeout(() => reject(new Error('IMAGE_DECODE_FAILED')), 15000)
    img.onload = () => { clearTimeout(timer); resolve(img) }
    img.onerror = () => { clearTimeout(timer); reject(new Error('IMAGE_DECODE_FAILED')) }
    img.src = src
  })
}

// PNG/WebP/GIF can carry transparency; re-encoding them as JPEG (no alpha
// channel) flattens transparent areas onto a black background, so those
// formats are kept as PNG instead of converted to JPEG.
function keepsTransparency(file: File): boolean {
  return file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/gif'
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('FILE_TOO_LARGE'))), type, quality)
  })
}

// Resizes down to MAX_DIMENSION before upload (saves bandwidth/time to Cloudinary);
// Cloudinary itself handles further optimization/delivery, so unlike the old
// Firestore-embedded approach there's no need to also squeeze quality/bytes here.
async function resizeImage(file: File, squareCrop?: boolean): Promise<Blob> {
  const dataUrl = await fileToDataUrl(file)
  const img = await loadImage(dataUrl)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return file

  // Center-crop to a square source rect first (rather than stretching), so a
  // non-square upload (e.g. for a favicon) still renders undistorted when a
  // browser/OS forces it into a square tile.
  const cropSize = squareCrop ? Math.min(img.width, img.height) : null
  const srcX = cropSize ? (img.width - cropSize) / 2 : 0
  const srcY = cropSize ? (img.height - cropSize) / 2 : 0
  const srcW = cropSize ?? img.width
  const srcH = cropSize ?? img.height

  const scale = Math.min(1, MAX_DIMENSION / Math.max(srcW, srcH))
  canvas.width = Math.round(srcW * scale)
  canvas.height = Math.round(srcH * scale)
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height)

  return keepsTransparency(file)
    ? canvasToBlob(canvas, 'image/png')
    : canvasToBlob(canvas, 'image/jpeg', 0.85)
}

// Unsigned upload preset: no API key/secret needed client-side. This is
// Cloudinary's recommended approach for apps without an upload backend, and
// matches this project's upload flow (browser -> storage -> Firestore write).
function uploadToCloudinary(blob: Blob, folder: string, onProgress?: (percent: number) => void): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  if (!cloudName || !uploadPreset) {
    return Promise.reject(new Error('CLOUDINARY_NOT_CONFIGURED'))
  }

  const formData = new FormData()
  formData.append('file', blob)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', folder)

  return new Promise((resolve, reject) => {
    // XMLHttpRequest (not fetch) so upload progress can drive the UI's progress bar.
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve(data.secure_url as string)
        } else {
          reject(new Error(data?.error?.message || 'UPLOAD_FAILED'))
        }
      } catch {
        reject(new Error('UPLOAD_FAILED'))
      }
    }
    xhr.onerror = () => reject(new Error('NETWORK_ERROR'))
    xhr.send(formData)
  })
}

export async function uploadMedia(
  file: File,
  folder: string,
  onProgress?: (percent: number) => void,
  squareCrop?: boolean,
): Promise<string> {
  onProgress?.(5)
  const blob = await resizeImage(file, squareCrop)
  onProgress?.(15)
  return uploadToCloudinary(blob, folder, onProgress)
}

export function uploadErrorMessage(err: unknown): string {
  const message = (err as { message?: string })?.message
  if (message === 'FILE_TOO_LARGE') return 'Foto terlalu besar untuk disimpan. Gunakan foto yang lebih kecil.'
  if (message === 'IMAGE_DECODE_FAILED') {
    return 'Format foto ini tidak didukung browser (mis. HEIC dari iPhone/Mac). Gunakan JPG atau PNG.'
  }
  if (message === 'CLOUDINARY_NOT_CONFIGURED') {
    return 'Layanan penyimpanan foto belum dikonfigurasi. Hubungi admin.'
  }
  if (message === 'NETWORK_ERROR') return 'Koneksi terputus saat mengunggah foto. Coba lagi.'
  return 'Gagal mengunggah foto. Coba lagi.'
}
