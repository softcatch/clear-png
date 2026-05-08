<script setup>
defineProps({
  originalUrl: {
    type: String,
    default: '',
  },
  resultUrl: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: 'idle',
  },
})
</script>

<template>
  <section class="grid gap-4 lg:grid-cols-2" aria-label="이미지 미리보기">
    <article class="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h2 class="text-base font-extrabold">원본</h2>
      </div>
      <div class="grid min-h-[300px] place-items-center bg-slate-100 p-5 text-center text-slate-500 lg:min-h-[420px]">
        <img v-if="originalUrl" class="max-h-[62vh] max-w-full object-contain" :src="originalUrl" alt="업로드한 원본 이미지" />
        <p v-else>업로드한 이미지가 여기에 표시됩니다.</p>
      </div>
    </article>

    <article class="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h2 class="text-base font-extrabold">결과 PNG</h2>
        <span
          v-if="status === 'processing' || status === 'loading'"
          class="rounded-full bg-emerald-50 px-2 py-1 text-xs font-extrabold text-emerald-800"
        >
          처리 중
        </span>
      </div>
      <div class="transparent-checkerboard grid min-h-[300px] place-items-center p-5 text-center text-slate-500 lg:min-h-[420px]">
        <img v-if="resultUrl" class="max-h-[62vh] max-w-full object-contain" :src="resultUrl" alt="투명 배경으로 변환된 결과 이미지" />
        <p v-else>투명 PNG 결과가 여기에 표시됩니다.</p>
      </div>
    </article>
  </section>
</template>
