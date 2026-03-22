<template>
  <Transition name="detail-slide">
    <div v-if="place" class="place-detail-overlay" @click.self="emit('close')">
      <div class="place-detail-panel">
        <!-- Header -->
        <div class="detail-header">
          <h2 class="detail-title">{{ place.name }}</h2>
          <button class="detail-close" @click="emit('close')">✕</button>
        </div>

        <!-- Photo carousel -->
        <div v-if="photos.length" class="detail-photos">
          <div class="detail-photos-scroll">
            <img
              v-for="(url, i) in photos"
              :key="i"
              :src="url"
              class="detail-photo"
              loading="lazy"
            />
          </div>
        </div>
        <div v-else-if="loadingDetails" class="detail-photos-skeleton">
          <div class="skeleton-box"></div>
          <div class="skeleton-box"></div>
        </div>

        <!-- Google info -->
        <div v-if="details" class="detail-google-info">
          <div v-if="details.rating" class="detail-rating">
            <span class="stars">
              <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(details.rating) }">★</span>
            </span>
            <span class="rating-text">{{ details.rating.toFixed(1) }}</span>
            <span v-if="details.ratingCount" class="rating-count">({{ details.ratingCount }} reviews)</span>
          </div>

          <div v-if="details.address" class="detail-address">
            📍 {{ details.address }}
          </div>

          <div v-if="details.openingHours.length" class="detail-hours">
            <button class="hours-toggle" @click="hoursOpen = !hoursOpen">
              🕐 Horarios {{ hoursOpen ? '▲' : '▼' }}
            </button>
            <div v-if="hoursOpen" class="hours-list">
              <div v-for="(line, i) in details.openingHours" :key="i" class="hours-line">{{ line }}</div>
            </div>
          </div>

          <div v-if="details.editorial" class="detail-editorial">
            {{ details.editorial }}
          </div>

          <!-- Reviews -->
          <div v-if="details.reviews.length" class="detail-reviews">
            <h4>Reviews</h4>
            <div v-for="(review, i) in details.reviews" :key="i" class="detail-review">
              <div class="review-header">
                <span class="review-author">{{ review.author }}</span>
                <span class="review-stars">
                  <span v-for="j in 5" :key="j" class="star" :class="{ filled: j <= review.rating }">★</span>
                </span>
                <span class="review-time">{{ review.time }}</span>
              </div>
              <div class="review-text">{{ review.text }}</div>
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loadingDetails && !details" class="detail-loading">
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line"></div>
        </div>

        <!-- Custom info (always shown) -->
        <div class="detail-custom">
          <div v-if="place.desc" class="detail-desc">{{ place.desc }}</div>

          <div v-if="place.time || place.dur" class="detail-time-info">
            <span v-if="place.time">🕐 {{ place.time }}</span>
            <span v-if="place.dur"> · {{ place.dur }}</span>
          </div>

          <div v-if="place.tags?.length" class="detail-tags">
            <span v-for="tag in place.tags" :key="tag" class="place-tag" :class="tag">
              {{ tagLabels[tag] || tag }}
            </span>
          </div>
        </div>

        <!-- Links -->
        <div class="detail-links">
          <a :href="gmapUrl" target="_blank" class="detail-link gmaps">📍 Google Maps</a>
          <a v-if="details?.website" :href="details.website" target="_blank" class="detail-link">🔗 Web oficial</a>
          <a v-else-if="place.link" :href="place.link" target="_blank" class="detail-link">🔗 Web</a>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useGooglePlaces } from '../composables/useGooglePlaces.js'

const props = defineProps({
  place: { type: Object, default: null },
  day: { type: Object, default: null },
})

const emit = defineEmits(['close'])
const { isAvailable, getPlaceDetails, getPhotoUrl, findPlaceByNameAndLocation } = useGooglePlaces()

const details = ref(null)
const photos = ref([])
const loadingDetails = ref(false)
const hoursOpen = ref(false)

const tagLabels = {
  obligatorio: '⭐ Obligatorio',
  gratis: '🆓 Gratis',
  reservar: '📞 Reservar',
  mirador: '🌅 Mirador',
}

const gmapUrl = computed(() =>
  props.place ? `https://www.google.com/maps/search/?api=1&query=${props.place.lat},${props.place.lng}` : '#'
)

watch(() => props.place, async (newPlace) => {
  details.value = null
  photos.value = []
  hoursOpen.value = false
  loadingDetails.value = false

  if (!newPlace || !isAvailable()) return

  loadingDetails.value = true

  try {
    let placeId = newPlace.googlePlaceId
    // If no googlePlaceId, try to find by name + location
    if (!placeId) {
      const found = await findPlaceByNameAndLocation(newPlace.name, newPlace.lat, newPlace.lng)
      if (found) placeId = found.googlePlaceId
    }

    if (placeId) {
      const d = await getPlaceDetails(placeId)
      if (d) {
        details.value = d
        photos.value = d.photos.map(p => getPhotoUrl(p, 400)).filter(Boolean)
      }
    }
  } catch (e) {
    console.warn('PlaceDetail fetch error:', e)
  } finally {
    loadingDetails.value = false
  }
}, { immediate: true })
</script>

