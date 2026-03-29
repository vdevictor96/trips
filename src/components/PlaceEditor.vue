<template>
  <div class="place-editor" @click.stop style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border);">
    <div class="editor-field">
      <label>Nombre</label>
      <input v-model="form.name" type="text" class="editor-input" />
    </div>
    <div class="editor-field">
      <label>Descripción</label>
      <textarea v-model="form.desc" class="editor-input" rows="2"></textarea>
    </div>
    <div style="display:flex; gap:8px;">
      <div class="editor-field" style="flex:1;">
        <label>Hora</label>
        <input v-model="form.time" type="time" class="editor-input" />
      </div>
      <div class="editor-field" style="flex:1;">
        <label>Duración</label>
        <input v-model="form.dur" type="text" class="editor-input" placeholder="30 min" />
      </div>
    </div>
    <div class="editor-field">
      <label>Web</label>
      <input v-model="form.link" type="url" class="editor-input" placeholder="https://..." />
    </div>
    <div class="editor-field">
      <label>Tags</label>
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <button
          v-for="tag in availableTags"
          :key="tag.id"
          class="tag-toggle"
          :class="{ active: form.tags.includes(tag.id) }"
          @click="toggleTag(tag.id)"
        >
          {{ tag.label }}
        </button>
      </div>
    </div>
    <div style="display:flex; gap:8px; margin-top:10px;">
      <button class="editor-btn save" @click="save">Guardar</button>
      <button class="editor-btn cancel" @click="emit('cancel')">Cancelar</button>
      <button class="editor-btn remove" @click="confirmRemove">Eliminar</button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const props = defineProps({
  place: { type: Object, required: true },
  day: { type: Object, required: true },
})

const emit = defineEmits(['save', 'cancel', 'remove'])

const form = reactive({
  name: props.place.name,
  desc: props.place.desc,
  time: props.place.time,
  dur: props.place.dur,
  link: props.place.link || '',
  tags: [...(props.place.tags || [])],
})

const availableTags = [
  { id: 'obligatorio', label: '⭐ Obligatorio' },
  { id: 'gratis', label: '🆓 Gratis' },
  { id: 'reservar', label: '📞 Reservar' },
  { id: 'mirador', label: '🌅 Mirador' },
]

function toggleTag(tagId) {
  const idx = form.tags.indexOf(tagId)
  if (idx === -1) form.tags.push(tagId)
  else form.tags.splice(idx, 1)
}

function save() {
  emit('save', {
    name: form.name,
    desc: form.desc,
    time: form.time,
    dur: form.dur,
    link: form.link || undefined,
    tags: [...form.tags],
  })
}

function confirmRemove() {
  emit('remove')
}
</script>

<style scoped>
.tag-toggle {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1.5px solid var(--border);
  background: transparent;
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all .15s;
}
.tag-toggle.active {
  background: rgba(240,194,122,.2);
  border-color: var(--accent);
  color: var(--accent);
}
</style>
