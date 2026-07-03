const MAX_DIMENSION = 1600
const TARGET_BYTES = 700 * 1024 // stay well under Firestore's 1 MiB document limit

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

async function compressImage(file: File, onProgress?: (percent: number) => void): Promise<string> {
  const dataUrl = await fileToDataUrl(file)
  onProgress?.(30)
  const img = await loadImage(dataUrl)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl

  let scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
  const render = (s: number) => {
    canvas.width = Math.round(img.width * s)
    canvas.height = Math.round(img.height * s)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  }
  render(scale)
  onProgress?.(60)

  let output: string
  if (keepsTransparency(file)) {
    output = canvas.toDataURL('image/png')
    while (output.length > TARGET_BYTES * 1.37 && scale > 0.2) {
      scale -= 0.15
      render(scale)
      output = canvas.toDataURL('image/png')
    }
  } else {
    let quality = 0.85
    output = canvas.toDataURL('image/jpeg', quality)
    while (output.length > TARGET_BYTES * 1.37 && quality > 0.35) {
      quality -= 0.1
      output = canvas.toDataURL('image/jpeg', quality)
    }
  }
  onProgress?.(90)

  if (output.length > TARGET_BYTES * 1.37) {
    throw new Error('FILE_TOO_LARGE')
  }
  return output
}

// Stores the image as a base64 data URL directly in the Firestore document,
// avoiding Firebase Storage (which requires a paid Blaze plan).
export async function uploadMedia(
  file: File,
  _folder: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  onProgress?.(10)
  const url = await compressImage(file, onProgress)
  onProgress?.(100)
  return url
}

export function uploadErrorMessage(err: unknown): string {
  const message = (err as { message?: string })?.message
  if (message === 'FILE_TOO_LARGE') return 'Foto terlalu besar untuk disimpan. Gunakan foto yang lebih kecil.'
  if (message === 'IMAGE_DECODE_FAILED') {
    return 'Format foto ini tidak didukung browser (mis. HEIC dari iPhone/Mac). Gunakan JPG atau PNG.'
  }
  return 'Gagal mengunggah foto. Coba lagi.'
}
