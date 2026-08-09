import { toPng } from 'html-to-image'

function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ reports as Mac, but has touch support
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
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
}
