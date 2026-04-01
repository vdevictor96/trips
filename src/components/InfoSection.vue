<template>
  <div class="info-section">
    <h3>{{ title }}</h3>

    <div v-for="(item, i) in items" :key="i" class="info-item" style="position:relative;">
      <!-- Display mode -->
      <template v-if="editingIndex !== i">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div style="flex:1; min-width:0;">
            <strong>{{ item.label }}</strong>{{ separator }} <span v-html="item.value"></span>
          </div>
          <div style="display:flex; gap:4px; align-items:center; flex-shrink:0; margin-left:8px;">
            <button class="edit-btn" @click="startEdit(i)" title="Editar">✎</button>
            <button class="edit-btn" @click="remove(i)" title="Eliminar" style="color:var(--accent2);">✕</button>
          </div>
        </div>
      </template>

      <!-- Edit mode -->
      <template v-else>
        <div class="note-editor" @click.stop style="padding-top:4px;">
          <div class="editor-field">
            <label>Título</label>
            <input v-model="form.label" type="text" class="editor-input" placeholder="Título" ref="labelInput" />
          </div>
          <div class="editor-field">
            <label>Contenido</label>
            <textarea v-model="form.value" class="editor-input" rows="2" placeholder="Contenido (admite HTML para enlaces)"></textarea>
          </div>
          <div style="display:flex; gap:8px; margin-top:10px;">
            <button class="editor-btn save" @click="saveEdit(i)">Guardar</button>
            <button class="editor-btn cancel" @click="cancelEdit(i)">Cancelar</button>
          </div>
        </div>
      </template>
    </div>

    <button
      class="directions-btn"
      style="background:var(--surface2); box-shadow:none; font-size:13px; margin-top:8px;"
      @click="addNew"
    >
      + Añadir
    </button>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, computed } from 'vue'
import { useTripStore } from '../stores/trip.js'
import { useToast } from '../composables/useToast.js'

const props = defineProps({
  title: String,
  section: String,
  separator: { type: String, default: ':' },
})

const store = useTripStore()
const { showUndo } = useToast()
const editingIndex = ref(null)
const isNew = ref(false)
const form = reactive({ label: '', value: '' })

const items = computed(() => store.trip?.info?.[props.section] || [])

function focusLabel() {
  nextTick(() => {
    const el = document.querySelector('.note-editor .editor-input')
    el?.focus()
  })
}

function addNew() {
  const idx = store.addInfoItem(props.section)
  editingIndex.value = idx
  isNew.value = true
  form.label = ''
  form.value = ''
  focusLabel()
}

function startEdit(i) {
  isNew.value = false
  editingIndex.value = i
  form.label = items.value[i].label
  form.value = items.value[i].value
  focusLabel()
}

function saveEdit(i) {
  const prev = { label: items.value[i].label, value: items.value[i].value }
  store.updateInfoItem(props.section, i, { label: form.label, value: form.value })
  editingIndex.value = null
  if (!isNew.value) {
    showUndo('Item editado', () => {
      store.updateInfoItem(props.section, i, prev)
    })
  }
  isNew.value = false
}

function cancelEdit(i) {
  if (isNew.value && !items.value[i].label && !items.value[i].value) {
    store.removeInfoItem(props.section, i)
  }
  editingIndex.value = null
  isNew.value = false
}

function remove(i) {
  const removed = { ...items.value[i] }
  store.removeInfoItem(props.section, i)
  editingIndex.value = null
  isNew.value = false
  showUndo('Item eliminado', () => {
    if (!store.trip.info[props.section]) store.trip.info[props.section] = []
    store.trip.info[props.section].splice(i, 0, removed)
    store.updateInfoItem(props.section, i, removed)
  })
}
</script>
