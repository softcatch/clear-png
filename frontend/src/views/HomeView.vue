<script setup>
import { computed, ref } from 'vue'
import QRCode from 'qrcode'
import DownloadPanel from '@/components/DownloadPanel.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import UploadDropzone from '@/components/UploadDropzone.vue'
import { useImageProcessor } from '@/composables/useImageProcessor'
import { uploadConversionAssets } from '@/services/conversionService'

const processor = useImageProcessor()
const isSaving = ref(false)
const saveMessage = ref('')
const shareUrl = ref('')
const shareQrUrl = ref('')
const shareExpiresAt = ref('')

const canShare = computed(() => Boolean(processor.originalFile.value && processor.resultBlob.value))

function resetShareState() {
  saveMessage.value = ''
  shareUrl.value = ''
  shareQrUrl.value = ''
  shareExpiresAt.value = ''
}

async function handleFileSelect(file) {
  resetShareState()
  await processor.loadFile(file)
}

async function downloadAndShareConversion() {
  if (!processor.canDownload.value) return

  processor.downloadResult()
  if (!canShare.value || shareUrl.value || isSaving.value) return

  isSaving.value = true
  saveMessage.value = 'QR 링크를 준비하고 있습니다.'

  try {
    const saved = await uploadConversionAssets({
      originalFile: processor.originalFile.value,
      processedBlob: processor.resultBlob.value,
      settings: { ...processor.settings },
    })

    shareUrl.value = saved.downloadUrl || `${window.location.origin}/share/${saved.shareToken}`
    shareExpiresAt.value = saved.expiresAt
    shareQrUrl.value = await QRCode.toDataURL(shareUrl.value, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 220,
    })
    saveMessage.value = '24시간 동안 사용할 수 있는 QR 링크가 준비되었습니다.'
  } catch (error) {
    saveMessage.value = error.message || 'Supabase 저장 중 문제가 발생했습니다.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-[1440px] bg-[#f5f7f4] px-4 py-5 text-[#17201c] sm:px-6">
    <header class="grid gap-4 pb-6 pt-2 lg:flex lg:items-end lg:justify-between">
      <div>
        <p class="mb-2 text-xs font-extrabold uppercase text-emerald-700">ClearPNG</p>
        <h1 class="max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl">
          격자 패턴 배경 이미지를 투명 PNG로 변환
        </h1>
      </div>
      <div class="text-sm font-semibold text-slate-500">브라우저 Canvas 기반 처리</div>
    </header>

    <section class="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div class="grid gap-4">
        <UploadDropzone @select="handleFileSelect" />

        <div
          v-if="processor.error.value"
          class="rounded-lg border px-4 py-3 text-sm"
          :class="
            processor.status.value === 'warning'
              ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
              : 'border-orange-200 bg-orange-50 text-orange-800'
          "
        >
          {{ processor.error.value }}
        </div>

        <ImagePreview
          :original-url="processor.originalUrl.value"
          :result-url="processor.resultUrl.value"
          :status="processor.status.value"
        />
      </div>

      <aside class="grid gap-4">
        <DownloadPanel
          :can-download="processor.canDownload.value"
          :is-saving="isSaving"
          :save-message="saveMessage"
          :share-url="shareUrl"
          :share-qr-url="shareQrUrl"
          :share-expires-at="shareExpiresAt"
          @download="downloadAndShareConversion"
        />
      </aside>
    </section>
  </main>
</template>
