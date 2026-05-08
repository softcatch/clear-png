<script setup>
defineProps({
  canDownload: {
    type: Boolean,
    default: false,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  saveMessage: {
    type: String,
    default: '',
  },
  shareUrl: {
    type: String,
    default: '',
  },
  shareQrUrl: {
    type: String,
    default: '',
  },
  shareExpiresAt: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['download'])
</script>

<template>
  <section class="grid gap-4 rounded-lg border border-slate-200 bg-white p-4">
    <div>
      <h2 class="mb-2 text-base font-extrabold">내보내기</h2>
      <p class="mb-0 text-sm text-slate-500">
        PNG를 다운로드하면 같은 파일이 Supabase에 저장되고 24시간용 QR이 바로 준비됩니다.
      </p>
    </div>

    <button
      class="min-h-10 rounded-md bg-[#17201c] px-4 font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="!canDownload || isSaving"
      @click="emit('download')"
    >
      {{ isSaving ? '다운로드 및 QR 준비 중' : 'PNG 다운로드하기' }}
    </button>

    <p v-if="saveMessage" class="mb-0 text-sm text-slate-600">{{ saveMessage }}</p>

    <div v-if="shareQrUrl" class="grid gap-3 rounded-md bg-slate-50 p-3">
      <img class="mx-auto size-[220px]" :src="shareQrUrl" alt="다운로드 공유 QR 코드" />
      <a class="break-all text-sm font-semibold text-emerald-800 underline" :href="shareUrl" target="_blank" rel="noreferrer">
        {{ shareUrl }}
      </a>
      <p v-if="shareExpiresAt" class="mb-0 text-xs text-slate-500">
        만료: {{ new Date(shareExpiresAt).toLocaleString() }}
      </p>
    </div>
  </section>
</template>
