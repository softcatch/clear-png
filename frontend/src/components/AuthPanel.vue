<script setup>
import { onMounted, ref } from 'vue'
import {
  getCurrentUser,
  isSupabaseConfigured,
  signInWithPassword,
  signOut as signOutUser,
  signUpWithPassword,
} from '@/services/authService'

const emit = defineEmits(['session-change'])

const email = ref('')
const password = ref('')
const user = ref(null)
const message = ref('')
const loading = ref(false)

async function refreshUser() {
  user.value = await getCurrentUser()
  emit('session-change', user.value)
}

async function signIn() {
  loading.value = true
  message.value = ''
  try {
    user.value = await signInWithPassword({
      email: email.value,
      password: password.value,
    })
    emit('session-change', user.value)
  } catch (error) {
    message.value = error.message || '로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

async function signUp() {
  loading.value = true
  message.value = ''
  try {
    await signUpWithPassword({
      email: email.value,
      password: password.value,
    })
    message.value = '가입 확인 후 로그인할 수 있습니다.'
  } catch (error) {
    message.value = error.message || '가입에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

async function signOut() {
  try {
    await signOutUser()
  } finally {
    user.value = null
    emit('session-change', null)
  }
}

onMounted(refreshUser)
</script>

<template>
  <section class="grid gap-4 rounded-lg border border-slate-200 bg-white p-4">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-base font-extrabold">계정</h2>
      <span v-if="!isSupabaseConfigured" class="rounded-full bg-orange-50 px-2 py-1 text-xs font-extrabold text-orange-700">
        env 필요
      </span>
    </div>

    <div v-if="user" class="flex items-center justify-between gap-3">
      <span class="truncate text-sm font-semibold text-slate-700">{{ user.email }}</span>
      <button class="min-h-10 rounded-md border border-slate-300 bg-white px-4 font-extrabold text-slate-900" @click="signOut">
        로그아웃
      </button>
    </div>

    <form v-else class="grid gap-3" @submit.prevent="signIn">
      <input v-model="email" class="min-h-10 rounded-md border border-slate-300 px-3" type="email" placeholder="email@example.com" autocomplete="email" />
      <input v-model="password" class="min-h-10 rounded-md border border-slate-300 px-3" type="password" placeholder="password" autocomplete="current-password" />
      <div class="grid gap-2 sm:flex">
        <button class="min-h-10 rounded-md bg-[#17201c] px-4 font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50" :disabled="loading">
          로그인
        </button>
        <button
          class="min-h-10 rounded-md border border-slate-300 bg-white px-4 font-extrabold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          :disabled="loading"
          @click="signUp"
        >
          가입
        </button>
      </div>
    </form>

    <p v-if="message" class="mb-0 text-sm text-slate-600">{{ message }}</p>
  </section>
</template>
