<script setup>
defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <section class="grid gap-4 rounded-lg border border-slate-200 bg-white p-4">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-base font-extrabold">최근 QR</h2>
      <span v-if="loading" class="text-sm text-slate-500">불러오는 중</span>
    </div>

    <ul v-if="items.length" class="grid gap-2">
      <li v-for="item in items" :key="item.id" class="grid gap-1 rounded-md bg-slate-50 p-3">
        <span class="truncate font-bold">{{ item.original_file_name }}</span>
        <time class="text-xs text-slate-500">{{ new Date(item.created_at).toLocaleString() }}</time>
        <span class="text-xs text-slate-500">만료: {{ new Date(item.expires_at).toLocaleString() }}</span>
      </li>
    </ul>
    <p v-else class="mb-0 text-sm text-slate-500">아직 생성된 QR 링크가 없습니다.</p>
  </section>
</template>
