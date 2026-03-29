<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="confirm-overlay" @click.self="$emit('cancel')">
        <div class="confirm-card">
          <div class="confirm-icon" :class="{ danger }">{{ danger ? '⚠️' : 'ℹ️' }}</div>
          <h3 class="confirm-title">{{ title }}</h3>
          <p class="confirm-message">{{ message }}</p>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" @click="$emit('cancel')">{{ cancelText }}</button>
            <button class="confirm-btn" :class="danger ? 'danger' : 'primary'" @click="$emit('confirm')">{{ confirmText }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: 'Confirmar' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: 'Confirmar' },
  cancelText: { type: String, default: 'Cancelar' },
  danger: { type: Boolean, default: false },
})

defineEmits(['confirm', 'cancel'])
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--overlay-bg);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.confirm-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 28px 24px 20px;
  max-width: 340px;
  width: 100%;
  text-align: center;
}

.confirm-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.confirm-title {
  font-family: 'DM Serif Display', serif;
  font-size: 20px;
  color: var(--text);
  margin-bottom: 8px;
}

.confirm-message {
  font-size: 14px;
  color: var(--text-dim);
  line-height: 1.5;
  margin-bottom: 20px;
}

.confirm-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.confirm-btn {
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.confirm-btn:active {
  opacity: 0.8;
}

.confirm-btn.cancel {
  background: var(--surface2);
  color: var(--text-dim);
}

.confirm-btn.primary {
  background: var(--accent);
  color: var(--bg);
}

.confirm-btn.danger {
  background: var(--accent2);
  color: #fff;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .confirm-card,
.modal-leave-active .confirm-card {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .confirm-card {
  transform: scale(0.95);
}

.modal-leave-to .confirm-card {
  transform: scale(0.95);
}
</style>
