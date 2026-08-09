import { toPng } from 'html-to-image'

function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ reports as Mac, but has touch support
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

// Renders a DOM node (the card) to a PNG.
//
// Desktop browsers and Android Chrome: triggers a normal file download.
//
// iOS Safari doesn't reliably support forcing a file download from a data
// URL — tapping usually does nothing, or briefly opens the image without
// saving it. Instead, we open the image in a new tab, where the standard
// "tap and hold → Save to Photos" gesture works correctly.
export async function downloadCardAsPng(node, fileName) {
  if (!node) throw new Error('Card element not found.')

  const dataUrl = await toPng(node, {
    pixelRatio: 3,
    cacheBust: true,
    backgroundColor: '#ffffff'
  })

  if (isIOS()) {
    const win = window.open()
    if (!win) {
      throw new Error(
        'Your browser blocked the pop-up. Please allow pop-ups for this site and try again.'
      )
    }
    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${fileName}</title>
          <style>
            body { margin: 0; background: #111; display: flex; flex-direction: column; align-items: center; }
            p { color: #fff; font-family: -apple-system, sans-serif; font-size: 15px; padding: 16px; text-align: center; margin: 0; }
            img { max-width: 100%; height: auto; display: block; }
          </style>
        </head>
        <body>
          <p>Tap and hold the image below, then choose "Save to Photos" or "Add to Photos".</p>
          <img src="${dataUrl}" alt="${fileName}" />
        </body>
      </html>
    `)
    win.document.close()
    return
  }

  const a = document.createElement('a')
  a.href = dataUrl
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
