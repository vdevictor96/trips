<template>
  <div class="login-gate">
    <form class="login-card" @submit.prevent="submit">
      <h1>Nuestros viajes</h1>
      <p>Introduce tus credenciales para continuar</p>
      <input
        v-model="email"
        type="email"
        autocomplete="email"
        placeholder="Email"
        :disabled="loading"
      />
      <input
        v-model="password"
        type="password"
        autocomplete="current-password"
        placeholder="Contraseña"
        :disabled="loading"
        autofocus
      />
      <button type="submit" :disabled="loading || !email || !password">
        {{ loading ? 'Entrando…' : 'Entrar' }}
      </button>
      <p v-if="error" class="login-error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth.js'

const { login } = useAuth()
// El email se prefija desde el .env si existe, pero es editable.
const email = ref(import.meta.env.VITE_AUTH_EMAIL || '')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  if (!email.value || !password.value) return
  loading.value = true
  error.value = ''
  const res = await login(email.value, password.value)
  loading.value = false
  if (!res.ok) {
    error.value = 'Email o contraseña incorrectos'
    password.value = ''
  }
}
</script>

<style scoped>
.login-gate {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--bg);
}
.login-card {
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 28px 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 8px 32px var(--shadow-color);
  text-align: center;
}
.login-card h1 {
  margin: 0;
  font-size: 22px;
  color: var(--text);
}
.login-card p {
  margin: 0;
  font-size: 14px;
  color: var(--text-dim);
}
.login-card input {
  width: 100%;
  padding: 12px 14px;
  font-size: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--text);
  box-sizing: border-box;
}
.login-card button {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: var(--radius);
  background: var(--accent);
  color: #fff;
  cursor: pointer;
}
.login-card button:disabled {
  opacity: 0.5;
  cursor: default;
}
.login-error {
  color: var(--accent);
  font-weight: 600;
}
</style>
