import { computed, reactive, ref } from 'vue'
import { DEFAULT_SETTINGS, canvasToPngBlob, removeCheckerboardBackground } from '@/utils/checkerboardRemoval'

function revokeUrl(url) {
  if (url) URL.revokeObjectURL(url)
}

export function triggerPngDownload(url, filename = 'clearpng-transparent.png') {
  if (!url) return

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

async function readImage(file) {
  const url = URL.createObjectURL(file)
  const image = new Image()
  image.decoding = 'async'
  image.src = url

  try {
    await image.decode()
    return { image, url }
  } catch {
    revokeUrl(url)
    throw new Error('이미지를 읽을 수 없습니다. PNG 또는 JPG 파일인지 확인해 주세요.')
  }
}

export function useImageProcessor() {
  const originalFile = ref(null)
  const originalUrl = ref('')
  const resultUrl = ref('')
  const resultBlob = ref(null)
  const status = ref('idle')
  const error = ref('')
  const detection = ref(null)
  const settings = reactive({ ...DEFAULT_SETTINGS })

  const isProcessing = computed(() => status.value === 'loading' || status.value === 'processing')
  const canDownload = computed(() => Boolean(resultBlob.value && resultUrl.value))

  async function loadFile(file) {
    error.value = ''
    detection.value = null
    resultBlob.value = null
    revokeUrl(resultUrl.value)
    resultUrl.value = ''

    if (!file || !['image/png', 'image/jpeg'].includes(file.type)) {
      status.value = 'error'
      error.value = 'PNG 또는 JPG 파일만 업로드할 수 있습니다.'
      return
    }

    originalFile.value = file
    revokeUrl(originalUrl.value)
    originalUrl.value = URL.createObjectURL(file)
    await processFile()
  }

  async function processFile() {
    if (!originalFile.value) return

    status.value = 'loading'
    error.value = ''

    try {
      const { image, url } = await readImage(originalFile.value)
      status.value = 'processing'

      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) throw new Error('이 브라우저에서 Canvas 처리를 시작할 수 없습니다.')

      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0)

      const input = context.getImageData(0, 0, canvas.width, canvas.height)
      const processed = removeCheckerboardBackground(input, settings)
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.putImageData(processed.imageData, 0, 0)

      const blob = await canvasToPngBlob(canvas)
      revokeUrl(resultUrl.value)
      resultBlob.value = blob
      resultUrl.value = URL.createObjectURL(blob)
      detection.value = processed
      status.value = processed.detected ? 'done' : 'warning'
      error.value = ''
      revokeUrl(url)
    } catch (processError) {
      status.value = 'error'
      error.value = processError.message || '이미지 처리 중 문제가 발생했습니다.'
    }
  }

  function downloadResult() {
    if (!resultUrl.value || !originalFile.value) return

    const baseName = originalFile.value.name.replace(/\.[^.]+$/, '')
    triggerPngDownload(resultUrl.value, `${baseName || 'clearpng'}-transparent.png`)
  }

  return {
    originalFile,
    originalUrl,
    resultUrl,
    resultBlob,
    status,
    error,
    detection,
    settings,
    isProcessing,
    canDownload,
    loadFile,
    processFile,
    downloadResult,
  }
}
