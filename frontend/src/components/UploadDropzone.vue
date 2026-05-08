<script setup>
import { ref } from 'vue'

const emit = defineEmits(['select'])

const isDragging = ref(false)
const validationError = ref('')

function isAllowed(file) {
  return ['image/png', 'image/jpeg'].includes(file?.type)
}

function selectFile(file) {
  validationError.value = ''
  if (!isAllowed(file)) {
    validationError.value = 'PNG 또는 JPG 이미지를 선택해 주세요.'
    return
  }
  emit('select', file)
}

function onDrop(event) {
  isDragging.value = false
  const [file] = event.dataTransfer.files
  selectFile(file)
}

function onInput(event) {
  const [file] = event.target.files
  selectFile(file)
  event.target.value = ''
}
</script>

<template>
  <label
    class="grid min-h-40 cursor-pointer place-items-center rounded-lg border bg-white p-6 text-center transition"
    :class="
      isDragging
        ? 'translate-y-[-1px] border-emerald-700 shadow-[0_0_0_4px_rgba(29,124,98,0.12)]'
        : 'border-slate-200'
    "
    @dragenter.prevent="isDragging = true"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
  >
    <input class="sr-only" type="file" accept="image/png,image/jpeg" @change="onInput" />
    <span class="mb-3 grid size-10 place-items-center rounded-full bg-emerald-50 text-3xl leading-none text-emerald-800">
      +
    </span>
    <span class="font-extrabold">PNG 또는 JPG 업로드</span>
    <span class="mt-1 text-sm text-slate-500">파일을 끌어오거나 클릭해서 선택하세요.</span>
    <span v-if="validationError" class="mt-2 text-sm text-orange-700">{{ validationError }}</span>
  </label>
</template>