<style scoped>
.place-detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 2500;
  background: rgba(0,0,0,.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

@media (min-width: 768px) {
  .place-detail-overlay {
    align-items: center;
    justify-content: flex-end;
    padding-right: 20px;
  }
}

.place-detail-panel {
  background: var(--surface);
  border-radius: 22px 22px 0 0;
  max-height: 85vh;
  width: 100%;
  overflow-y: auto;
  padding: 0 0 calc(20px + var(--safe-bottom));
  -webkit-overflow-scrolling: touch;
}

@media (min-width: 768px) {
  .place-detail-panel {
    border-radius: 16px;
    max-height: 80vh;
    width: 400px;
    padding-bottom: 20px;
  }
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 20px 12px;
  position: sticky;
  top: 0;
  background: var(--surface);
  z-index: 1;
}

.detail-title {
  font-family: 'DM Serif Display', serif;
  font-size: 20px;
  line-height: 1.2;
  flex: 1;
  margin-right: 12px;
}

.detail-close {
  background: var(--surface2);
  border: none;
  color: var(--text-dim);
  font-size: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.detail-close:hover { color: var(--text); }

/* Photos */
.detail-photos {
  padding: 0 20px;
  margin-bottom: 16px;
}
.detail-photos-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  scroll-snap-type: x mandatory;
}
.detail-photos-scroll::-webkit-scrollbar { display: none; }
.detail-photo {
  width: 200px;
  height: 150px;
  object-fit: cover;
  border-radius: 12px;
  flex-shrink: 0;
  scroll-snap-align: start;
}

.detail-photos-skeleton {
  display: flex;
  gap: 8px;
  padding: 0 20px;
  margin-bottom: 16px;
}
.skeleton-box {
  width: 200px;
  height: 150px;
  border-radius: 12px;
  background: var(--surface2);
  flex-shrink: 0;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

/* Google info */
.detail-google-info {
  padding: 0 20px;
  margin-bottom: 16px;
}

.detail-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.stars { display: flex; gap: 1px; }
.star { color: #444; font-size: 16px; }
.star.filled { color: #f7b731; }
.rating-text { font-weight: 700; font-size: 15px; }
.rating-count { color: var(--text-dim); font-size: 13px; }

.detail-address {
  font-size: 13px;
  color: var(--text-dim);
  margin-bottom: 8px;
}

.hours-toggle {
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  padding: 0;
  margin-bottom: 4px;
}
.hours-toggle:hover { color: var(--text); }
.hours-list {
  padding-left: 22px;
}
.hours-line {
  font-size: 12px;
  color: var(--text-dim);
  padding: 1px 0;
}

.detail-editorial {
  font-size: 13px;
  color: var(--text);
  line-height: 1.5;
  margin-top: 8px;
  padding: 10px 12px;
  background: var(--surface2);
  border-radius: 10px;
}

/* Reviews */
.detail-reviews {
  margin-top: 12px;
}
.detail-reviews h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-dim);
}
.detail-review {
  padding: 8px 0;
  border-bottom: 1px solid #2a2a3a;
}
.detail-review:last-child { border: none; }
.review-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.review-author { font-size: 12px; font-weight: 600; }
.review-stars { display: flex; gap: 0; }
.review-stars .star { font-size: 11px; }
.review-time { font-size: 11px; color: var(--text-dim); margin-left: auto; }
.review-text {
  font-size: 12px;
  color: var(--text-dim);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Loading */
.detail-loading {
  padding: 0 20px;
}
.skeleton-line {
  height: 14px;
  background: var(--surface2);
  border-radius: 6px;
  margin-bottom: 10px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
.skeleton-line.short { width: 60%; }

@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

/* Custom info */
.detail-custom {
  padding: 0 20px;
  margin-bottom: 12px;
}
.detail-desc {
  font-size: 13px;
  color: var(--text-dim);
  line-height: 1.5;
  margin-bottom: 8px;
}
.detail-time-info {
  font-size: 13px;
  color: var(--text);
  font-weight: 600;
  margin-bottom: 8px;
}
.detail-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* Links */
.detail-links {
  display: flex;
  gap: 10px;
  padding: 0 20px;
  flex-wrap: wrap;
}
.detail-link {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
}
.detail-link:hover { text-decoration: underline; }
.detail-link.gmaps { color: #34a853; }

/* Transition */
.detail-slide-enter-active { transition: all .3s ease; }
.detail-slide-leave-active { transition: all .2s ease; }
.detail-slide-enter-from { opacity: 0; }
.detail-slide-enter-from .place-detail-panel { transform: translateY(100%); }
.detail-slide-leave-to { opacity: 0; }
.detail-slide-leave-to .place-detail-panel { transform: translateY(40%); }

@media (min-width: 768px) {
  .detail-slide-enter-from .place-detail-panel { transform: translateX(100%); }
  .detail-slide-leave-to .place-detail-panel { transform: translateX(40%); }
}
</style>
