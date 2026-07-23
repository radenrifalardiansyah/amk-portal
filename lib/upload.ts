// Source file cap before resize/compression kicks in — just a safety ceiling
// against pathological uploads (e.g. an uncompressed scan) hanging the
// browser during decode; ordinary photos never get close to this.
export const MAX_SOURCE_MB = 5
export const SUPPORTED_IMAGE_FORMATS_LABEL = 'JPG, PNG, WebP, atau GIF'

export function validateImageFile(file: File): void {
  if (!file.type.startsWith('image/')) throw new Error('NOT_IMAGE')
  if (file.size > MAX_SOURCE_MB * 1024 * 1024) throw new Error('SOURCE_TOO_LARGE')
}

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

// Resizes down to fit within targetWidth x targetHeight before upload (saves
// bandwidth/time to Cloudinary, and keeps the stored file close to how it's
// actually displayed); Cloudinary itself handles further optimization/delivery,
// so unlike the old Firestore-embedded approach there's no need to also
// squeeze quality/bytes here. Never upscales past the source image.
async function resizeImage(file: File, targetWidth: number, targetHeight: number, cropToAspect?: boolean): Promise<Blob> {
  const dataUrl = await fileToDataUrl(file)
  const img = await loadImage(dataUrl)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return file

  // Center-crop the source to the target aspect ratio first (rather than
  // stretching), so upload targets that render in a fixed-ratio box (e.g. a
  // square admin icon or a 16:9 card) aren't distorted or letterboxed.
  let srcX = 0
  let srcY = 0
  let srcW = img.width
  let srcH = img.height
  if (cropToAspect) {
    const targetRatio = targetWidth / targetHeight
    const srcRatio = img.width / img.height
    if (srcRatio > targetRatio) {
      srcW = img.height * targetRatio
      srcX = (img.width - srcW) / 2
    } else {
      srcH = img.width / targetRatio
      srcY = (img.height - srcH) / 2
    }
  }

  const scale = Math.min(1, targetWidth / srcW, targetHeight / srcH)
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
  onProgress: ((percent: number) => void) | undefined,
  targetWidth: number,
  targetHeight: number,
  cropToAspect?: boolean,
): Promise<string> {
  validateImageFile(file)
  onProgress?.(5)
  const blob = await resizeImage(file, targetWidth, targetHeight, cropToAspect)
  onProgress?.(15)
  return uploadToCloudinary(blob, folder, onProgress)
}

export function uploadErrorMessage(err: unknown): string {
  const message = (err as { message?: string })?.message
  if (message === 'NOT_IMAGE') return 'File harus berupa gambar'
  if (message === 'SOURCE_TOO_LARGE') {
    return `Ukuran file maksimal ${MAX_SOURCE_MB}MB. Gunakan foto yang lebih kecil atau kompres dulu.`
  }
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
