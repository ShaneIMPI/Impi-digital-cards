// Prepares an uploaded image before it is saved to the site:
//  - bakes in the correct orientation (fixes photos that appear rotated when
//    saved to a phone's contacts, because phones store rotation as hidden
//    EXIF data that contact apps ignore)
//  - shrinks very large phone photos so the upload does not fail
//  - re-encodes as a clean file with no hidden metadata

async function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // fall through to the <img> method below
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function normalizeImage(file, { maxSize = 1000, asPng = false } = {}) {
  try {
    const bitmap = await loadBitmap(file)
    const w = bitmap.width || bitmap.naturalWidth
    const h = bitmap.height || bitmap.naturalHeight
    const scale = Math.min(1, maxSize / Math.max(w, h))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d')
    if (!asPng) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const type = asPng ? 'image/png' : 'image/jpeg'
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.88))
    if (!blob) return { blob: file, ext: file.name.split('.').pop() }
    return { blob, ext: asPng ? 'png' : 'jpg' }
  } catch (err) {
    console.warn('Could not normalise image, uploading original.', err)
    return { blob: file, ext: file.name.split('.').pop() }
  }
}
