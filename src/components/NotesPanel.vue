<template>
  <div>
    <h2 class="day-header">Notas</h2>
    <p class="day-subtitle">Notas libres para el viaje</p>

    <button class="directions-btn" style="background:var(--surface2); box-shadow:none; font-size:14px; margin-bottom:12px;" @click="addNew">
      + Nueva nota
    </button>

    <draggable
      v-model="notes"
      item-key="id"
      handle=".drag-handle"
      ghost-class="place-card-ghost"
      :animation="150"
    >
      <template #item="{ element }">
        <div class="place-card" style="border-left-color:var(--accent); position:relative;">
          <!-- Display mode -->
          <template v-if="editingId !== element.id">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div style="flex:1; min-width:0;">
                <div class="place-name" style="font-size:15px;">
                  {{ element.title || 'Sin título' }}
                </div>
                <div v-if="element.desc" class="place-desc" style="margin-top:2px;">{{ element.desc }}</div>
              </div>
              <div style="display:flex; gap:4px; align-items:center; flex-shrink:0; margin-left:8px;">
                <button class="edit-btn" @click="startEdit(element)" title="Editar">✎</button>
                <button class="edit-btn" @click="removeNote(element)" title="Eliminar" style="color:var(--accent2);">✕</button>
                <span class="drag-handle">≡</span>
              </div>
            </div>
            <div v-if="element.link" class="place-links" style="margin-top:6px;">
              <a :href="element.link" target="_blank" @click.stop>🔗 Web</a>
            </div>
            <div class="place-time" style="color:var(--text-dim); margin-top:6px;">{{ element.created }}</div>
          </template>

          <!-- Edit mode -->
          <template v-else>
            <div class="note-editor" @click.stop style="padding-top:4px;">
              <div class="editor-field">
                <label>Título</label>
                <input v-model="form.title" type="text" class="editor-input" placeholder="Título de la nota" />
              </div>
              <div class="editor-field">
                <label>Descripción</label>
                <textarea v-model="form.desc" class="editor-input" rows="3" placeholder="Descripción opcional..."></textarea>
              </div>
              <div class="editor-field">
                <label>Enlace</label>
                <input v-model="form.link" type="url" class="editor-input" placeholder="https://..." />
              </div>
              <div style="display:flex; gap:8px; margin-top:10px;">
                <button class="editor-btn save" @click="saveEdit(element)">Guardar</button>
                <button class="editor-btn cancel" @click="cancelEdit(element)">Cancelar</button>
                <button class="editor-btn remove" @click="removeNote(element)">Eliminar</button>
              </div>
            </div>
          </template>
        </div>
      </template>
    </draggable>

    <div v-if="!store.trip?.notes?.length" class="place-desc" style="text-align:center; padding:20px;">
      No hay notas todavía. Pulsa "+ Nueva nota" para añadir una.
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { useTripStore } from '../stores/trip.js'
import { useToast } from '../composables/useToast.js'
import draggable from 'vuedraggable'

const store = useTripStore()
const { showUndo } = useToast()
const editingId = ref(null)
const isNewNote = ref(false)

const form = reactive({ title: '', desc: '', link: '' })

function focusTitleInput() {
  nextTick(() => {
    const el = document.querySelector('.note-editor .editor-input')
    el?.focus()
  })
}

const notes = computed({
  get: () => store.trip?.notes || [],
  set: (newNotes) => store.reorderNotes(newNotes)
})

function addNew() {
  const id = store.addNote('')
  startEditById(id)
  isNewNote.value = true
}

function startEdit(note) {
  isNewNote.value = false
  editingId.value = note.id
  form.title = note.title || ''
  form.desc = note.desc || ''
  form.link = note.link || ''
  focusTitleInput()
}

function startEditById(id) {
  const note = store.trip.notes.find(n => n.id === id)
  if (note) startEdit(note)
  else {
    // Note just created, fields are empty
    editingId.value = id
    form.title = ''
    form.desc = ''
    form.link = ''
    focusTitleInput()
  }
}

function saveEdit(note) {
  const prev = { title: note.title, desc: note.desc, link: note.link }
  store.updateNote(note.id, { title: form.title, desc: form.desc, link: form.link })
  isNewNote.value = false
  editingId.value = null
  if (!isNewNote.value || prev.title || prev.desc) {
    showUndo('Nota editada', () => {
      store.updateNote(note.id, prev)
    })
  }
}

function cancelEdit(note) {
  if (isNewNote.value && !note.title && !note.desc && !note.link) {
    // New empty note — remove it silently
    store.removeNote(note.id)
  }
  isNewNote.value = false
  editingId.value = null
}

function removeNote(note) {
  const removedNote = { ...note }
  const idx = store.trip.notes.indexOf(store.trip.notes.find(n => n.id === note.id))
  editingId.value = null
  isNewNote.value = false
  store.removeNote(note.id)
  showUndo('Nota eliminada', () => {
    if (!store.trip.notes) store.trip.notes = []
    store.trip.notes.splice(idx, 0, removedNote)
    store.reorderNotes([...store.trip.notes])
  })
}
</script>
