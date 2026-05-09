// src/lib/pdfRenderer.js
// Renders PDF pages to canvas using PDF.js
// Falls back gracefully on CORS or load errors

import * as pdfjsLib from 'pdfjs-dist'

// Set worker - use CDN to avoid bundling issues
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

/**
 * Render a specific page of a PDF to a canvas element
 * @param {string} url - PDF URL
 * @param {HTMLCanvasElement} canvas - Target canvas
 * @param {number} pageNum - Page number (1-based)
 * @param {number} scale - Render scale (1.0 = original size)
 * @returns {Promise<{width, height}>} - Rendered dimensions
 */
export async function renderPdfPage(url, canvas, pageNum = 1, scale = 1.5) {
  const loadingTask = pdfjsLib.getDocument({
    url,
    // Disable range requests which can cause issues with some servers
    disableRange: true,
    disableStream: true,
  })

  const pdf = await loadingTask.promise
  const page = await pdf.getPage(pageNum)
  const viewport = page.getViewport({ scale })

  canvas.width = viewport.width
  canvas.height = viewport.height

  const ctx = canvas.getContext('2d')
  await page.render({ canvasContext: ctx, viewport }).promise

  return { width: viewport.width, height: viewport.height, pageCount: pdf.numPages }
}

/**
 * Render first page of PDF to a data URL (for thumbnails)
 * @param {string} url - PDF URL
 * @param {number} maxWidth - Max thumbnail width in px
 * @returns {Promise<string|null>} - Data URL or null on failure
 */
export async function renderPdfThumbnail(url, maxWidth = 400) {
  try {
    const canvas = document.createElement('canvas')
    const { width } = await renderPdfPage(url, canvas, 1, 1.0)
    // Scale down if needed
    if (width > maxWidth) {
      const scale = maxWidth / width
      const smallCanvas = document.createElement('canvas')
      const result = await renderPdfPage(url, smallCanvas, 1, scale)
      return smallCanvas.toDataURL('image/jpeg', 0.85)
    }
    return canvas.toDataURL('image/jpeg', 0.85)
  } catch (e) {
    console.log('PDF thumbnail failed:', e.message)
    return null
  }
}

export function isPdf(url) {
  if (!url) return false
  const lower = url.toLowerCase()
  return lower.includes('.pdf') ||
    lower.includes('application/pdf') ||
    lower.includes('drive.google.com') ||
    lower.includes('dropbox.com')
}
