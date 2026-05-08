<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { triggerPngDownload } from '@/composables/useImageProcessor'
import { fetchSharedConversion } from '@/services/conversionService'

const props = defineProps({
  token: {
    type: String,
    required: true,
  },
})

const loading = ref(true)
const error = ref('')
const conversion = ref(null)
const isDownloading = ref(false)

async function loadSharedFile() {
  loading.value = true
  error.value = ''

  try {
    conversion.value = await fetchSharedConversion(props.token)
  } catch {
    error.value = '링크가 만료되었거나 파일을 찾을 수 없습니다.'
  } finally {
    loading.value = false
  }
}

async function downloadSharedFile() {
  if (!conversion.value?.publicUrl || isDownloading.value) return

  isDownloading.value = true
  try {
    const response = await fetch(conversion.value.publicUrl)
    if (!response.ok) throw new Error('Download failed')

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const baseName = conversion.value.original_file_name.replace(/\.[^.]+$/, '')
    triggerPngDownload(objectUrl, `${baseName || 'clearpng'}-transparent.png`)
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  } catch {
    window.location.href = conversion.value.publicUrl
  } finally {
    isDownloading.value = false
  }
}

onMounted(loadSharedFile)
</script>

<template>
  <main class="mx-auto grid min-h-screen w-full max-w-3xl place-items-center bg-[#f5f7f4] px-4 py-8 text-[#17201c]">
    <section class="grid w-full gap-5 rounded-lg border border-slate-200 bg-white p-5">
      <div>
        <p class="mb-2 text-xs font-extrabold uppercase text-emerald-700">ClearPNG</p>
        <h1 class="text-2xl font-extrabold">공유된 PNG 다운로드</h1>
      </div>

      <div v-if="loading" class="rounded-md bg-slate-50 p-5 text-center text-slate-500">
        파일을 불러오는 중입니다.
      </div>

      <div v-else-if="error" class="grid gap-4 rounded-md bg-orange-50 p-5 text-orange-800">
        <p class="mb-0">{{ error }}</p>
        <RouterLink class="font-extrabold underline" to="/">이미지 만들기</RouterLink>
      </div>

      <div v-else-if="conversion" class="grid gap-4">
        <div class="transparent-checkerboard grid min-h-[320px] place-items-center rounded-md p-4">
          <img class="max-h-[60vh] max-w-full object-contain" :src="conversion.publicUrl" :alt="conversion.original_file_name" />
        </div>
        <div class="grid gap-2 sm:flex sm:items-center sm:justify-between">
          <div class="min-w-0">
            <p class="mb-1 truncate font-bold">{{ conversion.original_file_name }}</p>
            <p class="mb-0 text-sm text-slate-500">만료: {{ new Date(conversion.expires_at).toLocaleString() }}</p>
          </div>
          <button
            class="inline-flex min-h-10 items-center justify-center rounded-md bg-[#17201c] px-4 font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            :disabled="isDownloading"
            @click="downloadSharedFile"
          >
            {{ isDownloading ? 'PNG 다운로드 중' : 'PNG 다운로드' }}
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
