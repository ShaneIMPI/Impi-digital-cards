import { toPng } from 'html-to-image'

function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ reports as Mac, but has touch support
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

// Ensures every <img> inside the card (logo, photo, QR code) is fully
// decoded before we snapshot it. Without this, fast taps or slower
// connections can catch an image mid-load and it renders blank in the
// exported PNG even though it displays fine on screen.
async function waitForImages(node) {
  const imgs = Array.from(node.querySelectorAll('img'))
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        return img.decode ? img.decode().catch(() => {}) : Promise.resolve()
      }
      return new Promise((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true })
        img.addEventListener('error', () => resolve(), { once: true })
      })
    })
  )
}

// Converts every <img> inside the card to an inline base64 data URI,
// temporarily, right on the live elements. html-to-image has its own
// internal logic for fetching and embedding remote images, but it isn't
// reliable in every environment — some images can silently come out
// blank even though they display fine on screen. Pre-inlining everything
// ourselves removes that uncertainty entirely: a data URI never needs any
// further fetching, so there's nothing left for the export step to get
// wrong. Returns a function that restores the original src values
// afterwards, so the live page is left exactly as it was.
async function inlineImages(node) {
  const imgs = Array.from(node.querySelectorAll('img'))
  const restoreList = []

  await Promise.all(
    imgs.map(async (img) => {
      if (img.src.startsWith('data:')) return // already inline (the QR code)
      try {
        const res = await fetch(img.src, { cache: 'force-cache' })
        const blob = await res.blob()
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        restoreList.push([img, img.getAttribute('src')])
        img.src = dataUrl
      } catch (err) {
        console.warn('Could not inline image for export:', img.src, err)
      }
    })
  )

  return function restore() {
    restoreList.forEach(([img, originalSrc]) => {
      img.setAttribute('src', originalSrc)
    })
  }
}

// Shows the generated image full-screen on the CURRENT page (no new tab or
// window), with instructions to tap-and-hold to save it. This avoids iOS
// Safari's popup-blocking quirks entirely, since nothing is opened.
function showImageOverlay(dataUrl, fileName) {
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(17,17,17,0.95);
    z-index: 999999; display: flex; flex-direction: column;
    align-items: center; padding: 24px 16px 40px; overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  `

  const instructions = document.createElement('p')
  instructions.textContent =
    'Tap and hold the image below, then choose "Save to Photos" or "Add to Photos".'
  instructions.style.cssText = `
    color: #fff; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 15px; text-align: center; margin: 8px 0 20px; max-width: 420px;
  `

  const img = document.createElement('img')
  img.src = dataUrl
  img.alt = fileName
  img.style.cssText = 'max-width: 100%; height: auto; border-radius: 10px;'

  const closeBtn = document.createElement('button')
  closeBtn.textContent = 'Done'
  closeBtn.type = 'button'
  closeBtn.style.cssText = `
    margin-top: 24px; background: #fff; color: #111; border: none;
    border-radius: 10px; padding: 14px 32px; font-size: 15px; font-weight: 700;
  `
  closeBtn.onclick = () => document.body.removeChild(overlay)

  overlay.appendChild(instructions)
  overlay.appendChild(img)
  overlay.appendChild(closeBtn)
  document.body.appendChild(overlay)
}

// Renders a DOM node (the card) to a PNG.
//
// Desktop browsers and Android Chrome: triggers a normal file download.
//
// iOS Safari doesn't reliably support forcing a file download, and popups
// opened after an async operation are unreliable too. Instead, we show the
// image full-screen on the same page, where the standard
// "tap and hold → Save to Photos" gesture works correctly.
export async function downloadCardAsPng(node, fileName) {
  if (!node) throw new Error('Card element not found.')

  const restoreImages = await inlineImages(node)
  try {
    await waitForImages(node)

    const dataUrl = await toPng(node, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: '#ffffff',
      // Exclude the Save/Download buttons themselves from the exported
      // image — the card should look the same whether printed or scanned,
      // with no UI chrome baked in (and no risk of catching a mid-loading
      // "Preparing…" state, since this callback re-checks per node as the
      // image renders).
      filter: (domNode) =>
        !(domNode.classList && domNode.classList.contains('card-action-row'))
    })

    if (isIOS()) {
      showImageOverlay(dataUrl, fileName)
      return
    }

    const a = document.createElement('a')
    a.href = dataUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } finally {
    restoreImages()
  }
}
