<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
        <span class="toast-message">{{ toast.message }}</span>
        <button v-if="toast.undoFn" class="toast-undo" @click="handleUndo(toast)">Deshacer</button>
        <button class="toast-close" @click="dismiss(toast.id)">✕</button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup>
import { useToast } from '../composables/useToast.js'
const { toasts, dismiss, handleUndo } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  width: 90%;
  max-width: 380px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  background: #2a2a4a;
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(0,0,0,.4);
  pointer-events: all;
  border: 1px solid #3a3a5a;
}

.toast-message {
  flex: 1;
}

.toast-undo {
  background: none;
  border: none;
  color: var(--accent);
  font-weight: 700;
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  padding: 2px 6px;
  white-space: nowrap;
}
.toast-undo:hover { text-decoration: underline; }

.toast-close {
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 14px;
  cursor: pointer;
  padding: 2px 4px;
  line-height: 1;
}

.toast-enter-active { transition: all .3s ease; }
.toast-leave-active { transition: all .2s ease; }
.toast-enter-from { opacity: 0; transform: translateY(20px); }
.toast-leave-to { opacity: 0; transform: translateY(10px); }
</style>
